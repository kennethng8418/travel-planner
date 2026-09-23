import type { ChatMessage, ItineraryDay } from "@/lib/types";
import { compactPlanMessage } from "@/lib/tripMeta";

export const DEMO_TRIP_META_SOURCE = `Here's your 3-day itinerary for Tokyo!

**Day 1: Exploring Asakusa & Ueno — History and Culture**
  09:00 — Senso-ji Temple: Tokyo's oldest and most iconic Buddhist temple.

Would you like to adjust anything? I can swap days, add activities, change the pace, or focus on specific interests.`;

export const DEMO_ITINERARY: ItineraryDay[] = [
  {
    day: 1,
    title: "Exploring Asakusa & Ueno — History and Culture",
    activities: [
      {
        time: "09:00",
        name: "Senso-ji Temple",
        description:
          "Tokyo's oldest and most iconic Buddhist temple. Arrive early to beat the crowds. Walk through Kaminarimon Gate and Nakamise shopping street for souvenirs and traditional snacks.",
        type: "culture",
      },
      {
        time: "10:30",
        name: "Asakusa Neighborhood Stroll",
        description:
          "Wander the backstreets of Asakusa to discover old-school Tokyo vibes, traditional craft shops, and local shrines. Visit Dempoin Street for a quieter, historic atmosphere.",
        type: "sightseeing",
      },
      {
        time: "12:00",
        name: "Lunch at Asakusa Mugimaru (Ramen)",
        description:
          "Enjoy a bowl of classic Tokyo-style shoyu ramen in a cozy local setting. Expect a short queue — it moves quickly. Try the chashu pork topping.",
        type: "food",
      },
      {
        time: "13:30",
        name: "Ueno Park & Tokyo National Museum",
        description:
          "A 15-minute walk or short taxi ride from Asakusa. Stroll through Ueno Park then visit the Tokyo National Museum to explore Japanese art, samurai armor, and ancient artifacts. Allow 1.5–2 hours inside.",
        type: "culture",
      },
      {
        time: "16:00",
        name: "Yanaka Ginza — Old Tokyo Neighborhood",
        description:
          "Walk or take a short train ride to Yanaka, one of Tokyo's best-preserved historic neighborhoods. Browse the retro shotengai (shopping street), try local street food, and soak in the pre-war Tokyo atmosphere.",
        type: "sightseeing",
      },
      {
        time: "19:00",
        name: "Dinner at Fuunji (Tsukemen Ramen, Shinjuku area)",
        description:
          "Head to Shinjuku for dinner at Fuunji, famous for its rich, umami-packed tsukemen (dipping ramen). Arrive by 18:30 to minimize wait time. Lines form quickly but move fast.",
        type: "food",
      },
    ],
    notes:
      "Purchase a Suica or Pasmo IC card at any major station for seamless transit all day. Senso-ji is open 24 hours but the grounds are best visited between 9–11am. The Tokyo National Museum is closed on Mondays — confirm opening hours before visiting.",
  },
  {
    day: 2,
    title: "Shinjuku & Harajuku — Neighborhoods and Temples",
    activities: [
      {
        time: "08:30",
        name: "Meiji Jingu Shrine",
        description:
          "Start your morning at this serene Shinto shrine set within a forested park in the heart of the city. Walk the gravel path through towering torii gates. Peaceful and uncrowded in the early morning. Allow 45–60 minutes.",
        type: "culture",
      },
      {
        time: "10:00",
        name: "Harajuku Neighborhood Exploration",
        description:
          "Explore Takeshita Street for quirky pop culture and youth fashion, then walk down the adjacent Omotesando boulevard for high-end boutiques and beautiful tree-lined architecture.",
        type: "sightseeing",
      },
      {
        time: "12:00",
        name: "Lunch at Afuri Ramen (Harajuku)",
        description:
          "Afuri is famous for its light yuzu-shio (citrus salt) ramen — a refreshing contrast to heavier styles. The Harajuku branch is conveniently located and has a modern, stylish interior.",
        type: "food",
      },
      {
        time: "13:30",
        name: "Shinjuku Gyoen National Garden",
        description:
          "A 15-minute walk or short train ride to one of Tokyo's most beautiful gardens. Blend of French, English, and Japanese garden styles. Perfect for a relaxed afternoon walk. Closes at 16:30 (last entry 16:00).",
        type: "nature",
      },
      {
        time: "16:30",
        name: "Golden Gai & Kabukicho Exploration",
        description:
          "Explore the narrow alleys of Golden Gai in Shinjuku — a maze of tiny atmospheric bars. Browse the area at dusk before dinner to appreciate the neon-lit energy of Kabukicho entertainment district.",
        type: "sightseeing",
      },
      {
        time: "19:00",
        name: "Dinner at Ichiran Ramen (Shinjuku)",
        description:
          "A quintessential Tokyo ramen experience. Ichiran's solo booth dining concept lets you customize your tonkotsu ramen to your exact preference. Open late — ideal for a relaxed dinner after exploring.",
        type: "food",
      },
    ],
    notes:
      "Meiji Shrine is a 5-minute walk from Harajuku Station (JR Yamanote Line). Shinjuku Gyoen has a small entrance fee (500 yen). Alcohol is not permitted in the garden. Golden Gai bars are tiny and intimate — most welcome solo travelers and tourists.",
  },
  {
    day: 3,
    title: "Shibuya, Yanaka & Imperial Palace — Icons and Hidden Gems",
    activities: [
      {
        time: "09:00",
        name: "Imperial Palace East Gardens",
        description:
          "Start the day at the historic heart of Tokyo. The East Gardens of the Imperial Palace are open to the public and contain ruins of the old Edo Castle. Peaceful morning walks with Japanese garden scenery and koi ponds.",
        type: "history",
      },
      {
        time: "10:30",
        name: "Nihonbashi Neighborhood Walk",
        description:
          "A short walk from the palace, Nihonbashi is Tokyo's historic merchant and financial district. See the original Nihonbashi bridge (the geographic center of Japan's road network), traditional department stores, and Edo-era architecture.",
        type: "culture",
      },
      {
        time: "12:00",
        name: "Lunch at Fuji Ramen (Shibuya area) or Ramen Street",
        description:
          "Head to Shibuya for lunch. Tokyo Ramen Street inside Tokyo Station (a short detour) features eight acclaimed ramen shops under one roof — an excellent final ramen stop to compare styles from your trip.",
        type: "food",
      },
      {
        time: "14:00",
        name: "Shibuya Crossing & Scramble Square Observation Deck",
        description:
          "Experience the world-famous Shibuya Scramble Crossing on foot, then head up to the Shibuya Sky observation deck on the 46th floor of Scramble Square for panoramic views of Tokyo. Book tickets in advance online.",
        type: "sightseeing",
      },
      {
        time: "16:00",
        name: "Daikanyama & Nakameguro Stroll",
        description:
          "Walk 15 minutes south to the stylish, tree-lined neighborhoods of Daikanyama and Nakameguro. Browse independent boutiques, visit the iconic Tsutaya Books, and walk along the Meguro River canal — beautiful at golden hour.",
        type: "sightseeing",
      },
      {
        time: "19:00",
        name: "Farewell Dinner at Nakiryu (Michelin-starred Ramen, Otsuka)",
        description:
          "End your Tokyo trip with a bowl of Michelin-starred tantanmen ramen at Nakiryu. Arrive by 18:00 to secure a place in line — the restaurant is small and fills up fast. A memorable, fitting finale to a food-focused trip.",
        type: "food",
      },
    ],
    notes:
      "The Imperial Palace East Gardens are closed on Mondays and Fridays. Shibuya Sky observation deck tickets should be booked online 1–2 days in advance to guarantee entry. If Nakiryu's queue is too long, Fuunji and Ichiran both have Shibuya-area locations as excellent backups. Consider buying a 72-hour metro pass if you haven't already — it covers most subway lines across all three days.",
  },
];

const DEMO_USER_PROMPT =
  "Plan 3 days in Tokyo — ramen, temples, and neighborhoods";

export function buildDemoChatMessages(): ChatMessage[] {
  const assistantText = compactPlanMessage(
    DEMO_TRIP_META_SOURCE,
    DEMO_ITINERARY.length,
  );
  return [
    {
      id: "demo-user",
      role: "human",
      content: DEMO_USER_PROMPT,
    },
    {
      id: "demo-assistant",
      role: "ai",
      content: assistantText,
      streaming: false,
    },
  ];
}

export function isDevToolsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEV_TOOLS === "true") return true;
  return process.env.NODE_ENV === "development";
}
