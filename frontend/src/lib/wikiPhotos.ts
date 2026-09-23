import type { ActivityPhoto } from "@/lib/types";

// Finds a photo for each itinerary activity: the lead image of the best-matching
// Wikipedia article, plus the author/licence credit Creative Commons requires.
//
// Runs in the browser on purpose: Wikimedia allows 200 requests/min per browser user,
// versus 10/min for unidentified servers (https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits).

const API = "https://en.wikipedia.org/w/api.php";
// Wikimedia asks clients to keep concurrent requests at 3 or fewer.
const MAX_CONCURRENT = 3;

// Meal/activity wording that isn't part of the place's name ("Lunch at X", "X Neighborhood Stroll").
const LEADING_FILLER =
  /^(?:(?:breakfast|brunch|lunch|dinner|supper|drinks|coffee|tea|snacks?|visit|explore|exploring|stroll|walk|tour|evening|morning|afternoon|sunset|sunrise|free time|shopping)\b(?:\s+(?:at|in|on|through|around|to|of|along|the))*\s+)+/i;
const TRAILING_FILLER =
  /(?:\s+(?:neighbou?rhood|stroll|walk|walking|exploration|tour|visit|district|area|experience|time|dinner|lunch|breakfast))+$/i;
// Lead images that are diagrams rather than photos.
const NON_PHOTO_IMAGE =
  /\.svg$|flag|map|logo|locator|location|coat[_ ]of[_ ]arms|seal|emblem|icon|diagram/i;

/** "Lunch at Afuri Ramen (Harajuku)" → "Afuri Ramen"; "Ueno Park & Tokyo National Museum" → "Ueno Park". */
export function placeFromActivityName(name: string): string {
  const main = name
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+[—–-]\s+|:|\s+&\s+|\s+and\s+|\//)[0];
  return main
    .replace(LEADING_FILLER, "")
    .replace(TRAILING_FILLER, "")
    .replace(/\s+/g, " ")
    .trim();
}

function significantWords(text: string): Set<string> {
  const plain = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return new Set(plain.split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
}

/** Guards against off-topic search hits: the article title must share a real word with the place. */
function titleMatchesPlace(title: string, place: string): boolean {
  const titleWords = significantWords(title);
  return [...significantWords(place)].some((w) => titleWords.has(w));
}

async function wikiQuery(params: Record<string, string>) {
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*", // anonymous CORS
    ...params,
  });
  const res = await fetch(`${API}?${query}`);
  if (!res.ok) throw new Error(`Wikipedia API responded ${res.status}`);
  return res.json();
}

interface SearchHit {
  articleTitle: string;
  imageUrl: string;
  file: string;
}

// Search results by query, shared across activities so repeated generic searches ("Ramen") are free.
const searchCache = new Map<string, SearchHit | null>();

/** Top Wikipedia hit for `query`, if its title shares a word with `mustMatch` and it has a real photo. */
async function searchPhoto(
  query: string,
  mustMatch: string,
): Promise<SearchHit | null> {
  const cacheKey = `${query}|${mustMatch}`;
  const cached = searchCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const data = await wikiQuery({
    generator: "search",
    gsrsearch: query,
    gsrlimit: "1",
    gsrnamespace: "0",
    prop: "pageimages",
    piprop: "thumbnail|name",
    pithumbsize: "640",
  });
  const page = data.query?.pages?.[0];
  const hit =
    !page?.thumbnail?.source ||
    !page.pageimage ||
    NON_PHOTO_IMAGE.test(page.pageimage) ||
    !titleMatchesPlace(page.title, mustMatch)
      ? null
      : {
          articleTitle: page.title,
          imageUrl: page.thumbnail.source,
          file: page.pageimage,
        };
  searchCache.set(cacheKey, hit);
  return hit;
}

// Common dishes and kinds of place, used to find a representative photo when the
// specific spot has none ("Lunch at Asakusa Mugimaru (Ramen)" → the Ramen article).
// More specific terms first, since the first match wins.
const GENERIC_SUBJECTS = [
  "tsukemen", "ramen", "udon", "soba", "sushi", "sashimi", "tempura", "yakitori",
  "okonomiyaki", "takoyaki", "izakaya", "dim sum", "dumplings", "pho", "noodles",
  "curry", "tacos", "tapas", "paella", "pizza", "pasta", "gelato", "croissant",
  "pastries", "bakery", "street food", "seafood", "barbecue", "tea ceremony",
  "coffee", "wine", "beer", "cocktails",
  "temple", "shrine", "cathedral", "mosque", "church", "castle", "palace",
  "museum", "art gallery", "botanical garden", "garden", "beach", "waterfall",
  "harbour", "harbor", "market", "shopping street", "park", "lake", "hiking",
];

function genericSubjectsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return GENERIC_SUBJECTS.filter((s) => new RegExp(`\\b${s}\\b`).test(lower));
}

/** Candidate generic searches, most relevant first: subjects in the name, then the description, then bracketed text. */
function genericHints(activity: PhotoQuery): string[] {
  const bracketed = [...activity.name.matchAll(/\(([^),]+)/g)].map((m) =>
    m[1].trim(),
  );
  const hints = [
    ...genericSubjectsIn(activity.name),
    ...genericSubjectsIn(activity.description ?? ""),
    ...bracketed,
  ];
  return [...new Set(hints.map((h) => h.toLowerCase()))].slice(0, 2);
}

export interface PhotoQuery {
  name: string;
  description?: string;
  type?: string;
}

/**
 * Best photo for an activity: the place itself, else a representative photo of
 * its dish or kind of place, else a restaurant (food) or the destination (everything else).
 */
async function findPhoto(
  activity: PhotoQuery,
  destination: string | null,
): Promise<{ hit: SearchHit; generic: boolean } | null> {
  const place = placeFromActivityName(activity.name);
  if (place) {
    const hit = await searchPhoto(
      destination ? `${place} ${destination}` : place,
      place,
    );
    if (hit) return { hit, generic: false };
  }

  for (const hint of genericHints(activity)) {
    const hit = await searchPhoto(hint, hint);
    if (hit) return { hit, generic: true };
  }

  const isFood = (activity.type ?? "").toLowerCase().startsWith("food");
  const fallback = isFood ? "Restaurant" : destination;
  if (fallback) {
    const hit = await searchPhoto(fallback, fallback);
    if (hit) return { hit, generic: true };
  }
  return null;
}

function htmlToText(html: string): string {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? ""
  ).trim();
}

/** One batched request for the author, licence and file page of every image. */
async function fetchCredits(files: string[]) {
  const credits = new Map<
    string,
    { artist: string | null; license: string | null; fileUrl: string }
  >();
  if (files.length === 0) return credits;

  const data = await wikiQuery({
    titles: files.map((f) => `File:${f}`).join("|"),
    prop: "imageinfo",
    iiprop: "extmetadata|url",
    iiextmetadatafilter: "Artist|LicenseShortName",
  });
  for (const page of data.query?.pages ?? []) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const artist = info.extmetadata?.Artist?.value;
    credits.set(page.title, {
      artist: artist ? htmlToText(artist).slice(0, 80) || null : null,
      license: info.extmetadata?.LicenseShortName?.value ?? null,
      fileUrl: info.descriptionurl,
    });
  }
  return credits;
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

// Successful lookups (including "no photo") are remembered for the session; failures are retried next time.
const cache = new Map<string, ActivityPhoto | null>();

/** Photos for one day's activities, keyed by activity name (null = no suitable photo). */
export async function fetchActivityPhotos(
  activities: PhotoQuery[],
  destination: string | null,
): Promise<Record<string, ActivityPhoto | null>> {
  const cacheKey = (a: PhotoQuery) => `${destination ?? ""}|${a.type ?? ""}|${a.name}`;
  const pending = activities.filter(
    (a, i) =>
      !cache.has(cacheKey(a)) &&
      activities.findIndex((b) => b.name === a.name) === i,
  );

  let rateLimited = false;
  const results = await mapWithLimit(pending, MAX_CONCURRENT, async (activity) => {
    if (rateLimited) return undefined;
    try {
      return await findPhoto(activity, destination);
    } catch {
      // Most likely a 429: stop issuing further requests this round rather than retrying.
      rateLimited = true;
      return undefined;
    }
  });

  const files = new Set(results.flatMap((r) => (r ? [r.hit.file] : [])));
  const credits = await fetchCredits([...files]).catch(() => null);

  pending.forEach((activity, i) => {
    const result = results[i];
    if (result === undefined) return; // failed — leave uncached so it's retried later
    if (result === null) {
      cache.set(cacheKey(activity), null);
      return;
    }
    if (!credits) return; // can't show a photo without its credit; retry later
    const { hit, generic } = result;
    const credit = credits.get(`File:${hit.file.replace(/_/g, " ")}`);
    cache.set(cacheKey(activity), {
      imageUrl: hit.imageUrl,
      articleTitle: hit.articleTitle,
      generic,
      fileUrl:
        credit?.fileUrl ??
        `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(hit.file)}`,
      artist: credit?.artist ?? null,
      license: credit?.license ?? null,
    });
  });

  return Object.fromEntries(
    activities.map((a) => [a.name, cache.get(cacheKey(a)) ?? null]),
  );
}
