import type { Metadata } from "next";
import { connection } from "next/server";
import { List } from "lucide-react";
import { UseLocation } from "@/components/map/use-location";
import { DistrictList } from "@/features/risk/components/district-list";
import { FloodTrendChart } from "@/features/risk/components/flood-trend-chart";
import { JakartaSummary } from "@/features/risk/components/jakarta-summary";
import { MapDashboard } from "@/features/risk/components/map-dashboard";
import type { MonthlyFloodCount } from "@/features/risk/flood-trend";
import {
  getFloodTrend,
  listDistrictsWithScore,
} from "@/features/risk/server/risk-service";
import type { DistrictSummary } from "@/features/risk/types";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/risk/level";

export const metadata: Metadata = {
  title: "Peta risiko banjir Jakarta · SiagaKU",
  description:
    "Peta risiko banjir per kecamatan di DKI Jakarta: warna menunjukkan level risiko, klik kecamatan untuk melihat skor, prakiraan hujan, dan titik aman.",
};

const LEGEND: { level: RiskLevel; range: string }[] = [
  { level: "low", range: "0–24" },
  { level: "moderate", range: "25–49" },
  { level: "high", range: "50–74" },
  { level: "very_high", range: "75–100" },
];

export default async function MapPage() {
  await connection();
  const [districts, trend] = await Promise.all([
    listDistrictsWithScore().catch((error): DistrictSummary[] => {
      console.error("GET districts for the map failed", error);
      return [];
    }),
    getFloodTrend().catch((error): MonthlyFloodCount[] => {
      console.error("GET flood trend for the map failed", error);
      return [];
    }),
  ]);
  const top = districts.reduce<DistrictSummary | null>(
    (best, d) => (best && best.score >= d.score ? best : d),
    null,
  );
  return (
    <article className="sk-page sk-peta">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Peta risiko · DKI Jakarta</p>
          <h1>Peta risiko banjir Jakarta</h1>
          <p>
            Klik lingkaran kecamatan untuk melihat cuaca dan prakiraan hujannya.
          </p>
          <ul className="sk-legend" aria-label="Arti level risiko">
            {LEGEND.map((item) => (
              <li key={item.level}>
                <span
                  className="sk-dot"
                  data-level={item.level}
                  aria-hidden="true"
                />
                {RISK_LEVEL_LABELS[item.level]}{" "}
                <span className="sk-mono">{item.range}</span>
              </li>
            ))}
          </ul>
          <UseLocation districts={districts} />
        </header>

        <MapDashboard
          districts={districts}
          initialSlug={top?.slug ?? null}
          bottom={
            <div className="sk-dash__bottom">
              <JakartaSummary districts={districts} />
              <FloodTrendChart trend={trend} />
            </div>
          }
        />

        <section className="sk-peta__list" aria-labelledby="daftar-h">
          <div className="sk-card__head">
            <h2 id="daftar-h" className="sk-heading-icon">
              <List size={18} aria-hidden="true" />
              Semua kecamatan
            </h2>
            <span className="sk-mono">{districts.length} kecamatan</span>
          </div>
          <DistrictList districts={districts} />
        </section>

        <p className="sk-detail-note">
          Skor dari BMKG dan Open-Meteo. Posisi lingkaran adalah pusat kecamatan
          secara perkiraan, bukan batas wilayah resmi.
        </p>
      </div>
    </article>
  );
}

// opts out of instant-navigation validation only; loading.tsx still streams a skeleton shell first
export const instant = false;
