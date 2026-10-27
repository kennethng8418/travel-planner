"use client";

import { useEffect, useState } from "react";

/**
 * Runs `load(key)` whenever `key` changes and returns its result, or null while
 * it's loading. `key` should be a serialised description of the inputs so that
 * re-renders with equal inputs don't reload; `load` must be a stable function.
 * Errors resolve to `onError` so callers can show a quiet fallback.
 */
export function useKeyedAsync<T>(
  key: string | null,
  load: (key: string) => Promise<T>,
  onError: T,
): T | null {
  const [result, setResult] = useState<{ key: string; value: T } | null>(null);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load(key)
      .then((value) => {
        if (!cancelled) setResult({ key, value });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, value: onError });
      });
    return () => {
      cancelled = true;
    };
    // onError is a fallback value; changes to it alone shouldn't trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load]);

  return result?.key === key ? result.value : null;
}
