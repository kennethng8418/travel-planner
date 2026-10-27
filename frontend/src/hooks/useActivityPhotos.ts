"use client";

import { useKeyedAsync } from "@/hooks/useKeyedAsync";
import type { ActivityPhoto } from "@/lib/types";
import { fetchActivityPhotos, type PhotoQuery } from "@/lib/wikiPhotos";

type Photos = Record<string, ActivityPhoto | null>;

function loadPhotos(key: string): Promise<Photos> {
  const [destination, activities] = JSON.parse(key) as [string | null, PhotoQuery[]];
  return fetchActivityPhotos(activities, destination);
}

/**
 * Wikipedia photos for the given activities, keyed by activity name (one day at a
 * time, so only the visible day costs API requests). Returns null while loading.
 */
export function useActivityPhotos(
  activities: PhotoQuery[],
  destination: string | null,
): Photos | null {
  const key =
    activities.length > 0
      ? JSON.stringify([
          destination,
          activities.map(({ name, description, type }) => ({ name, description, type })),
        ])
      : null;
  return useKeyedAsync(key, loadPhotos, {});
}
