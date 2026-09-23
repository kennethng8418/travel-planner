import { createTtlCache } from "@/lib/ttlCache";
import type { DestinationPhoto } from "@/lib/types";

// Looks up a landscape photo of a destination on Unsplash for the trip banner.
// The access key stays server-side; the browser only ever sees the photo URL.

// Unsplash's guidelines ask for these params on every link back to them.
const UTM = "utm_source=travel_planner&utm_medium=referral";

// The demo key allows 50 requests/hour, so each destination is fetched once per day per server.
const cache = createTtlCache<DestinationPhoto | null>(24 * 60 * 60 * 1000, 200);

interface UnsplashSearchResponse {
  results: {
    color: string | null;
    urls: { raw: string };
    links: { html: string };
    user: { name: string; links: { html: string } };
  }[];
}

async function searchUnsplash(
  destination: string,
  accessKey: string,
): Promise<DestinationPhoto | null> {
  const params = new URLSearchParams({
    query: `${destination} travel`,
    orientation: "landscape",
    content_filter: "high",
    per_page: "1",
  });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
  });
  if (!res.ok) {
    throw new Error(`Unsplash search failed: ${res.status}`);
  }

  const data = (await res.json()) as UnsplashSearchResponse;
  const hit = data.results[0];
  if (!hit) return null;

  return {
    // Unsplash requires hotlinking its image URLs; raw + params gives a banner-sized crop.
    imageUrl: `${hit.urls.raw}&w=1800&q=80&fm=jpg&fit=crop`,
    color: hit.color,
    photographerName: hit.user.name,
    photographerUrl: `${hit.user.links.html}?${UTM}`,
    unsplashUrl: `https://unsplash.com/?${UTM}`,
  };
}

export async function GET(request: Request) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  const destination = new URL(request.url).searchParams
    .get("q")
    ?.trim()
    .slice(0, 100);

  // No key configured or nothing to search: the banner falls back to its plain gradient.
  if (!accessKey || !destination) {
    return Response.json({ photo: null });
  }

  const key = destination.toLowerCase();
  const cached = cache.get(key);
  if (cached !== undefined) {
    return Response.json(
      { photo: cached },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  }

  try {
    const photo = await searchUnsplash(destination, accessKey);
    cache.set(key, photo);
    return Response.json(
      { photo },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  } catch (err) {
    // Rate limits or outages shouldn't break the page; don't cache so we retry later.
    console.error(err);
    return Response.json({ photo: null });
  }
}
