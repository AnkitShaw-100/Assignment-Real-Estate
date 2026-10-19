// User text goes into RegExp for search; escape it so "(" or ".*" can't
// break the query or trigger catastrophic backtracking.
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
