"use client";

import { useMemo, useState } from "react";
import { useTravelChat } from "@/hooks/useTravelChat";
import { ChatPanel } from "@/components/ChatPanel";
import { ItineraryView } from "@/components/ItineraryView";
import { isDevToolsEnabled } from "@/lib/demoTrip";
import { tripMetaFromItinerary } from "@/lib/tripMeta";

export function TravelPlanner() {
  const {
    messages,
    itinerary,
    tripMetaSource,
    status,
    connection,
    isBusy,
    sendMessage,
    startNewSession,
    demoPreview,
    loadDemoPreview,
    exitDemoPreview,
  } = useTravelChat();

  const devTools = isDevToolsEnabled();

  const [chatExpanded, setChatExpanded] = useState(false);
  const hasItinerary = Boolean(itinerary && itinerary.length > 0);

  const tripMeta = useMemo(() => {
    if (!itinerary?.length) {
      return { destination: null, durationDays: null, intro: null };
    }
    return tripMetaFromItinerary(
      itinerary,
      tripMetaSource ?? undefined,
    );
  }, [itinerary, tripMetaSource]);

  const connectionLabel = demoPreview
    ? "Demo"
    : connection === "open"
      ? "Live"
      : connection === "connecting"
        ? "Connecting…"
        : connection === "error"
          ? "Offline"
          : "Reconnecting…";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0b5d7a_0%,#0b8199_100%)] shadow-[0_10px_24px_rgba(11,93,122,0.22)] ring-1 ring-inset ring-[rgba(199,167,106,0.4)]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-[var(--gold)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Travel planner logo"
            >
              {/* Plane icon path from Lucide (ISC license) */}
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold leading-tight text-[var(--ink)]">
              Travel Planner
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-muted)]">
              Bespoke journeys
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {devTools ? (
            demoPreview ? (
              <button
                type="button"
                onClick={exitDemoPreview}
                className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 transition hover:bg-violet-100"
              >
                Exit demo
              </button>
            ) : (
              <button
                type="button"
                onClick={loadDemoPreview}
                className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 transition hover:bg-violet-100"
              >
                Preview demo trip
              </button>
            )
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${
              connection === "open"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connection === "open" ? "bg-emerald-600" : "bg-amber-600"
              }`}
            />
            {connectionLabel}
          </span>
          <button
            type="button"
            onClick={startNewSession}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-medium text-[var(--ink)] shadow-sm transition hover:bg-white sm:text-xs"
          >
            New trip
          </button>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] ${
          hasItinerary
            ? "bg-[var(--surface)] lg:min-h-[calc(100vh-8rem)] lg:flex-row"
            : ""
        }`}
      >
        {hasItinerary && itinerary ? (
          <ItineraryView
            days={itinerary}
            meta={tripMeta}
            isGenerating={isBusy}
          />
        ) : null}

        <ChatPanel
          messages={messages}
          status={status}
          connection={connection}
          isBusy={isBusy}
          hasItinerary={hasItinerary}
          demoPreview={demoPreview}
          sendMessage={sendMessage}
          expanded={chatExpanded}
          onToggleExpanded={() => setChatExpanded((v) => !v)}
        />
      </div>
    </div>
  );
}
