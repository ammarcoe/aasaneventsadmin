export type MapsParseResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: "short-link" | "no-coords" | "out-of-range" };

const PK = { latMin: 23, latMax: 37, lngMin: 60, lngMax: 78 };

export function parseMapsInput(input: string): MapsParseResult {
  const t = input.trim();

  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(t)) {
    return { ok: false, reason: "short-link" };
  }

  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // /@lat,lng
    /[?&](?:q|query|destination|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ?q=
    /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/, // bare pair
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // /data= payload
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (
        lat < PK.latMin ||
        lat > PK.latMax ||
        lng < PK.lngMin ||
        lng > PK.lngMax
      ) {
        return { ok: false, reason: "out-of-range" };
      }
      return { ok: true, lat, lng };
    }
  }

  return { ok: false, reason: "no-coords" };
}

export const MAPS_FAILURE_MESSAGES: Record<
  "short-link" | "no-coords" | "out-of-range",
  string
> = {
  "short-link":
    "Short links don't contain coordinates. Open the place in Google Maps on a computer and copy the URL from the address bar (it will contain @33.6892,73.0729). Or right-click the spot on the map and click the coordinates to copy them, then paste them here directly.",
  "no-coords":
    "Couldn't find coordinates in that. Paste a Google Maps URL containing @lat,lng, or the coordinates themselves as 33.6892, 73.0729.",
  "out-of-range":
    "Those coordinates are outside Pakistan (Latitude 23–37, Longitude 60–78). Check they aren't the wrong way round — latitude first.",
};
