"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ListChecks, MapPin, TriangleAlert } from "lucide-react";
import { RiskMap } from "@/components/map/risk-map";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";
import type { MapReport } from "@/components/map/map-types";
import { severityLabel, toReportPoint, type RawReport } from "../report-point";
import type { ReportPoint } from "../types";

const TIME = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function formatTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : TIME.format(date);
}

export function ReportFeed() {
  const [reports, setReports] = useState<ReportPoint[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports?hours=72", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("not ready");
        const payload = (await response.json()) as
          { data?: RawReport[] } | RawReport[];
        const rows = Array.isArray(payload) ? payload : (payload.data ?? []);
        const list = rows
          .map(toReportPoint)
          .filter((item): item is ReportPoint => item !== null);
        if (!cancelled) setReports(list);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setReports([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const markers: MapReport[] = (reports ?? []).map((report) => ({
    id: report.id,
    lat: report.lat,
    lng: report.lng,
    severity: report.severity,
    summary: report.summary,
    isDemo: report.isDemo,
  }));

  return (
    <>
      <div className="sk-map-shell sk-map-shell--reports">
        <RiskMap
          items={[]}
          reports={markers}
          label="Peta laporan genangan warga di Jakarta"
        />
      </div>

      <section aria-labelledby="laporan-h" className="sk-report-feed">
        <div className="sk-card__head">
          <h2 id="laporan-h" className="sk-heading-icon">
            <ListChecks size={18} aria-hidden="true" />
            Laporan 72 jam terakhir
          </h2>
          <span className="sk-mono">
            {reports === null ? "memuat…" : `${reports.length} laporan`}
          </span>
        </div>

        {reports === null ? (
          <>
            <LoadingStatus />
            <ul className="sk-report-list" aria-busy="true">
              {[0, 1, 2].map((n) => (
                <li key={n} className="sk-report-card" aria-hidden="true">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="sk-report-card__body">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : reports.length === 0 ? (
          <div className="sk-report-empty">
            {failed ? (
              <TriangleAlert size={20} aria-hidden="true" />
            ) : (
              <MapPin size={20} aria-hidden="true" />
            )}
            <p>
              {failed
                ? "Laporan warga belum bisa dimuat. Coba lagi beberapa saat lagi."
                : "Belum ada laporan warga dalam 72 jam terakhir."}
            </p>
            {failed ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setReports(null);
                  setFailed(false);
                  setAttempt((n) => n + 1);
                }}
              >
                Coba lagi
              </button>
            ) : (
              <Link className="btn btn--primary" href="/lapor">
                <Camera size={16} aria-hidden="true" />
                Lapor genangan
              </Link>
            )}
          </div>
        ) : (
          <ul className="sk-report-list">
            {reports.map((report) => {
              const time = formatTime(report.createdAt);
              return (
                <li key={report.id} className="sk-report-card">
                  {report.photoUrl ? (
                    // the photo is served from the report bucket; it is the content, not decoration
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={report.photoUrl}
                      alt={`Foto laporan: ${report.summary || "genangan"}`}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="sk-report-card__no-photo"
                      aria-hidden="true"
                    >
                      <Camera size={22} />
                    </span>
                  )}
                  <div className="sk-report-card__body">
                    <div className="sk-report-card__tags">
                      {report.isDemo ? (
                        <span className="sk-tag">Contoh</span>
                      ) : null}
                      <span className="sk-tag">
                        Keparahan {report.severity}/4
                      </span>
                    </div>
                    <b>{severityLabel(report.severity)}</b>
                    {report.summary ? <p>{report.summary}</p> : null}
                    <p className="sk-report-card__meta">
                      {time ? (
                        <time dateTime={report.createdAt}>{time} WIB</time>
                      ) : null}
                      <span className="sk-mono">
                        {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
