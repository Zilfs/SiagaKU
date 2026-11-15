"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { TriangleExclamationPoint, X } from "lucide-react";
import { toAlertInfo, toStatusName, type AlertInfo } from "../alert-data";
import {
  getHiddenSnapshot,
  getServerSnapshot,
  getWatchSnapshot,
  hideBanner,
  parseWatched,
  subscribe,
} from "../local-store";

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
  const [state, setState] = useState<{ kode: string; data: AlertInfo | null } | null>(
    null,
  );

  useEffect(() => {
    if (!kode) return;
    let cancelled = false;
    fetch(`/api/early-warning/${kode}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (!cancelled) {
          setState({ kode, data: payload ? toAlertInfo(payload) : null });
        }
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
  const previewStatus = toStatusName(debug);
  const preview =
    previewStatus === "Siaga" || previewStatus === "Awas" ? previewStatus : null;
  const data = watched && state?.kode === watched.kode ? state.data : null;
  const status = preview ?? data?.status ?? null;

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
        {data?.category ? ` · ${data.category}` : ""}
        {data?.rainfallMm != null ? ` · hujan ${data.rainfallMm} mm` : ""}
        {data?.windowLabel ? ` · ${data.windowLabel}` : ""}
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
