"use client";

import { useEffect, useState } from "react";
import type { DestinationPhoto } from "@/lib/types";

/**
 * Fetches a banner photo for the destination and resolves once the image has
 * fully loaded, so the banner can fade it in without a half-drawn frame.
 * Returns null while loading, when there's no match, or when no key is configured.
 */
export function useDestinationPhoto(
  destination: string | null,
): DestinationPhoto | null {
  const [loaded, setLoaded] = useState<{
    destination: string;
    photo: DestinationPhoto;
  } | null>(null);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/destination-photo?q=${encodeURIComponent(destination)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { photo: null }))
      .then(({ photo }: { photo: DestinationPhoto | null }) => {
        if (!photo || cancelled) return;
        const img = new Image();
        img.onload = () => {
          if (!cancelled) setLoaded({ destination, photo });
        };
        img.src = photo.imageUrl;
      })
      .catch(() => {
        // Aborted or offline: keep the plain banner.
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [destination]);

  return loaded?.destination === destination ? loaded.photo : null;
}
