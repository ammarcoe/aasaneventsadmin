import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const PKT = "Asia/Karachi";

/** Form inputs ("2026-09-24", "19:30") → the correct UTC instant */
export function pktToDate(dateStr: string, timeStr: string): Date {
  if (!dateStr || !timeStr) return new Date();
  return fromZonedTime(`${dateStr}T${timeStr}:00`, PKT);
}

/** A stored Date → the form's date and time strings */
export function dateToPktParts(d: Date | null | undefined): { date: string; time: string } {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
    const now = new Date();
    return {
      date: formatInTimeZone(now, PKT, "yyyy-MM-dd"),
      time: formatInTimeZone(now, PKT, "HH:mm"),
    };
  }
  return {
    date: formatInTimeZone(d, PKT, "yyyy-MM-dd"),
    time: formatInTimeZone(d, PKT, "HH:mm"),
  };
}

/** The read-back label shown under every datetime field */
export function pktLabel(d: Date | null | undefined): string {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
    return "No date set";
  }
  return formatInTimeZone(d, PKT, "EEE d MMM yyyy, h:mm a 'PKT'");
}

/** Uppercase date line matching mobile FeedEventCard */
export function pktMobileDateLine(d: Date | null | undefined): string {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
    return "DATE TO BE ANNOUNCED";
  }
  return formatInTimeZone(d, PKT, "EEE, MMM d · h:mm a 'PKT'").toUpperCase();
}

/** Returns the current date/time converted in PKT */
export function nowInPkt(): Date {
  return toZonedTime(new Date(), PKT);
}
