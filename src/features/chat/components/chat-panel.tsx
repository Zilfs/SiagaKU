"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Square } from "lucide-react";
import { EmergencyCard } from "./emergency-card";
import { MessageBubble } from "./message-bubble";
import { SourceList, normaliseSources, type ChatSource } from "./source-list";
import { SuggestionChips } from "./suggestion-chips";

type Meta = { provider?: string; fallback?: boolean };

function textOf(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("");
}

function dataOf<T>(message: UIMessage | undefined, name: string): T | undefined {
  if (!message) return undefined;
  for (const part of message.parts) {
    if (part.type === `data-${name}`) {
      return (part as { data?: T }).data;
    }
  }
  return undefined;
}

function sourcesOf(value: unknown): ChatSource[] {
  if (Array.isArray(value)) {
    return normaliseSources(value as Array<Record<string, unknown>>);
  }
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)) {
    return normaliseSources(
      (value as { items: Array<Record<string, unknown>> }).items,
    );
  }
  return [];
}

/**
 * The chat surface: the AI SDK stream, the sources of the latest answer, and the emergency card.
 * The route is `/api/chat`; with no provider key the backend returns its template (the badge says
 * "Penjelasan" rather than "AI").
 */
export function ChatPanel({
  kecamatanId,
  kecamatanName,
  compact = false,
}: {
  kecamatanId?: number;
  kecamatanName?: string;
  compact?: boolean;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: kecamatanId ? { kecamatan_id: kecamatanId } : {},
      }),
    [kecamatanId],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const sources = sourcesOf(dataOf<unknown>(latestAssistant, "sources"));
  const rawEmergency = dataOf<boolean | { detected?: boolean }>(
    latestAssistant,
    "darurat",
  );
  const emergency =
    typeof rawEmergency === "boolean"
      ? rawEmergency
      : Boolean(rawEmergency?.detected);
  const meta = dataOf<Meta>(latestAssistant, "meta");
  const ai = Boolean(meta?.provider && meta.provider !== "template");

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, status, error]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    void sendMessage({ text: question });
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <section
      className={compact ? "sk-chat sk-chat--compact" : "sk-chat"}
      aria-label="Tanya SiagaKU"
    >
      <header className="sk-chat__head">
        <div className="sk-chat__title">
          <b>Tanya SiagaKU</b>
          {kecamatanName ? <span>Konteks: {kecamatanName}</span> : null}
        </div>
        <span className="sk-chat__status" role="status">
          {busy ? "Menjawab…" : "Siap"}
        </span>
      </header>

      <div
        className="sk-chat__log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && !error ? (
          <div className="sk-chat__empty">
            <p>
              Halo! Tanyakan apa saja soal persiapan menghadapi banjir. Jawaban
              kami bersumber dari pedoman BNPB dan BPBD.
            </p>
            <SuggestionChips onPick={send} />
          </div>
        ) : null}

        {messages.map((message) => {
          const text = textOf(message);
          if (!text) return null;
          const last = message.id === latestAssistant?.id;
          return (
            <Fragment key={message.id}>
              {last && emergency ? <EmergencyCard /> : null}
              <MessageBubble
                role={message.role}
                text={text}
                ai={message.role === "assistant" && ai}
              />
              {last && sources.length > 0 ? (
                <SourceList sources={sources} />
              ) : null}
            </Fragment>
          );
        })}

        {error ? (
          <MessageBubble
            role="system"
            text="Maaf, SiagaKU sedang sibuk. Coba lagi beberapa saat lagi, atau hubungi 112 kalau dalam bahaya."
          />
        ) : null}

        {busy ? (
          <div className="sk-chat__typing" role="status">
            Mengetik…
          </div>
        ) : null}
      </div>

      <form
        className="sk-chat__form"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <label className="sr-only" htmlFor="chat-input">
          Ketik pertanyaan
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send(input);
            }
          }}
          placeholder="Ketik pertanyaan…"
          autoComplete="off"
          maxLength={1000}
          disabled={busy}
        />
        {busy ? (
          <button
            type="button"
            className="sk-chat__stop"
            onClick={stop}
            aria-label="Hentikan jawaban"
          >
            <Square size={14} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn--primary sk-chat__send"
            disabled={!input.trim()}
            aria-label="Kirim pertanyaan"
          >
            <ArrowUp size={17} aria-hidden="true" />
          </button>
        )}
      </form>

      <p className="sk-chat__note">
        Isian diproses AI. Jangan tulis data pribadi. Periksa kembali jawaban
        sebelum memakainya.
      </p>
    </section>
  );
}
