import { Router } from 'express';
import { Lead, Property, Customer, LEAD_STAGES, OPEN_LEAD_STAGES } from '../../models/index.js';
import { requireStaff } from '../../middleware/auth.js';
import { addDays, dayRange, startOfMonth } from '../../utils/dates.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireStaff);

/** Percent change, or null when there is no previous value to compare with. */
function delta(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * GET /dashboard/overview — everything the CRM home screen needs in one round trip.
 * Agents get numbers for their own book of business; admins get the whole company.
 */
dashboardRouter.get('/overview', async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const mine = (field) => (isAdmin ? {} : { [field]: req.user._id });

  const now = new Date();
  const d30 = addDays(now, -30);
  const d60 = addDays(now, -60);
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(addDays(monthStart, -1));
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const { start: todayStart, end: todayEnd } = dayRange(now);

  const leadScope = mine('assignedTo');

  const [
    availableProperties,
    newLeads,
    prevNewLeads,
    activeClients,
    salesThisMonth,
    salesLastMonth,
    salesByMonth,
    leadsBySource,
    funnel,
    closedCounts,
    followUps,
    recentLeads,
  ] = await Promise.all([
    Property.countDocuments({ status: 'available', ...mine('agent') }),
    Lead.countDocuments({ ...leadScope, createdAt: { $gte: d30 } }),
    Lead.countDocuments({ ...leadScope, createdAt: { $gte: d60, $lt: d30 } }),
    // An active client is a customer with at least one lead still in progress
    Lead.distinct('customer', { ...leadScope, status: { $in: OPEN_LEAD_STAGES }, customer: { $ne: null } }).then(
      async (ids) => ids.length + (await Customer.countDocuments({ ...mine('assignedAgent'), _id: { $nin: ids }, updatedAt: { $gte: d30 } })),
    ),
    Lead.aggregate([
      { $match: { ...leadScope, status: 'won', closedAt: { $gte: monthStart } } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$dealValue' } } },
    ]),
    Lead.aggregate([
      { $match: { ...leadScope, status: 'won', closedAt: { $gte: lastMonthStart, $lt: monthStart } } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$dealValue' } } },
    ]),
    Lead.aggregate([
      { $match: { ...leadScope, status: 'won', closedAt: { $gte: yearAgo } } },
      {
        $group: {
          _id: { y: { $year: '$closedAt' }, m: { $month: '$closedAt' } },
          value: { $sum: '$dealValue' },
          count: { $sum: 1 },
        },
      },
    ]),
    Lead.aggregate([
      { $match: { ...leadScope, createdAt: { $gte: yearAgo } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Lead.aggregate([{ $match: leadScope }, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: { $ifNull: ['$dealValue', 0] } } } }]),
    Lead.aggregate([
      { $match: { ...leadScope, status: { $in: ['won', 'lost'] }, closedAt: { $gte: yearAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Open leads whose follow-up is due today or overdue
    Lead.find({ ...leadScope, status: { $in: OPEN_LEAD_STAGES }, followUpDate: { $lt: todayEnd } })
      .sort({ followUpDate: 1 })
      .limit(12)
      .select('name status followUpDate property')
      .populate('property', 'title')
      .lean(),
    Lead.find(leadScope)
      .sort({ createdAt: -1 })
      .limit(6)
      .select('name email source status createdAt property assignedTo')
      .populate('property', 'title')
      .populate('assignedTo', 'name avatar')
      .lean(),
  ]);

  // Fill all 12 months so the chart has no gaps
  const monthly = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(yearAgo.getFullYear(), yearAgo.getMonth() + i, 1);
    const hit = salesByMonth.find((s) => s._id.y === d.getFullYear() && s._id.m === d.getMonth() + 1);
    // Build "YYYY-MM" from local parts: toISOString() would shift to UTC and mislabel the month
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly.push({ month, value: hit?.value ?? 0, count: hit?.count ?? 0 });
  }

  const funnelMap = new Map(funnel.map((f) => [f._id, f]));
  const won = closedCounts.find((c) => c._id === 'won')?.count ?? 0;
  const lost = closedCounts.find((c) => c._id === 'lost')?.count ?? 0;
  const thisMonth = salesThisMonth[0] ?? { count: 0, value: 0 };
  const lastMonth = salesLastMonth[0] ?? { count: 0, value: 0 };

  res.json({
    data: {
      scope: isAdmin ? 'company' : 'mine',
      kpis: {
        availableProperties,
        newLeads: { value: newLeads, delta: delta(newLeads, prevNewLeads) },
        activeClients,
        sales: { count: thisMonth.count, value: thisMonth.value, delta: delta(thisMonth.value, lastMonth.value) },
        conversionRate: won + lost ? Math.round((won / (won + lost)) * 100) : null,
      },
      salesByMonth: monthly,
      leadsBySource: leadsBySource.map((s) => ({ source: s._id, count: s.count })),
      pipeline: LEAD_STAGES.map((stage) => ({
        stage,
        count: funnelMap.get(stage)?.count ?? 0,
        value: funnelMap.get(stage)?.value ?? 0,
      })),
      followUps: followUps.map((l) => ({ ...l, overdue: l.followUpDate < todayStart })),
      recentLeads,
    },
  });
});
