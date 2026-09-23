"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { ChatMessage } from "@/components/ChatMessage";

const STARTERS = [
  "Make day 2 more relaxed",
  "Add a museum on day 1",
  "Swap dinner spots for cheaper options",
];

const TRIP_STARTERS = [
  {
    place: "Tokyo · 3 days",
    prompt: "Plan 3 days in Tokyo — ramen, temples, and neighborhoods",
  },
  {
    place: "Mexico City · Weekend",
    prompt: "Weekend in Mexico City for food and art",
  },
  {
    place: "Amalfi Coast · 5 days",
    prompt: "5 days on the Amalfi Coast — slow mornings, seafood, and a boat day",
  },
  {
    place: "Lisbon · 4 days",
    prompt: "4 days in Lisbon — tiled streets, pastéis de nata, and sunset viewpoints",
  },
];

export function ChatPanel({
  messages,
  status,
  connection,
  isBusy,
  hasItinerary,
  demoPreview = false,
  sendMessage,
  expanded,
  onToggleExpanded,
}: {
  messages: ChatMessageType[];
  status: string | null;
  connection: "connecting" | "open" | "closed" | "error";
  isBusy: boolean;
  hasItinerary: boolean;
  demoPreview?: boolean;
  sendMessage: (text: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!expanded) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status, expanded]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    if (!expanded) onToggleExpanded();
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isBusy) return;
      sendMessage(input);
      setInput("");
      if (!expanded) onToggleExpanded();
    }
  }

  const placeholder = hasItinerary
    ? "Refine your trip — swap days, change pace, add stops…"
    : "Describe your trip — destination, days, budget, interests…";

  return (
    <div
      className={`flex flex-col ${
        hasItinerary
          ? "w-full shrink-0 border-t border-[var(--border)] bg-[var(--surface)] lg:w-[23rem] lg:border-l lg:border-t-0"
          : // Semi-transparent so the tropical page backdrop shows through the landing card.
            "relative min-h-[70vh] flex-1 overflow-hidden rounded-[1.5rem] border border-[#e5dcc7] bg-[radial-gradient(ellipse_at_top_right,rgba(31,181,201,0.14),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(199,167,106,0.1),transparent_40%),linear-gradient(180deg,rgba(255,253,249,0.72)_0%,rgba(247,243,238,0.72)_100%)] shadow-[var(--shadow)]"
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        className={`flex items-center justify-between gap-2 px-4 py-3.5 text-left lg:cursor-default ${
          hasItinerary ? "border-b border-[var(--border)] bg-[linear-gradient(180deg,#eef8f9_0%,#f4efe8_100%)] lg:pointer-events-none" : "border-b border-[var(--border)] bg-[rgba(255,255,255,0.35)]"
        }`}
      >
        <div>
          <h2 className="text-sm font-semibold tracking-[0.08em] text-[var(--ink)] uppercase">
            {hasItinerary ? "Refine your journey" : "Plan your journey"}
          </h2>
          <p className="text-xs text-[var(--muted)]">
            {hasItinerary
              ? "Chat updates your itinerary"
              : "Describe where you want to go"}
          </p>
        </div>
        {hasItinerary ? (
          <span className="rounded-lg border border-[var(--border)] bg-white/70 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
            {expanded ? "Hide" : "Show"}
          </span>
        ) : null}
      </button>

      <div
        className={`flex min-h-0 flex-1 flex-col ${
          hasItinerary && !expanded ? "hidden lg:flex" : "flex"
        }`}
      >
        <div
          ref={listRef}
          className={`space-y-3 overflow-y-auto px-4 py-4 ${
            hasItinerary ? "max-h-48 lg:max-h-none lg:flex-1" : "flex-1"
          }`}
        >
          {messages.length === 0 ? (
            hasItinerary ? (
              <div className="py-4">
                <p className="text-sm text-[var(--muted)]">
                  Ask for changes — slower pace, different neighborhoods, dietary
                  needs, or swap a meal.
                </p>
                <ul className="mt-4 space-y-2">
                  {STARTERS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        disabled={isBusy || demoPreview || connection !== "open"}
                        onClick={() => sendMessage(s)}
                        className="w-full rounded-xl border border-[#e1d4ba] bg-[linear-gradient(180deg,#fffefc_0%,#f7f2eb_100%)] px-3 py-2.5 text-left text-xs text-[var(--ink)] shadow-sm transition hover:border-[var(--gold)] hover:bg-white disabled:opacity-50"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col items-center py-10 text-center sm:py-16">
                <p className="animate-rise text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--accent-muted)] sm:text-xs">
                  ✦ Bespoke itineraries, composed in seconds
                </p>
                <h1
                  className="animate-rise mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--ink)] sm:text-7xl"
                  style={{ animationDelay: "80ms" }}
                >
                  Where to <span className="text-gold">next</span>?
                </h1>
                <p
                  className="animate-rise mt-5 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base"
                  style={{ animationDelay: "160ms" }}
                >
                  Tell me the destination, how long you have, and what moves
                  you. I&apos;ll compose a day-by-day journey you can refine as
                  you go.
                </p>
                <svg
                  aria-hidden
                  viewBox="0 0 124 12"
                  className="mt-8 h-3 w-32 text-[var(--gold)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M2 6 Q12 0 22 6 T42 6 T62 6 T82 6 T102 6 T122 6" />
                </svg>
                <ul className="mt-8 grid w-full gap-3 text-left sm:grid-cols-2">
                  {TRIP_STARTERS.map((s, i) => (
                    <li
                      key={s.prompt}
                      className="animate-rise"
                      style={{ animationDelay: `${240 + i * 70}ms` }}
                    >
                      <button
                        type="button"
                        disabled={isBusy || demoPreview || connection !== "open"}
                        onClick={() => sendMessage(s.prompt)}
                        className="group flex h-full w-full items-start justify-between gap-3 rounded-2xl text-left border border-[#e1d4ba] bg-white/70 px-4 py-3.5 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[var(--gold)] hover:bg-white hover:shadow-[0_16px_30px_rgba(10,45,60,0.08)] disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span>
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a2e]">
                            {s.place}
                          </span>
                          <span className="mt-1 block text-sm leading-snug text-[var(--ink)]">
                            {s.prompt}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-4 text-[var(--gold)] transition-transform duration-300 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ) : (
            messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                compact={hasItinerary}
              />
            ))
          )}
          {status ? (
            <p className="text-center text-xs text-[var(--muted)]">{status}</p>
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-[var(--border)] bg-[linear-gradient(180deg,rgba(246,241,232,0.75)_0%,rgba(240,234,223,0.75)_100%)] p-3"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              rows={hasItinerary ? 2 : 3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              disabled={isBusy || demoPreview || connection !== "open"}
              className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-[#e0d3ba] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink)] shadow-inner outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(11,93,122,0.12)] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={
                isBusy || demoPreview || connection !== "open" || !input.trim()
              }
              className="group inline-flex items-center gap-2 self-end rounded-2xl bg-[linear-gradient(135deg,#0b5d7a_0%,#0b8199_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(11,93,122,0.2)] ring-1 ring-inset ring-[rgba(199,167,106,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Send
              <span
                aria-hidden
                className="text-[var(--gold)] transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
