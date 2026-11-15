"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { TriangleExclamationPoint, X } from "lucide-react";
import {
  getHiddenSnapshot,
  getServerSnapshot,
  getWatchSnapshot,
  hideBanner,
  parseWatched,
  subscribe,
} from "../local-store";

type AlertData = {
  status?: string;
  kategoriHujan?: string | null;
  hujan24jMm?: number;
  jendela?: { mulai?: string; selesai?: string } | null;
};

const mountedSnapshot = () => true;

/**
 * The in-app banner: only for a watched area at Siaga/Awas, closable for three hours. The
 * `?debugStatus=Siaga|Awas` preview is development-only (disabled in a production build).
 */
export function AlertBanner() {
  const mounted = useSyncExternalStore(
    subscribe,
    mountedSnapshot,
    () => false,
  );
  const watchRaw = useSyncExternalStore(
    subscribe,
    getWatchSnapshot,
    getServerSnapshot,
  );
  const hidden = useSyncExternalStore(
    subscribe,
    getHiddenSnapshot,
    () => false,
  );
  const watched = parseWatched(watchRaw);
  const kode = watched?.kode;
  const [state, setState] = useState<{ kode: string; data: AlertData | null } | null>(
    null,
  );

  useEffect(() => {
    if (!kode) return;
    let cancelled = false;
    fetch(`/api/peringatan/${kode}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AlertData | null) => {
        if (!cancelled) setState({ kode, data });
      })
      .catch(() => {
        if (!cancelled) setState({ kode, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [kode]);

  if (!mounted) return null;

  const debug =
    process.env.NODE_ENV !== "production" && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("debugStatus")
      : null;
  const preview = debug === "Siaga" || debug === "Awas" ? debug : null;
  const data = watched && state?.kode === watched.kode ? state.data : null;
  const status = preview ?? data?.status;

  if (status !== "Siaga" && status !== "Awas") return null;
  if (!preview && hidden) return null;

  return (
    <div
      className={
        status === "Awas" ? "sk-alert sk-alert--warning" : "sk-alert sk-alert--watch"
      }
      role="status"
      aria-live="polite"
    >
      <TriangleExclamationPoint size={18} aria-hidden="true" />
      <p>
        <b>
          {status} di {watched?.nama ?? "wilayah contoh"}
        </b>
        {data?.kategoriHujan ? ` · ${data.kategoriHujan}` : ""}
        {data?.hujan24jMm != null ? ` · hujan ${data.hujan24jMm} mm` : ""}
        {data?.jendela?.mulai && data.jendela.selesai
          ? ` · ${data.jendela.mulai}–${data.jendela.selesai}`
          : ""}
      </p>
      <Link href="/peringatan">Lihat detail</Link>
      <button
        type="button"
        className="sk-alert__close"
        aria-label="Tutup peringatan"
        onClick={() => hideBanner(3)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
