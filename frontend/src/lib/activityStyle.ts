// Category colours shared by the timeline cards and the day map's pins,
// so a stop's dot and its pin always match. Muted tones that sit inside the sand/lagoon palette.

const TYPE_STYLES: Record<string, { badge: string; color: string }> = {
  food: { badge: "bg-[#f6ecd6] text-[#7a5a1e]", color: "#b8944f" },
  sightseeing: { badge: "bg-[#dcf1f5] text-[#0b5d7a]", color: "#1596b0" },
  culture: { badge: "bg-[#efe6ee] text-[#5b3a58]", color: "#8a5a86" },
  nature: { badge: "bg-[#e6eee2] text-[#3d5a34]", color: "#6b8f5e" },
  history: { badge: "bg-[#ece6dc] text-[#5a4d3b]", color: "#8c7a5f" },
  shopping: { badge: "bg-[#f3e4df] text-[#7a3f33]", color: "#b86b5a" },
  transport: { badge: "bg-[#e6e9ea] text-[#3d4a4f]", color: "#6d7c82" },
};

const FALLBACK_STYLE = { badge: "bg-[#dcf1f5] text-[#0b5d7a]", color: "#0b5d7a" };

/** The model sometimes returns "food | culture"; the first category wins. */
export function activityTypeKey(type?: string): string {
  return (type ?? "other").split("|")[0]?.trim().toLowerCase() || "other";
}

export function activityStyle(type?: string) {
  return TYPE_STYLES[activityTypeKey(type)] ?? FALLBACK_STYLE;
}

/** Google Maps search for a stop; works from the venue name even when the address is only a neighbourhood. */
export function googleMapsUrl(place: string, address?: string): string {
  const query = [place, address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
