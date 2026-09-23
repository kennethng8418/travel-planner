/**
 * Tiny in-memory cache with per-entry expiry and a size cap (oldest entry evicted first).
 * Lives for the lifetime of the server process; used to avoid repeat photo lookups.
 * `get` returns undefined on a miss, so a cached `null` ("no photo found") is still a hit.
 */
export function createTtlCache<T>(ttlMs: number, maxEntries: number) {
  const entries = new Map<string, { value: T; expires: number }>();

  return {
    get(key: string): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expires <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T) {
      if (entries.size >= maxEntries) {
        entries.delete(entries.keys().next().value!);
      }
      entries.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
}
