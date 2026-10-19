import { Router } from 'express';
import { Lead, Property, PUBLIC_PROPERTY_STATUSES } from '../../models/index.js';

export const statsRouter = Router();

// Brand-level numbers that come from outside the database (partner network,
// survey score). Live numbers are added on top so the band grows with real data.
const BASELINE = { salesVolume: 480_000_000, listings: 1180, partnerAgencies: 32, satisfaction: 98 };

/** GET /stats/public — numbers for the homepage trust band. Cached at the edge for 10 minutes. */
statsRouter.get('/public', async (_req, res) => {
  const [sales, listings] = await Promise.all([
    Lead.aggregate([{ $match: { status: 'won' } }, { $group: { _id: null, value: { $sum: '$dealValue' } } }]),
    Property.countDocuments({ status: { $in: PUBLIC_PROPERTY_STATUSES } }),
  ]);

  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  res.json({
    data: {
      salesVolume: BASELINE.salesVolume + (sales[0]?.value ?? 0),
      activeListings: BASELINE.listings + listings,
      partnerAgencies: BASELINE.partnerAgencies,
      satisfaction: BASELINE.satisfaction,
    },
  });
});
