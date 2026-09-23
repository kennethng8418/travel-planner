export function planningStatusMessage(): string {
  return "Building your itinerary…";
}

export function defaultPlanReadyMessage(dayCount: number): string {
  return `Here's your ${dayCount}-day itinerary!\n\nYour day-by-day schedule is on the left. Use chat to refine stops, meals, or timing.\n\nWould you like to adjust anything? I can swap days, change the pace, or focus on specific interests.`;
}
