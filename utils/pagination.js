// Shared guards for the `page`/`limit` params scattered across services/*.js. Without these, a
// bad page (0, negative, NaN, a string) produces a negative `.slice()` start, which silently
// returns the wrong page instead of erroring or falling back to page 1.

export const clampPage = (page) => {
  const n = Number(page);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

export const clampLimit = (limit, fallback) => {
  const n = Number(limit);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
};
