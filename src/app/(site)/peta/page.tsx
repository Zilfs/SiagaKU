import type { Metadata } from "next";
import Link from "next/link";
import { RiskMap } from "@/components/map/risk-map";
import { UseLocation } from "@/components/map/use-location";
import { RiskBadge } from "@/components/risk-badge";
import { DEMO_DISTRICTS, type RiskLevel } from "@/lib/demo/districts";
import { RISK_LEVEL_LABELS } from "@/lib/risk/level";

export const metadata: Metadata = {
  title: "Peta risiko banjir Jakarta · SiagaKU",
  description:
    "Peta risiko banjir per kecamatan di DKI Jakarta: warna menunjukkan level risiko, klik kecamatan untuk melihat skor, prakiraan hujan, dan titik aman.",
};

const DOT: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  very_high: "var(--risk-very-high)",
};

const LEGEND: { level: RiskLevel; range: string }[] = [
  { level: "low", range: "0–24" },
  { level: "moderate", range: "25–49" },
  { level: "high", range: "50–74" },
  { level: "very_high", range: "75–100" },
];

export default function MapPage() {
  return (
    <article className="sk-page sk-peta">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Peta risiko · DKI Jakarta</p>
          <h1>Peta risiko banjir Jakarta</h1>
          <p>
            Satu lingkaran untuk tiap kecamatan, diwarnai sesuai level risikonya.
            Klik untuk membuka skor, prakiraan hujan, riwayat genangan, dan titik
            aman.
          </p>
          <ul className="sk-legend" aria-label="Arti level risiko">
            {LEGEND.map((item) => (
              <li key={item.level}>
                <span
                  className="sk-dot"
                  style={{ background: DOT[item.level] }}
                  aria-hidden="true"
                />
                {RISK_LEVEL_LABELS[item.level]} <span className="sk-mono">{item.range}</span>
              </li>
            ))}
          </ul>
          <UseLocation />
        </header>

        <div className="sk-map-shell">
          <RiskMap items={DEMO_DISTRICTS} />
        </div>

        <section className="sk-peta__list" aria-labelledby="daftar-h">
          <div className="sk-card__head">
            <h2 id="daftar-h">Semua kecamatan</h2>
            <span className="sk-mono">{DEMO_DISTRICTS.length} · data contoh</span>
          </div>
          <ul className="sk-district-list">
            {DEMO_DISTRICTS.map((district) => (
              <li key={district.slug}>
                <Link href={`/wilayah/${district.slug}`}>
                  <span
                    className="sk-dot"
                    style={{ background: DOT[district.level] }}
                    aria-hidden="true"
                  />
                  <span className="sk-district-list__name">
                    <b>{district.name}</b>
                    <span>{district.city}</span>
                  </span>
                  <RiskBadge level={district.level} size="sm" />
                  <span className="sk-mono sk-district-list__score">
                    {district.score}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="sk-detail-note">
          Data contoh, bukan peringatan resmi. Posisi lingkaran adalah pusat
          kecamatan secara perkiraan, bukan batas wilayah resmi.
        </p>
      </div>
    </article>
  );
}
