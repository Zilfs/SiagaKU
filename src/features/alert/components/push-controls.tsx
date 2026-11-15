"use client";

import { useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import {
  sendTestPush,
  subscribePush,
  unsubscribePush,
} from "@/lib/push-client";

/** Enable push for the watched kelurahan, send a test, or stop watching. */
export function PushControls({
  kode,
  onStop,
}: {
  kode: string;
  onStop: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const run = async (success: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Notifikasi belum bisa diaktifkan di perangkat ini.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sk-push">
      <div className="sk-push__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() =>
            run("Notifikasi aktif untuk wilayah ini.", () => subscribePush(kode))
          }
        >
          <Bell size={16} aria-hidden="true" />
          Aktifkan notifikasi
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => run("Notifikasi uji dikirim.", sendTestPush)}
        >
          <Send size={16} aria-hidden="true" />
          Kirim notifikasi uji
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => {
            onStop();
            void unsubscribePush();
            setMessage("Berhenti memantau wilayah ini.");
          }}
        >
          <BellOff size={16} aria-hidden="true" />
          Berhenti memantau
        </button>
      </div>
      {message ? (
        <p className="sk-field__hint" role="status">
          {message}
        </p>
      ) : null}
      <p className="sk-field__hint">
        Notifikasi butuh izin browser dan koneksi HTTPS. Di iPhone, pasang
        SiagaKU ke Layar Utama dulu.
      </p>
    </div>
  );
}
