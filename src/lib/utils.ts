/**
 * Normalizes Pakistan phone numbers:
 * 03001234567 -> +923001234567
 * 00923001234567 -> +923001234567
 * +923001234567 -> +923001234567
 * 923001234567 -> +923001234567
 */
export function normalizePakistanPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("0092")) {
    return "+92" + cleaned.slice(4);
  }
  if (cleaned.startsWith("+92")) {
    return cleaned;
  }
  if (cleaned.startsWith("92")) {
    return "+" + cleaned;
  }
  if (cleaned.startsWith("0")) {
    return "+92" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Format PKR currency with commas
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount == null) return "Free";
  if (amount === 0) return "Free";
  return `PKR ${amount.toLocaleString()}`;
}

/**
 * Format relative time (e.g. "2d ago", "3h ago", "just now")
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

/**
 * Extract lat/lng coordinates from Google Maps URLs or text strings
 * e.g. https://maps.google.com/?q=33.6844,73.0479 or @33.6844,73.0479
 */
export function parseCoordinatesFromText(text: string): { lat: number; lng: number } | null {
  if (!text) return null;
  // Match @33.6844,73.0479 or q=33.6844,73.0479 or plain 33.6844, 73.0479
  const regex = /[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)/;
  const match = text.match(regex);
  if (match) {
    const parts = match[0].split(",").map((p) => parseFloat(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  return null;
}

/**
 * Extract dynamic ID safely across local development and Firebase Hosting static rewrite
 */
export function getRouteId(paramId: string | undefined): string {
  if (paramId && paramId !== "_") return paramId;
  if (typeof window !== "undefined") {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[1] !== "_" && parts[1] !== "new") {
      return decodeURIComponent(parts[1]);
    }
  }
  return "";
}
