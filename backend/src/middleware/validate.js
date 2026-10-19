/**
 * validate({ body, query, params }) parses each part with its Zod schema.
 * Parsed values replace the raw input, so handlers get coerced, defaulted
 * data with unknown keys stripped (protects against mass assignment).
 *
 * Express 5 makes req.query a getter, so parsed query lives on req.valid.query.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid ?? {};
    if (schemas.params) req.valid.params = schemas.params.parse(req.params);
    if (schemas.query) req.valid.query = schemas.query.parse(req.query);
    if (schemas.body) req.body = req.valid.body = schemas.body.parse(req.body ?? {});
    next();
  };
}
