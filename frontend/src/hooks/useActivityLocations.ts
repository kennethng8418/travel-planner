"use client";

import { useKeyedAsync } from "@/hooks/useKeyedAsync";
import { locateActivities, type LatLng, type LocationQuery } from "@/lib/geocode";

type Locations = Record<string, LatLng | null>;

function loadLocations(key: string): Promise<Locations> {
  const [destination, activities] = JSON.parse(key) as [string | null, LocationQuery[]];
  return locateActivities(activities, destination);
}

/** Map coordinates for the given day's activities, keyed by name. Returns null while loading. */
export function useActivityLocations(
  activities: LocationQuery[],
  destination: string | null,
): Locations | null {
  const key =
    activities.length > 0
      ? JSON.stringify([
          destination,
          activities.map(({ name, address }) => ({ name, address })),
        ])
      : null;
  return useKeyedAsync(key, loadLocations, {});
}
