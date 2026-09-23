"use client";

import { useMemo, useState } from "react";
import type { ItineraryDay } from "@/lib/types";
import { countActivitiesByType, type TripMeta } from "@/lib/tripMeta";
import { ActivityCard } from "@/components/ActivityCard";
import { useActivityPhotos } from "@/hooks/useActivityPhotos";
import { useDestinationPhoto } from "@/hooks/useDestinationPhoto";

export function ItineraryView({
  days,
  meta,
  isGenerating,
}: {
  days: ItineraryDay[];
  meta: TripMeta;
  isGenerating?: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState(days[0]?.day ?? 1);

  // If a refinement removes the selected day, fall back to the first day.
  const active = useMemo(
    () => days.find((d) => d.day === selectedDay) ?? days[0],
    [days, selectedDay],
  );
  const activeDay = active?.day;

  const typeCounts = useMemo(() => countActivitiesByType(days), [days]);
  const totalStops = days.reduce(
    (n, d) => n + (d.activities?.length ?? 0),
    0,
  );
  const foodStops = typeCounts.food ?? 0;

  const photo = useDestinationPhoto(meta.destination);
  // Only the visible day's photos are fetched, keeping Wikipedia requests low.
  const activityPhotos = useActivityPhotos(
    active?.activities ?? [],
    meta.destination,
  );
  const destination = meta.destination ?? "Your trip";
  const duration = meta.durationDays ?? days.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={`trip-hero grain relative overflow-hidden px-5 pb-12 pt-8 sm:px-8 sm:pb-14 sm:pt-10 ${photo ? "has-photo" : ""}`}
      >
        {photo ? (
          <>
            <div
              aria-hidden
              className="hero-photo absolute inset-0 bg-cover bg-center"
              style={{
                // JSON.stringify quotes and escapes the URL so it's safe inside CSS url().
                backgroundImage: `url(${JSON.stringify(photo.imageUrl)})`,
                backgroundColor: photo.color ?? undefined,
              }}
            />
            {/* Neutral scrim behind the title only, so white text stays legible without tinting the photo */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(100deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.2)_45%,transparent_75%)]"
            />
          </>
        ) : null}
        <div className="animate-rise relative z-10">
          <p className="hero-eyebrow text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--gold)] sm:text-xs">
            ✦ {duration}-day journey
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            {destination}
          </h1>
          <div className="gold-rule mt-5 max-w-xs opacity-60" />
          <div className="mt-5 flex flex-wrap gap-2.5 text-sm text-[var(--hero-sub)]">
            <StatPill label="Days" value={String(days.length)} />
            <StatPill label="Stops" value={String(totalStops)} />
            {foodStops > 0 ? (
              <StatPill label="Food" value={String(foodStops)} />
            ) : null}
          </div>
        </div>
        {isGenerating ? (
          <p className="relative z-10 mt-4 animate-pulse text-sm text-[var(--hero-sub)]">
            Updating your plan…
          </p>
        ) : null}
        {photo ? (
          <p className="absolute bottom-7 right-4 z-10 text-[10px] text-white/70 sm:bottom-9 sm:right-8">
            Photo by{" "}
            <a
              href={photo.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/40 underline-offset-2 hover:text-white"
            >
              {photo.photographerName}
            </a>{" "}
            on{" "}
            <a
              href={photo.unsplashUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/40 underline-offset-2 hover:text-white"
            >
              Unsplash
            </a>
          </p>
        ) : null}
        {/* Shoreline: the hero's lower edge breaks like a wave into the day tabs */}
        <svg
          aria-hidden
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-5 w-full sm:h-7"
        >
          <path
            d="M0 24 C240 4 480 40 720 22 S1200 6 1440 24 V40 H0Z"
            fill="#f6f1e8"
          />
        </svg>
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--border)] bg-[linear-gradient(180deg,#f6f1e8_0%,#f1ebdf_100%)] px-4 py-3 sm:px-6">
        {days.map((day) => {
          const selected = day.day === activeDay;
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => setSelectedDay(day.day)}
              className={`relative min-w-[7.5rem] shrink-0 overflow-hidden rounded-2xl px-4 py-3 text-left transition-all duration-300 ${
                selected
                  ? "bg-[linear-gradient(135deg,#0b5d7a_0%,#0b8199_100%)] text-white shadow-[0_14px_24px_rgba(11,93,122,0.22)] after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--gold)]"
                  : "border border-[var(--border)] bg-white/80 text-[var(--ink)] shadow-sm hover:-translate-y-0.5 hover:border-[var(--gold)] hover:shadow-md"
              }`}
            >
              <span
                className={`block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${selected ? "text-[#e9d9b2]" : "text-[var(--accent)]"}`}
              >
                Day {day.day}
              </span>
              <span
                className={`mt-1.5 line-clamp-2 text-xs leading-snug ${selected ? "text-white/90" : "text-[var(--muted)]"}`}
              >
                {day.title}
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <header key={`header-${active.day}`} className="animate-rise mb-7 max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-muted)]">
              Day {active.day} · Curated for you
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
              {active.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {active.activities?.length ?? 0} moments planned
            </p>
          </header>

          {/* Keyed by day so the timeline re-animates on every day switch */}
          <div
            key={`timeline-${active.day}`}
            className="relative max-w-3xl border-l-2 [border-image:linear-gradient(to_bottom,#1fb5c9,#c7a76a)_1] pl-5 sm:pl-6"
          >
            {active.activities?.map((act, i) => (
              <ActivityCard
                key={`${active.day}-${i}`}
                activity={act}
                index={i}
                photo={activityPhotos ? activityPhotos[act.name] : undefined}
              />
            ))}
          </div>

          {active.notes ? (
            <div className="mt-2 max-w-3xl rounded-2xl border border-[#bfe3e9] bg-[linear-gradient(135deg,#e6f5f7_0%,#f7f0e1_100%)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                ✦ Insider notes
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]/85">
                {active.notes}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 backdrop-blur-sm">
      <span className="font-mono text-sm font-semibold text-white">{value}</span>
      <span className="text-xs">{label}</span>
    </span>
  );
}
