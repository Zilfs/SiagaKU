import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { RiskBadge } from "@/components/risk-badge";
import { AiExplanation } from "@/features/risk/components/ai-explanation";
import { ClimateCard } from "@/features/risk/components/climate-card";
import { FloodHistory } from "@/features/risk/components/flood-history";
import { RiskGauge } from "@/features/risk/components/risk-gauge";
import { SafePoints } from "@/features/risk/components/safe-points";
import { ScoreBreakdown } from "@/features/risk/components/score-breakdown";
import { WeatherStrip } from "@/features/risk/components/weather-strip";
import { riskAction } from "@/features/risk/risk-copy";
import { findDistrict } from "@/features/risk/server/risk-repository";
import { getRiskDetail } from "@/features/risk/server/risk-service";
import { RISK_LEVEL_LABELS } from "@/lib/risk/level";

// the page reads live risk data; `connection()` keeps it out of the static build
// the page reads `params` for its title and cards, so the navigation waits for it (no instant shell)
export const instant = false;

function timeLabel(iso: string | null) {
  if (!iso) return "baru saja";
  try {
    return `${new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))} WIB`;
  } catch {
    return "baru saja";
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/wilayah/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const district = await findDistrict(slug);
    if (!district) return { title: "Kecamatan tidak ditemukan · SiagaKU" };
    return {
      title: `${district.name}, ${district.city} · Risiko banjir · SiagaKU`,
      description: `Risiko banjir ${district.name} hari ini: skor 0–100, komponen skor, prakiraan hujan, riwayat genangan, dan titik aman.`,
    };
  } catch {
    return { title: "Risiko banjir · SiagaKU" };
  }
}

export default async function DistrictPage({
  params,
}: PageProps<"/wilayah/[slug]">) {
  const { slug } = await params;
  await connection();

  let detail;
  try {
    detail = await getRiskDetail(slug);
  } catch {
    detail = null;
  }
  if (!detail) notFound();

  let origin: { lat: number; lng: number } | null = null;
  try {
    const district = await findDistrict(slug);
    if (district) origin = { lat: district.lat, lng: district.lng };
  } catch {
    origin = null;
  }

  const { district, score, level, components, weather, floodHistory, safePoints } =
    detail;
  const label = RISK_LEVEL_LABELS[level];

  return (
    <article className="sk-page sk-detail">
      <div className="wrap">
        <nav className="sk-crumbs" aria-label="Remah roti">
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <Link href="/peta">Peta</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{district.name}</span>
        </nav>

        <header className="sk-detail-head">
          <div className="sk-detail-head__copy">
            <p className="sk-eyebrow">{district.city} · DKI Jakarta</p>
            <h1>{district.name}</h1>
            <p className="sk-detail-lede">
              Skor risiko banjir hari ini {score} dari 100, level {label}. Angka
              ini menggabungkan kerawanan dasar wilayah dan prakiraan hujan tiga
              hari.
            </p>
            <div className="sk-detail-actions">
              <Link className="btn btn--primary" href="/rencana">
                Buat rencana siaga
              </Link>
              <Link className="link" href={`/tanya?kecamatan=${district.slug}`}>
                Tanya soal {district.name}
              </Link>
            </div>
          </div>

          <div className="sk-detail-score">
            <RiskGauge score={score} level={level} label={label} />
            <RiskBadge level={level} />
            <p>{riskAction(level)}</p>
            <span className="sk-mono">
              Diperbarui {timeLabel(weather.updatedAt)}
              {weather.stale ? " · data terakhir" : ""}
            </span>
          </div>
        </header>

        <div className="sk-detail-grid">
          <AiExplanation
            districtId={district.id}
            districtName={district.name}
            fallback={`Skor ${district.name} ${score} dari 100 (${label}). ${riskAction(level)}`}
          />
          <ScoreBreakdown
            components={components}
            noRainfallData={detail.noRainfallData}
          />
          <WeatherStrip slots={weather.slots} stale={weather.stale} />
          <FloodHistory events={floodHistory} />
          <SafePoints points={safePoints} origin={origin} />
          <ClimateCard />
        </div>

        <p className="sk-detail-note">
          Skor dari data BMKG dan Open-Meteo, bukan peringatan resmi. Skor risiko
          adalah perkiraan berbasis data terbuka, bukan jaminan kondisi lapangan.
          Untuk darurat, hubungi 112.
        </p>
      </div>
    </article>
  );
}
