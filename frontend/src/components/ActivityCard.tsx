"use client";

import {
  activityStyle,
  activityTypeKey,
  googleMapsUrl,
} from "@/lib/activityStyle";
import type { ActivityPhoto, ItineraryActivity } from "@/lib/types";
import { placeFromActivityName } from "@/lib/wikiPhotos";

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
  const key = activityTypeKey(activity.type);
  const style = activityStyle(activity.type);

  return (
    <article
      className="animate-rise group relative flex gap-4"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Numbered to match the day map's pins. Centred on the timeline's 2px border:
          parent padding (pl-5 / sm:pl-6) + 1px + half the 20px dot */}
      <span
        aria-hidden
        className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-4 ring-[var(--surface)] transition-transform duration-300 group-hover:scale-110 sm:-left-[35px]"
        style={{ backgroundColor: style.color }}
      >
        {index + 1}
      </span>
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
            {activity.address ? (
              <a
                href={googleMapsUrl(
                  placeFromActivityName(activity.name) || activity.name,
                  activity.address,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-start gap-1.5 text-xs text-[var(--accent-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-px h-3.5 w-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span className="underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current">
                  {activity.address}
                </span>
              </a>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {activity.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
