/**
 * Fields that are exclusively modified or accumulated by the mobile consumer app / backend,
 * and must NEVER be overwritten with stale or default zero values during web admin edits.
 */
export const APP_OWNED_FIELDS = [
  "soldCount",
  "attendeeCount",
  "favoriteCount",
  "viewCount",
  "clickCount",
  "sharesCount",
  "waitlistCount",
  "checkedInCount",
] as const;

export type AppOwnedField = (typeof APP_OWNED_FIELDS)[number];

/**
 * Strips app-owned top-level fields from an event payload before writing to Firestore
 * so admin updates do not clobber user interactions.
 */
export function stripAppOwnedFields<T extends Record<string, unknown>>(data: T): Partial<T> {
  const sanitized = { ...data };
  for (const field of APP_OWNED_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}
