const DEFAULT_API = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  return url && url.length > 0 ? url.replace(/\/$/, "") : DEFAULT_API;
}

export function getWsChatUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith("https://")) {
    return base.replace(/^https:/, "wss:") + "/ws/chat";
  }
  return base.replace(/^http:/, "ws:") + "/ws/chat";
}
