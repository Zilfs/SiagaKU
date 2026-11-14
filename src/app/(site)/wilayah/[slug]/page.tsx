import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEMO_DISTRICTS,
  riskAction,
  riskLabel,
} from "@/lib/demo/districts";
import { AiExplanation } from "@/components/risk/AiExplanation";
import { ClimateCard } from "@/components/risk/ClimateCard";
import { FloodHistory } from "@/components/risk/FloodHistory";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { SafePoints } from "@/components/risk/SafePoints";
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { WeatherStrip } from "@/components/risk/WeatherStrip";
import {
  explanationFor,
  historyFor,
  safePointsFor,
  weatherFor,
} from "@/lib/demo/district-detail";

export function generateStaticParams() {
  return DEMO_DISTRICTS.map((district) => ({ slug: district.slug }));
}

// the page reads `params` for its title and cards, so the navigation waits for it (no instant shell)
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/wilayah/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const district = DEMO_DISTRICTS.find((item) => item.slug === slug);
  if (!district) return { title: "Kecamatan tidak ditemukan · SiagaKU" };
  return {
    title: `${district.name}, ${district.city} · Risiko banjir · SiagaKU`,
    description: `Skor risiko banjir ${district.name} hari ini: ${district.score} dari 100, level ${riskLabel(district.level)}. Lihat komponen skor, prakiraan hujan, riwayat genangan, dan titik aman.`,
  };
}

export default async function DistrictPage({
  params,
}: PageProps<"/wilayah/[slug]">) {
  const { slug } = await params;
  const district = DEMO_DISTRICTS.find((item) => item.slug === slug);
  if (!district) notFound();

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
              Skor risiko banjir hari ini {district.score} dari 100, level{" "}
              {riskLabel(district.level)}. Angka ini menggabungkan kerawanan
              dasar wilayah dan prakiraan hujan tiga hari.
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
            <RiskGauge
              score={district.score}
              level={district.level}
              label={riskLabel(district.level)}
            />
            <RiskBadge level={district.level} />
            <p>{riskAction(district.level)}</p>
            <span className="sk-mono">
              Diperbarui {district.updatedAt} · data contoh
            </span>
          </div>
        </header>

        <div className="sk-detail-grid">
          <AiExplanation
            districtName={district.name}
            text={explanationFor(district)}
          />
          <ScoreBreakdown district={district} />
          <WeatherStrip slots={weatherFor(district)} />
          <FloodHistory events={historyFor(district)} />
          <SafePoints points={safePointsFor(district)} />
          <ClimateCard />
        </div>

        <p className="sk-detail-note">
          Data contoh, bukan peringatan resmi. Skor risiko adalah perkiraan
          berbasis data terbuka, bukan jaminan kondisi lapangan. Untuk darurat,
          hubungi 112.
        </p>
      </div>
    </article>
  );
}
