// Mirrors backend/src/models/enums.js. Kept in one place so labels stay consistent.

export const PROPERTY_TYPES = [
  { value: 'villa', label: 'Villa', category: 'residential' },
  { value: 'house', label: 'House', category: 'residential' },
  { value: 'apartment', label: 'Apartment', category: 'residential' },
  { value: 'penthouse', label: 'Penthouse', category: 'residential' },
  { value: 'office', label: 'Office', category: 'commercial' },
  { value: 'shop', label: 'Shop', category: 'commercial' },
  { value: 'warehouse', label: 'Warehouse', category: 'commercial' },
  { value: 'land', label: 'Land', category: 'residential' },
];

export const PROPERTY_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'available', label: 'Available' },
  { value: 'under_offer', label: 'Under offer' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
];

export const LEAD_STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone', label: 'Phone' },
  { value: 'social', label: 'Social' },
  { value: 'portal', label: 'Property portal' },
];

export const CUSTOMER_TYPES = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'renter', label: 'Renter' },
  { value: 'investor', label: 'Investor' },
  { value: 'seller', label: 'Seller' },
];

export const INTERACTION_KINDS = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'note', label: 'Note' },
];

export const AMENITIES = [
  'Swimming pool', 'Garden', 'Air conditioning', 'Fireplace', 'Home office', 'Smart home', 'Gym', 'Security',
  'Balcony', 'Sea view', 'Walk-in closet', 'EV charging', '24/7 access', 'Reception', 'Elevator', 'Loading bay',
  'Fibre internet', 'Parking',
];

export const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5+' },
];

export const labelOf = (list, value) => list.find((i) => i.value === value)?.label ?? value;
