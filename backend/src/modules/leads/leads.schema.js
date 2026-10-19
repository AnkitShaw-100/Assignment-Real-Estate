import { z } from 'zod';
import { LEAD_STAGES, LEAD_SOURCES, LEAD_INTENTS } from '../../models/enums.js';
import { pageQuery } from '../../utils/paginate.js';
import { objectId, optionalText, phone } from '../../utils/schemas.js';

const name = z.string().trim().min(2, 'Enter your name').max(80);
const email = z.email('Enter a valid email').trim().toLowerCase();
const futureOrToday = z.coerce.date();

/** Public website inquiry — deliberately small surface. */
export const inquiryBody = z.object({
  name,
  email,
  phone,
  message: optionalText(2000),
  intent: z.enum(LEAD_INTENTS).default('general'),
  preferredDate: futureOrToday.optional(),
  property: objectId.optional(),
  // Honeypot: real users never see this field, bots fill it in
  website: z.string().max(0, 'Spam detected').optional(),
});

export const createBody = z.object({
  name,
  email,
  phone,
  message: optionalText(2000),
  intent: z.enum(LEAD_INTENTS).default('general'),
  source: z.enum(LEAD_SOURCES).default('phone'),
  property: objectId.optional(),
  assignedTo: objectId.optional(),
  followUpDate: z.coerce.date().optional(),
  dealValue: z.coerce.number().min(0).optional(),
});

export const updateBody = z
  .object({
    name,
    email,
    phone,
    message: optionalText(2000),
    intent: z.enum(LEAD_INTENTS),
    source: z.enum(LEAD_SOURCES),
    property: objectId.nullable(),
    assignedTo: objectId,
    followUpDate: z.coerce.date().nullable(),
    dealValue: z.coerce.number().min(0).nullable(),
    note: z.string().trim().min(1).max(2000), // appends a note
  })
  .partial();

export const stageBody = z
  .object({
    stage: z.enum(LEAD_STAGES),
    dealValue: z.coerce.number().positive('Enter the final deal value').optional(),
    lostReason: z.string().trim().min(2).max(300).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.stage === 'won' && v.dealValue === undefined) {
      ctx.addIssue({ code: 'custom', path: ['dealValue'], message: 'Enter the final deal value' });
    }
    if (v.stage === 'lost' && !v.lostReason) {
      ctx.addIssue({ code: 'custom', path: ['lostReason'], message: 'Add a reason so the team can learn from it' });
    }
  });

export const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(LEAD_STAGES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assignedTo: objectId.optional(),
  followUp: z.enum(['overdue', 'today', 'upcoming']).optional(),
  sort: z.enum(['newest', 'oldest', 'follow_up', 'value']).default('newest'),
  ...pageQuery,
  limit: z.coerce.number().int().min(1).max(200).default(20),
});
