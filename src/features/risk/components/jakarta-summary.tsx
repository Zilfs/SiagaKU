import Link from "next/link";
import { ClipboardList, MapPinned, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DistrictSummary } from "../types";

export function JakartaSummary({
  districts,
}: {
  districts: DistrictSummary[];
}) {
  const top = districts.reduce<DistrictSummary | null>(
    (best, d) => (best && best.score >= d.score ? best : d),
    null,
  );
  const severe = districts.filter((d) => d.level === "very_high").length;
  const highCount = districts.filter(
    (d) => d.level === "high" || d.level === "very_high",
  ).length;
  return (
    <section className="sk-card sk-dash__card" aria-labelledby="dash-sum-h">
      <div className="sk-card__head">
        <h2 id="dash-sum-h" className="sk-heading-icon">
          <MapPinned size={18} aria-hidden="true" />
          Ringkasan Jakarta hari ini
        </h2>
      </div>
      {!top ? (
        <p className="sk-list__empty">Data risiko belum tersedia.</p>
      ) : (
        <>
          {severe > 0 && (
            <p className="sk-dash__warnbox">
              <TriangleAlert size={16} aria-hidden="true" />
              Ada {severe} kecamatan berisiko Sangat Tinggi. Pantau kondisi dan
              siapkan rencana.
            </p>
          )}
          <dl className="sk-dash__facts">
            <div>
              <dt>Risiko tertinggi</dt>
              <dd>
                {top.name} <span className="sk-mono">{top.score}</span>
              </dd>
            </div>
            <div>
              <dt>Risiko Tinggi / Sangat Tinggi</dt>
              <dd>
                <span className="sk-mono">{highCount}</span> kecamatan
              </dd>
            </div>
          </dl>
        </>
      )}
      <Link href="/rencana" className="btn btn--sm">
        <ClipboardList size={16} aria-hidden="true" />
        Buat rencana siaga
      </Link>
    </section>
  );
}

export function JakartaSummarySkeleton() {
  return (
    <div className="sk-card sk-dash__card">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-11 w-40" />
    </div>
  );
}
