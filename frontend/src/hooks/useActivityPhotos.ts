"use client";

import { useEffect, useState } from "react";
import type { ActivityPhoto } from "@/lib/types";
import { fetchActivityPhotos, type PhotoQuery } from "@/lib/wikiPhotos";

/**
 * Wikipedia photos for the given activities, keyed by activity name (one day at a
 * time, so only the visible day costs API requests). Returns null while loading.
 */
export function useActivityPhotos(
  activities: PhotoQuery[],
  destination: string | null,
): Record<string, ActivityPhoto | null> | null {
  // A stable key so a new array with the same activities doesn't refetch.
  const key = JSON.stringify([
    destination,
    activities.map(({ name, description, type }) => ({ name, description, type })),
  ]);
  const [result, setResult] = useState<{
    key: string;
    photos: Record<string, ActivityPhoto | null>;
  } | null>(null);

  useEffect(() => {
    const [dest, list] = JSON.parse(key) as [string | null, PhotoQuery[]];
    if (list.length === 0) return;
    let cancelled = false;

    fetchActivityPhotos(list, dest)
      .then((photos) => {
        if (!cancelled) setResult({ key, photos });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, photos: {} });
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return result?.key === key ? result.photos : null;
}
