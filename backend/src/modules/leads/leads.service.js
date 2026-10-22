import { Lead, User, Customer, Property, OPEN_LEAD_STAGES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';

/**
 * Picks who handles a new lead:
 *   1. the listing agent of the property, if active
 *   2. otherwise the active agent with the fewest open leads (round-robin by load)
 *   3. otherwise an admin, so nothing is ever unassigned
 */
export async function pickAssignee(propertyId) {
  if (propertyId) {
    const property = await Property.findById(propertyId).select('agent').populate('agent', 'active role');
    const agent = property?.agent;
    if (agent?.active && (agent.role === 'agent' || agent.role === 'admin')) return agent._id;
  }

  const agents = await User.find({ role: 'agent', active: true }).select('_id').lean();
  if (agents.length) {
    const loads = await Lead.aggregate([
      { $match: { status: { $in: OPEN_LEAD_STAGES }, assignedTo: { $in: agents.map((a) => a._id) } } },
      { $group: { _id: '$assignedTo', open: { $sum: 1 } } },
    ]);
    const openBy = new Map(loads.map((l) => [String(l._id), l.open]));
    agents.sort((a, b) => (openBy.get(String(a._id)) ?? 0) - (openBy.get(String(b._id)) ?? 0));
    return agents[0]._id;
  }

  const admin = await User.findOne({ role: 'admin', active: true }).select('_id').lean();
  return admin?._id;
}

/** Creates (or reuses, matched by email) the Customer for a lead. */
export async function convertToCustomer(lead, actorId) {
  let customer = lead.customer ? await Customer.findById(lead.customer) : null;
  customer ??= await Customer.findOne({ email: lead.email });

  if (!customer) {
    const property = lead.property ? await Property.findById(lead.property).lean() : null;
    customer = new Customer({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      type: lead.intent === 'rent' || property?.purpose === 'rent' ? 'renter' : 'buyer',
      assignedAgent: lead.assignedTo,
      requirements: property
        ? { locations: [property.location.city], types: [property.type], bedrooms: property.bedrooms }
        : {},
    });
  }

  if (!customer.leads.some((id) => String(id) === String(lead._id))) customer.leads.push(lead._id);
  if (!customer.assignedAgent) customer.assignedAgent = lead.assignedTo;
  await customer.save();

  if (!lead.customer) {
    lead.customer = customer._id;
    lead.activity.push({ type: 'converted', to: customer.name, by: actorId });
  }
  return customer;
}

/**
 * Moves a lead through the pipeline and applies side effects:
 *   won  → customer created, deal recorded, property marked sold/rented
 *   lost → reason stored
 * Re-opening a won/lost lead clears the close data.
 */
export async function changeStage(lead, { stage, dealValue, lostReason }, actorId) {
  if (lead.status === stage) return lead;
  const from = lead.status;

  lead.status = stage;
  lead.activity.push({ type: 'stage', from, to: stage, by: actorId });

  if (stage === 'won') {
    lead.dealValue = dealValue;
    lead.closedAt = new Date();
    lead.lostReason = undefined;

    const customer = await convertToCustomer(lead, actorId);
    customer.deals = customer.deals.filter((d) => String(d.lead) !== String(lead._id));
    customer.deals.push({ property: lead.property, lead: lead._id, value: dealValue, closedAt: lead.closedAt });
    await customer.save();

    if (lead.property) {
      const property = await Property.findById(lead.property);
      if (property) {
        property.status = property.purpose === 'rent' ? 'rented' : 'sold';
        await property.save();
      }
    }
  } else if (stage === 'lost') {
    lead.lostReason = lostReason;
    lead.closedAt = new Date();
  } else {
    // Back to an open stage: undo the close
    if (from === 'won') await reopenWonLead(lead);
    lead.closedAt = undefined;
    lead.lostReason = undefined;
  }

  await lead.save();
  return lead;
}

async function reopenWonLead(lead) {
  if (lead.customer) {
    await Customer.updateOne({ _id: lead.customer }, { $pull: { deals: { lead: lead._id } } });
  }
  if (lead.property) {
    await Property.updateOne({ _id: lead.property, status: { $in: ['sold', 'rented'] } }, { status: 'under_offer' });
  }
}

export async function assertAssignable(userId) {
  const user = await User.findById(userId).select('role active').lean();
  if (!user || !user.active || !['agent', 'admin'].includes(user.role)) {
    throw HttpError.badRequest('Leads can only be assigned to active agents');
  }
}
