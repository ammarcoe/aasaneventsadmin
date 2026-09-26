export const APP_OWNED_FIELDS = [
  "soldCount",
  "attendeeCount",
  "favoriteCount",
  "viewCount",
  "clickCount",
  "sharesCount",
  "waitlistCount",
  "checkedInCount",
  "qrToken",
] as const;

export type AppOwnedField = (typeof APP_OWNED_FIELDS)[number];

export const AMENITIES = [
  { id: "parking", label: "Parking available", icon: "Car" },
  { id: "food", label: "Food available", icon: "Utensils" },
  { id: "free_water", label: "Free water", icon: "Droplets" },
  { id: "prayer_space", label: "Prayer space", icon: "Moon" },
  { id: "washrooms", label: "Washrooms", icon: "Bath" },
  { id: "family_friendly", label: "Family friendly", icon: "Users" },
  { id: "wheelchair", label: "Wheelchair accessible", icon: "Accessibility" },
  { id: "indoor", label: "Indoor", icon: "Home" },
  { id: "outdoor", label: "Outdoor", icon: "Sun" },
  { id: "wifi", label: "Wi-Fi", icon: "Wifi" },
] as const;

export const AUDIENCES = [
  { id: "students", label: "Students only", badge: "STUDENTS", isRestricted: true },
  { id: "women", label: "Women only", badge: "WOMEN ONLY", isRestricted: true },
  { id: "families", label: "Families", badge: "FAMILIES", isRestricted: false },
  { id: "adults", label: "18+", badge: "18+", isRestricted: false },
] as const;

export const LANGUAGES = [
  { id: "ur", label: "Urdu" },
  { id: "en", label: "English" },
  { id: "pa", label: "Punjabi" },
  { id: "ps", label: "Pashto" },
  { id: "sd", label: "Sindhi" },
  { id: "other", label: "Other" },
] as const;

export const FAQ_PRESETS = [
  "Is there parking?",
  "Is food available, or can I bring my own?",
  "Can I bring children?",
  "Is there a prayer area?",
  "What should I bring?",
  "Is it wheelchair accessible?",
  "How will entry be checked?",
  "What happens if it rains?",
] as const;

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
