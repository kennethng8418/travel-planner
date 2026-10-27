import { placeFromActivityName } from "@/lib/wikiPhotos";

// Turns itinerary stops into map coordinates using Photon (https://photon.komoot.io),
// a free geocoder over OpenStreetMap data. It's forgiving with romanised addresses and
// knows many restaurants by name. Requests run one at a time to stay within fair use.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationQuery {
  name: string;
  address?: string;
}

const PHOTON = "https://photon.komoot.io/api/";
// A hit further than this from the destination is a same-named place elsewhere.
const MAX_DISTANCE_KM = 60;

const queryCache = new Map<string, LatLng | null>();

async function photon(query: string, near: LatLng | null): Promise<LatLng | null> {
  const cacheKey = `${query}|${near ? `${near.lat},${near.lng}` : ""}`;
  const cached = queryCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({ q: query, limit: "1", lang: "en" });
  if (near) {
    // Bias results toward the destination rather than hard-filtering, then check distance below.
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }
  const res = await fetch(`${PHOTON}?${params}`);
  if (!res.ok) throw new Error(`Photon responded ${res.status}`);

  const data = await res.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  const result = Array.isArray(coords) ? { lng: coords[0], lat: coords[1] } : null;
  queryCache.set(cacheKey, result);
  return result;
}

function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Resolved stops for the session. Network failures aren't cached, so they're retried next time.
const cache = new Map<string, LatLng | null>();

/**
 * Coordinates for each stop, keyed by activity name (null = couldn't be placed).
 * Tries the venue by name first ("Fuunji Tokyo"), then its address.
 */
export async function locateActivities(
  activities: LocationQuery[],
  destination: string | null,
): Promise<Record<string, LatLng | null>> {
  const center = destination ? await photon(destination, null) : null;
  const cacheKey = (a: LocationQuery) => `${destination ?? ""}|${a.name}|${a.address ?? ""}`;

  for (const activity of activities) {
    if (cache.has(cacheKey(activity))) continue;
    const place = placeFromActivityName(activity.name);
    const candidates = [
      place ? [place, destination].filter(Boolean).join(" ") : null,
      activity.address ?? null,
    ].filter((q): q is string => Boolean(q));

    let found: LatLng | null = null;
    try {
      for (const query of candidates) {
        const hit = await photon(query, center);
        if (hit && (!center || distanceKm(hit, center) <= MAX_DISTANCE_KM)) {
          found = hit;
          break;
        }
      }
    } catch {
      continue; // leave uncached so it's retried later
    }
    cache.set(cacheKey(activity), found);
  }

  return Object.fromEntries(
    activities.map((a) => [a.name, cache.get(cacheKey(a)) ?? null]),
  );
}
