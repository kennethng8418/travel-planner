import type { ItineraryDay } from "@/lib/types";
import { defaultPlanReadyMessage } from "@/lib/messageContent";

export interface TripMeta {
  destination: string | null;
  durationDays: number | null;
  intro: string | null;
}

const INTRO_RE =
  /here'?s your (\d+)-day itinerary for ([^!\n]+)!/i;

export function parseTripMetaFromText(text: string): TripMeta {
  const match = text.match(INTRO_RE);
  if (!match) {
    return { destination: null, durationDays: null, intro: null };
  }
  return {
    durationDays: parseInt(match[1], 10),
    destination: match[2].trim(),
    intro: match[0],
  };
}

export function tripMetaFromItinerary(
  days: ItineraryDay[],
  lastAssistantText?: string,
): TripMeta {
  const fromText = lastAssistantText
    ? parseTripMetaFromText(lastAssistantText)
    : { destination: null, durationDays: null, intro: null };

  return {
    destination: fromText.destination,
    durationDays: fromText.durationDays ?? days.length,
    intro: fromText.intro,
  };
}

export function compactPlanMessage(content: string, dayCount: number): string {
  if (!content.trim()) {
    return defaultPlanReadyMessage(dayCount);
  }

  const introMatch = content.match(/^[^\n]+!\n*/);
  const intro =
    introMatch?.[0]?.trim() ??
    `Here's your ${dayCount}-day itinerary!`;

  const closingMatch = content.match(
    /Would you like to adjust[\s\S]*$/i,
  );
  const closing =
    closingMatch?.[0]?.trim() ??
    "Would you like to adjust anything? I can swap days, change the pace, or focus on specific interests.";

  return `${intro}\n\nYour day-by-day schedule is on the left. Use chat to refine stops, meals, or timing.\n\n${closing}`;
}

export function countActivitiesByType(days: ItineraryDay[]) {
  const counts: Record<string, number> = {};
  for (const day of days) {
    for (const act of day.activities ?? []) {
      const key = (act.type ?? "other").split("|")[0].trim().toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}
