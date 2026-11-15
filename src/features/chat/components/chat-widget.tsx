"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./chat-panel";

/** The district page's floating chat: opens a compact panel with the district as context. */
export function ChatWidget({
  kecamatanId,
  kecamatanName,
}: {
  kecamatanId: number;
  kecamatanName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="sk-chat-fab"
        aria-expanded={open}
        aria-controls="chat-widget-panel"
        onClick={() => setOpen(true)}
      >
        <MessageCircle size={18} aria-hidden="true" />
        Tanya soal wilayah ini
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="sk-chat-scrim"
            aria-label="Tutup chat"
            onClick={() => setOpen(false)}
          />
          <div
            className="sk-chat-widget"
            id="chat-widget-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Tanya soal ${kecamatanName}`}
          >
            <button
              type="button"
              className="sk-chat-widget__close"
              aria-label="Tutup chat"
              onClick={() => setOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <ChatPanel
              compact
              kecamatanId={kecamatanId}
              kecamatanName={kecamatanName}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
