"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getWsChatUrl } from "@/lib/config";
import {
  buildDemoChatMessages,
  DEMO_ITINERARY,
  DEMO_TRIP_META_SOURCE,
} from "@/lib/demoTrip";
import { planningStatusMessage } from "@/lib/messageContent";
import { compactPlanMessage } from "@/lib/tripMeta";
import type {
  ChatMessage,
  ConnectionState,
  ItineraryDay,
  WsServerEvent,
} from "@/lib/types";

const SESSION_KEY = "travel-planner-session-id";

function parseSessionFromStatus(content: string): string | null {
  const match = content.match(/^Session:\s*(.+)$/);
  return match ? match[1].trim() : null;
}

function newId(): string {
  return crypto.randomUUID();
}

export function useTravelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [tripMetaSource, setTripMetaSource] = useState<string | null>(null);
  const [demoPreview, setDemoPreview] = useState(false);
  const demoPreviewRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<string[]>([]);
  const streamIdRef = useRef<string | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itineraryRef = useRef<ItineraryDay[] | null>(null);
  // Lets the socket's onclose handler schedule a reconnect via the latest `connect`.
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    itineraryRef.current = itinerary;
  }, [itinerary]);

  useEffect(() => {
    demoPreviewRef.current = demoPreview;
  }, [demoPreview]);

  const flushPending = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    while (pendingRef.current.length > 0) {
      const msg = pendingRef.current.shift();
      if (msg) ws.send(msg);
    }
  }, []);

  const sendRaw = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(text);
      } else {
        pendingRef.current.push(text);
      }
    },
    [],
  );

  const connect = useCallback(() => {
    if (demoPreviewRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnection("connecting");
    const stored = localStorage.getItem(SESSION_KEY);
    const ws = new WebSocket(getWsChatUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnection("open");
      ws.send(stored && stored.length > 0 ? stored : "new");
      flushPending();
    };

    ws.onmessage = (event) => {
      let data: WsServerEvent;
      try {
        data = JSON.parse(event.data) as WsServerEvent;
      } catch {
        return;
      }

      if (data.type === "status") {
        const sid = parseSessionFromStatus(data.content);
        if (sid) {
          setSessionId(sid);
          localStorage.setItem(SESSION_KEY, sid);
        } else {
          setStatus(data.content);
        }
        return;
      }

      if (data.type === "token") {
        setStatus(null);
        const streamId = streamIdRef.current;
        if (!streamId) return;

        const skipVerboseChat = (itineraryRef.current?.length ?? 0) > 0;
        const nextContent = `${data.content}`;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== streamId) return m;
            return { ...m, content: m.content + nextContent };
          }),
        );

        if (!skipVerboseChat) {
          setStatus(planningStatusMessage());
        }
        return;
      }

      if (data.type === "result") {
        const streamId = streamIdRef.current;
        const planDays = data.itinerary?.length ?? 0;

        const finalContent = data.content ?? "";

        if (planDays > 0 && finalContent) {
          setTripMetaSource(finalContent);
        }
        const displayContent =
          planDays > 0 && finalContent
            ? compactPlanMessage(finalContent, planDays)
            : finalContent;

        setMessages((prev) => {
          if (!streamId) return prev;
          return prev.map((m) =>
            m.id === streamId
              ? {
                  ...m,
                  content: displayContent || m.content,
                  streaming: false,
                }
              : m,
          );
        });
        streamIdRef.current = null;
        if (data.intent) setIntent(data.intent);
        if (data.itinerary) setItinerary(data.itinerary);
        setStatus(null);
        setIsBusy(false);
        return;
      }

      if (data.type === "error") {
        setStatus(data.content);
        setConnection("error");
        setIsBusy(false);
        streamIdRef.current = null;
      }
    };

    ws.onclose = () => {
      // Ignore sockets we already replaced or closed on purpose.
      if (wsRef.current !== ws) return;
      setConnection("closed");
      wsRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(() => connectRef.current(), 2000);
    };

    ws.onerror = () => {
      setConnection("error");
    };
  }, [flushPending]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (demoPreview) return;
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [connect, demoPreview]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy || demoPreviewRef.current) return;

      const userMsg: ChatMessage = {
        id: newId(),
        role: "human",
        content: trimmed,
      };
      const assistantId = newId();
      streamIdRef.current = assistantId;

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "ai", content: "", streaming: true },
      ]);
      setIsBusy(true);
      setStatus("Sending...");
      sendRaw(trimmed);
    },
    [isBusy, sendRaw],
  );

  const startNewSession = useCallback(() => {
    setDemoPreview(false);
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([]);
    setItinerary(null);
    setTripMetaSource(null);
    setIntent(null);
    setStatus(null);
    wsRef.current?.close();
    pendingRef.current = [];
    streamIdRef.current = null;
    setIsBusy(false);
    connect();
  }, [connect]);

  const loadDemoPreview = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
    pendingRef.current = [];
    streamIdRef.current = null;
    setDemoPreview(true);
    setSessionId("demo-preview");
    setItinerary(DEMO_ITINERARY);
    setTripMetaSource(DEMO_TRIP_META_SOURCE);
    setMessages(buildDemoChatMessages());
    setIntent("new_trip");
    setStatus(null);
    setIsBusy(false);
    setConnection("open");
  }, []);

  const exitDemoPreview = useCallback(() => {
    setDemoPreview(false);
    startNewSession();
  }, [startNewSession]);

  return {
    messages,
    itinerary,
    tripMetaSource,
    status,
    intent,
    connection,
    sessionId,
    isBusy,
    sendMessage,
    startNewSession,
    demoPreview,
    loadDemoPreview,
    exitDemoPreview,
  };
}
