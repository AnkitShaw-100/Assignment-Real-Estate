import { z } from 'zod';
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
} from '../../models/enums.js';
import { pageQuery } from '../../utils/paginate.js';
import { objectId } from '../../utils/schemas.js';

const money = z.coerce.number().min(0);

export const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  category: z.enum(PROPERTY_CATEGORIES).optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  purpose: z.enum(PROPERTY_PURPOSES).optional(),
  minPrice: money.optional(),
  maxPrice: money.optional(),
  beds: z.coerce.number().int().min(0).max(10).optional(),
  featured: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).default('newest'),
  // Staff only: include drafts/sold and limit to own listings
  status: z.enum(PROPERTY_STATUSES).optional(),
  scope: z.enum(['public', 'manage']).default('public'),
  ...pageQuery,
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const image = z.object({
  url: z.url(),
  publicId: z.string().optional(),
  alt: z.string().max(200).optional(),
});

// Base fields carry no defaults, so the PATCH schema (.partial()) never
// fills in values the client didn't send.
const baseFields = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(140),
  description: z.string().trim().min(20, 'Write at least 20 characters').max(5000),
  category: z.enum(PROPERTY_CATEGORIES),
  type: z.enum(PROPERTY_TYPES),
  purpose: z.enum(PROPERTY_PURPOSES),
  price: money,
  currency: z.string().length(3),
  location: z.object({
    address: z.string().trim().max(200).optional(),
    area: z.string().trim().max(80).optional(),
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
  }),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  areaSqft: z.coerce.number().min(0).optional(),
  parking: z.coerce.number().int().min(0).max(50),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  amenities: z.array(z.string().trim().min(1).max(60)).max(40),
  images: z.array(image).max(20),
  coverIndex: z.coerce.number().int().min(0),
  status: z.enum(PROPERTY_STATUSES),
  featured: z.boolean(),
  agent: objectId.optional(), // admin can list on behalf of an agent
});

export const createBody = baseFields.extend({
  currency: baseFields.shape.currency.default('USD'),
  bedrooms: baseFields.shape.bedrooms.default(0),
  bathrooms: baseFields.shape.bathrooms.default(0),
  parking: baseFields.shape.parking.default(0),
  amenities: baseFields.shape.amenities.default([]),
  images: baseFields.shape.images.default([]),
  coverIndex: baseFields.shape.coverIndex.default(0),
  status: baseFields.shape.status.default('available'),
  featured: baseFields.shape.featured.default(false),
});

export const updateBody = baseFields.partial();

export const slugParams = z.object({ slug: z.string().trim().min(1).max(120) });
