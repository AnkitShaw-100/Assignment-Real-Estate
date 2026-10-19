// Blocks NoSQL operator injection, e.g. { "email": { "$gt": "" } }.
// express-mongo-sanitize doesn't support Express 5 (req.query is a getter),
// so this is a small replacement. Query strings are validated by Zod per
// route, which already rejects objects where strings are expected.

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      out[key] = clean(val);
    }
    return out;
  }
  return value;
}

export function sanitize(req, _res, next) {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  next();
}
