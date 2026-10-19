// Single source of truth for enum values shared by models, validation and seed data.

export const ROLES = ['buyer', 'agent', 'admin'];
export const STAFF_ROLES = ['agent', 'admin'];

export const PROPERTY_CATEGORIES = ['residential', 'commercial'];
export const PROPERTY_TYPES = ['villa', 'apartment', 'house', 'penthouse', 'office', 'shop', 'warehouse', 'land'];
export const PROPERTY_PURPOSES = ['sale', 'rent'];
export const PROPERTY_STATUSES = ['draft', 'available', 'under_offer', 'sold', 'rented'];
// Statuses visible on the public website
export const PUBLIC_PROPERTY_STATUSES = ['available', 'under_offer'];

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost'];
export const OPEN_LEAD_STAGES = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation'];
export const LEAD_SOURCES = ['website', 'referral', 'walk_in', 'phone', 'social', 'portal'];
export const LEAD_INTENTS = ['buy', 'rent', 'visit', 'general'];

export const CUSTOMER_TYPES = ['buyer', 'renter', 'investor', 'seller'];
export const INTERACTION_KINDS = ['call', 'email', 'meeting', 'site_visit', 'note'];

export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const TASK_STATUSES = ['open', 'done'];
