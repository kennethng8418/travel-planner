export type ActivityType =
  | "sightseeing"
  | "food"
  | "culture"
  | "nature"
  | "shopping"
  | "transport"
  | string;

export interface ItineraryActivity {
  time: string;
  name: string;
  description: string;
  location?: string;
  type?: ActivityType;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: "human" | "ai";
  content: string;
  streaming?: boolean;
}

export type WsServerEvent =
  | { type: "status"; content: string }
  | { type: "token"; content: string }
  | {
      type: "result";
      content: string;
      intent?: string | null;
      itinerary?: ItineraryDay[] | null;
    }
  | { type: "error"; content: string };

export type ConnectionState = "connecting" | "open" | "closed" | "error";

/** A destination photo from Unsplash, with the credit its API terms require us to show. */
export interface DestinationPhoto {
  imageUrl: string;
  color: string | null;
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
}

/** An activity photo: the lead image of the best-matching Wikipedia article. */
export interface ActivityPhoto {
  imageUrl: string;
  articleTitle: string;
  /** True when it's a representative photo (e.g. of ramen) rather than the specific place. */
  generic: boolean;
  /** Wikimedia file page — holds the full author and licence details. */
  fileUrl: string;
  artist: string | null;
  license: string | null;
}
