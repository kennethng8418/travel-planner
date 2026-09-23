"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { planningStatusMessage } from "@/lib/messageContent";

function renderAssistantText(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessage({
  message,
  compact = false,
}: {
  message: ChatMessageType;
  compact?: boolean;
}) {
  const isUser = message.role === "human";

  return (
    <div
      className={`animate-rise flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[min(100%,100%)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[linear-gradient(135deg,#0b5d7a_0%,#0b8199_100%)] text-white shadow-[0_8px_18px_rgba(11,93,122,0.18)]"
            : "rounded-bl-md border border-[#e5d9c1] bg-white text-[var(--ink)] shadow-[0_6px_16px_rgba(10,45,60,0.05)]"
        } ${compact && !isUser ? "max-w-full" : ""}`}
      >
        {message.streaming && (!message.content || compact) ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#e3d3ad] bg-[linear-gradient(135deg,#fbf6ea_0%,var(--gold-soft)_100%)] px-3.5 py-2.5 text-[var(--muted)] shadow-[0_6px_18px_rgba(199,167,106,0.12)]">
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 p-1.5 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold)]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold)] [animation-delay:150ms]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold)] [animation-delay:300ms]"></span>
            </div>
            <span className="text-sm font-medium text-[var(--ink)]">
              {compact ? planningStatusMessage() : "Thinking…"}
            </span>
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <p className="whitespace-pre-wrap">
            {renderAssistantText(message.content)}
          </p>
        )}
      </div>
    </div>
  );
}
