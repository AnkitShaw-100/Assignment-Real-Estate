const currencyCache = new Map();

/** $1,295,000, or "$8,000 /month" for rentals when `purpose` is passed */
export function formatPrice(value, { currency = 'USD', purpose, compact = false } = {}) {
  if (value == null) return 'Price on request';
  const key = `${currency}-${compact}`;
  if (!currencyCache.has(key)) {
    currencyCache.set(
      key,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 1 : 0,
        notation: compact ? 'compact' : 'standard',
      }),
    );
  }
  const text = currencyCache.get(key).format(value);
  return purpose === 'rent' ? `${text} /month` : text;
}

export const formatNumber = (n) => new Intl.NumberFormat('en-US').format(n ?? 0);

export function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(value));
}

export function formatDateTime(value) {
  return formatDate(value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
/** "3 days ago", "in 2 hours", "yesterday" */
export function timeAgo(value) {
  if (!value) return '';
  const diff = (new Date(value) - Date.now()) / 1000;
  const units = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
}

/** "site_visit" → "Site visit" */
export const humanize = (s = '') => (s.charAt(0).toUpperCase() + s.slice(1)).replaceAll('_', ' ');

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

/** Resize Unsplash/Cloudinary URLs for the slot they render in */
export function imageUrl(url, width = 800) {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', '75');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  }
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
}

export const coverOf = (property) => property?.images?.[property.coverIndex ?? 0] ?? property?.images?.[0];

/** Customer budget as one phrase: "$500K to $1.2M", "Up to $2M", … */
export function budgetText(r = {}) {
  if (r.budgetMin && r.budgetMax) return `${formatPrice(r.budgetMin, { compact: true })} to ${formatPrice(r.budgetMax, { compact: true })}`;
  if (r.budgetMax) return `Up to ${formatPrice(r.budgetMax, { compact: true })}`;
  if (r.budgetMin) return `From ${formatPrice(r.budgetMin, { compact: true })}`;
  return 'No budget set';
}
