"use client";

import type { ActivityPhoto, ItineraryActivity } from "@/lib/types";

// Muted, palette-matched tones so every category sits inside the cream/green/gold scheme.
const TYPE_STYLES: Record<string, { badge: string; dot: string }> = {
  food: { badge: "bg-[#f6ecd6] text-[#7a5a1e]", dot: "bg-[#c7a76a]" },
  sightseeing: { badge: "bg-[#dcf1f5] text-[#0b5d7a]", dot: "bg-[#1596b0]" },
  culture: { badge: "bg-[#efe6ee] text-[#5b3a58]", dot: "bg-[#8a5a86]" },
  nature: { badge: "bg-[#e6eee2] text-[#3d5a34]", dot: "bg-[#6b8f5e]" },
  history: { badge: "bg-[#ece6dc] text-[#5a4d3b]", dot: "bg-[#8c7a5f]" },
  shopping: { badge: "bg-[#f3e4df] text-[#7a3f33]", dot: "bg-[#b86b5a]" },
  transport: { badge: "bg-[#e6e9ea] text-[#3d4a4f]", dot: "bg-[#6d7c82]" },
};

const FALLBACK_STYLE = {
  badge: "bg-[#dcf1f5] text-[#0b5d7a]",
  dot: "bg-[var(--accent)]",
};

function typeKey(type?: string) {
  return (type ?? "other").split("|")[0]?.trim().toLowerCase() ?? "other";
}

/**
 * Wide photo across the top of the card on phones, square tile on the left from `sm` up.
 * `photo` is undefined while loading and null when Wikipedia had no suitable image.
 */
function ActivityThumb({
  photo,
  badgeClass,
}: {
  photo: ActivityPhoto | null | undefined;
  badgeClass: string;
}) {
  const frame =
    "relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl sm:aspect-square sm:w-24";

  if (photo === undefined) {
    return <div aria-hidden className={`${frame} animate-pulse bg-[#efe7dc]`} />;
  }

  if (photo === null) {
    // Keeps cards aligned on desktop; on phones a placeholder banner would just add height.
    return (
      <div
        aria-hidden
        className={`${frame} hidden items-center justify-center text-lg sm:flex ${badgeClass}`}
      >
        ✦
      </div>
    );
  }

  const subject = photo.generic
    ? `Representative photo: ${photo.articleTitle}`
    : photo.articleTitle;
  const credit = [
    photo.artist ? `Photo: ${photo.artist}` : "Photo",
    photo.license,
    "via Wikimedia Commons",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={photo.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${subject} — ${credit}`}
      aria-label={`${subject}. ${credit}. Opens image details on Wikimedia.`}
      className={`${frame} group/photo block bg-[#efe7dc]`}
    >
      <span
        className="activity-photo absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/photo:scale-105"
        // JSON.stringify quotes and escapes the URL so it's safe inside CSS url().
        style={{ backgroundImage: `url(${JSON.stringify(photo.imageUrl)})` }}
      />
      <span className="absolute inset-x-0 bottom-0 truncate bg-[linear-gradient(0deg,rgba(0,0,0,0.6),transparent)] px-2 pb-1 pt-4 text-[9px] text-white opacity-0 transition-opacity duration-300 group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
        {photo.license ?? "Wikimedia"}
      </span>
    </a>
  );
}

export function ActivityCard({
  activity,
  index = 0,
  photo,
}: {
  activity: ItineraryActivity;
  index?: number;
  photo: ActivityPhoto | null | undefined;
}) {
  const key = typeKey(activity.type);
  const style = TYPE_STYLES[key] ?? FALLBACK_STYLE;

  return (
    <article
      className="animate-rise group relative flex gap-4"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Centred on the timeline's 2px border: parent padding (pl-5 / sm:pl-6) + 1px + half the 12px dot */}
      <span
        className={`absolute -left-[27px] top-2 h-3 w-3 rounded-full ring-4 ring-[var(--surface)] transition-transform duration-300 group-hover:scale-125 sm:-left-[31px] ${style.dot}`}
      />
      <div className="flex w-14 shrink-0 flex-col items-end pt-1">
        <time className="font-mono text-sm font-semibold tabular-nums text-[var(--accent)]">
          {activity.time}
        </time>
      </div>
      <div className="relative flex-1 pb-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfb_0%,#f9f4ee_100%)] p-4 shadow-[0_12px_20px_rgba(10,45,60,0.04)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[var(--gold)] group-hover:shadow-[0_20px_36px_rgba(10,45,60,0.09)] sm:flex-row sm:p-5">
          <ActivityThumb photo={photo} badgeClass={style.badge} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="font-display text-base font-semibold leading-snug text-[var(--ink)] sm:text-lg">
                {activity.name}
              </h4>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${style.badge}`}
              >
                {key}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {activity.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
