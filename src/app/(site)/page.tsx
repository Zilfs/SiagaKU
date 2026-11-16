import {
  Backpack,
  BookOpen,
  Camera,
  CircleQuestionMark,
  ClipboardList,
  CloudRain,
  CloudSun,
  Gauge,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  type LucideIcon,
} from "lucide-react";
import { HeroDevices } from "@/components/site/hero-devices";
import { HeroDistrictSearch } from "@/features/risk/components/district-search";
import { RiskBadge } from "@/components/risk-badge";
import {
  getFloodFrequency,
  listDistrictsWithScore,
} from "@/features/risk/server/risk-service";
import { FloodFrequencyMap } from "@/features/risk/components/flood-frequency-map";
import { floodShade } from "@/features/risk/flood-frequency";
import type { DistrictSummary } from "@/features/risk/types";
import type { RiskLevel } from "@/lib/risk/level";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";
import {
  FeatureDemo,
  FeatureDemoGroup,
  FeatureDemoToggle,
} from "@/components/site/feature-demo";
import { CountUp, Magnetic, Reveal } from "@/components/site/landing-motion";
import Link from "next/link";
import { PlanPreview } from "@/components/site/plan-preview";

const LEGEND: { level: RiskLevel; range: string }[] = [
  { level: "low", range: "0–24" },
  { level: "moderate", range: "25–49" },
  { level: "high", range: "50–74" },
  { level: "very_high", range: "75–100" },
];

const STEPS: { title: string; body: string; icon: LucideIcon }[] = [
  {
    icon: Search,
    title: "Pilih kecamatanmu",
    body: "Ketik nama kecamatan di kolom pencarian. Tidak perlu akun, dan tidak ada data pribadi yang diminta.",
  },
  {
    icon: Gauge,
    title: "Baca skor dan sumbernya",
    body: "Setiap angka menyebut waktu pembaruan, prakiraan hujan tiga hari, dan komponen yang menyusunnya.",
  },
  {
    icon: ClipboardList,
    title: "Susun rencana siaga",
    body: "Pilih anggota keluarga, lalu simpan daftar periksa yang sudah disesuaikan dengan kebutuhan mereka.",
  },
];

const SOURCES: { name: string; note: string; tag: string; icon: LucideIcon }[] =
  [
    {
      icon: CloudSun,
      name: "BMKG",
      note: "Prakiraan hujan dan peringatan dini cuaca.",
      tag: "tiap jam",
    },
    {
      icon: CloudRain,
      name: "Open-Meteo",
      note: "Curah hujan harian tiga hari ke depan per titik kecamatan.",
      tag: "tiap jam",
    },
    {
      icon: Landmark,
      name: "BPBD DKI Jakarta",
      note: "Daftar kelurahan rawan dan riwayat kejadian banjir.",
      tag: "saat seeding",
    },
    {
      icon: BookOpen,
      name: "BNPB",
      note: "Buku saku kesiapsiagaan untuk tindakan utama yang ditampilkan.",
      tag: "pedoman",
    },
  ];

const FAQ = [
  {
    q: "Apakah SiagaKU peringatan resmi?",
    a: "Bukan. SiagaKU membantu persiapan. Untuk peringatan resmi, ikuti BMKG, BPBD DKI Jakarta, dan pemerintah daerah.",
  },
  {
    q: "Dari mana angka risiko di halaman ini?",
    a: "Skor dihitung dari 0,55 kerawanan dasar ditambah 0,45 faktor hujan. Datanya dari BMKG, Open-Meteo, BPBD DKI, dan BNPB, dan setiap angka menyebut waktu pembaruan.",
  },
  {
    q: "Apakah saya perlu akun?",
    a: "Tidak. Tidak ada login, dan formulir tidak meminta nama, alamat, atau nomor telepon.",
  },
  {
    q: "Bagaimana kalau air sudah masuk rumah?",
    a: "Hubungi 112 sekarang. Jangan menunggu pembaruan di halaman ini, dan ikuti arahan petugas di lokasi.",
  },
];

/** Live data, rendered per visit; `cache` lets the hero and #cek share one load per request. */
const loadDistricts = cache(async (): Promise<DistrictSummary[]> => {
  await connection();
  try {
    // the service caches its own upstream calls
    return await listDistrictsWithScore();
  } catch (error) {
    console.error("GET districts for the landing failed", error);
    return [];
  }
});

/** The hero's search: the only part of the hero that waits for live data. */
async function HeroSearchPanel() {
  return <HeroDistrictSearch districts={await loadDistricts()} />;
}

/** Same box as `.sk-hero-search`, so the search swaps in without moving the hero. */
function HeroSearchSkeleton() {
  return (
    <div className="sk-hero-search" aria-busy="true">
      <LoadingStatus />
      <Skeleton className="sk-hero-search__field" />
    </div>
  );
}

/** #cek ranks this many districts; the full list is on /peta. */
const RANKED = 10;

/** #cek: the districts with the highest score today, each linking to its page. */
async function DistrictRanking() {
  const ranked = [...(await loadDistricts())]
    .sort((a, b) => b.score - a.score)
    .slice(0, RANKED);
  if (ranked.length === 0) {
    return (
      <p className="sk-list__empty">
        Data risiko belum tersedia. Coba muat ulang halaman ini beberapa saat
        lagi.
      </p>
    );
  }
  return (
    <ol className="sk-district-list sk-rank">
      {ranked.map((district, index) => (
        <li key={district.slug}>
          <Link href={`/wilayah/${district.slug}`}>
            <span className="sk-mono sk-rank__n">{index + 1}</span>
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
    </ol>
  );
}

/** Same rows as `.sk-rank`, so the ranking swaps in without moving the sections below. */
function DistrictRankingSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingStatus />
      <ol className="sk-district-list sk-rank" aria-hidden="true">
        {Array.from({ length: RANKED }, (_, index) => (
          <li key={index} className="sk-rank__ghost">
            <Skeleton className="h-11 w-full" />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** #cek, under the ranking: mainland districts shaded by the last 12 months of recorded flood events. */
async function FloodFrequency() {
  const districts = await loadDistricts();
  let frequency;
  try {
    frequency = await getFloodFrequency();
  } catch (error) {
    console.error("GET flood frequency for the landing failed", error);
    return null;
  }
  const { counts } = frequency;
  const max = Math.max(0, ...Object.values(counts));
  if (districts.length === 0 || max === 0) return null;
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return (
    <div className="sk-flood">
      <div className="sk-flood__text">
        <h3>Kecamatan yang paling sering tergenang.</h3>
        <p>
          Makin pekat merahnya, makin sering genangan tercatat di kecamatan itu.
          Arahkan kursor ke sebuah kecamatan untuk melihat jumlahnya, lalu pilih
          untuk membuka rinciannya.
        </p>
        <p className="sk-flood__note">
          {total} kejadian genangan tercatat BPBD DKI Jakarta dalam 12 bulan
          terakhir. Kepulauan Seribu tidak digambar. Batas wilayah ©{" "}
          <a
            className="link"
            href="https://www.openstreetmap.org/copyright"
            rel="noreferrer"
            target="_blank"
          >
            kontributor OpenStreetMap
          </a>
          .
        </p>
      </div>
      <FloodFrequencyMap
        districts={districts.map((d) => ({
          slug: d.slug,
          name: d.name,
          city: d.city,
          count: counts[d.id] ?? 0,
          shade: floodShade(counts[d.id] ?? 0, max),
        }))}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="hero sk-hero" aria-labelledby="hero-h">
        <div className="wrap sk-hero__grid">
          <div className="sk-hero__copy">
            <p className="sk-eyebrow">Mitigasi banjir · DKI Jakarta</p>
            <h1 id="hero-h">
              Risiko banjir Jakarta, <em>tiap kecamatan.</em>
            </h1>
            <p className="hero__lead">
              Cek skor risiko wilayahmu hari ini, lalu susun rencana siaga
              keluarga. Tanpa akun, tanpa data pribadi.
            </p>
            {/* tabIndex matches what hash-scroll sets on a /#id load, so hydration agrees */}
            <div className="sk-hero-search__anchor" id="cari" tabIndex={-1}>
              <Suspense fallback={<HeroSearchSkeleton />}>
                <HeroSearchPanel />
              </Suspense>
            </div>
            <ul className="sk-hero__stats" aria-label="Cakupan dan sumber data">
              <li>
                <b>
                  <CountUp value={44} />
                </b>{" "}
                kecamatan
              </li>
              <li>
                <b>
                  <CountUp value={3} />
                </b>{" "}
                hari
              </li>
              <li>
                <b>BMKG</b>
              </li>
            </ul>
            <Link className="link" href="/peta">
              Lihat peta risiko Jakarta
            </Link>
          </div>
          <HeroDevices />
        </div>
      </section>

      <section
        className="section ground-surface"
        id="cek"
        tabIndex={-1}
        aria-labelledby="cek-h"
      >
        <div className="wrap">
          <Reveal className="section-head section-head--split">
            <div>
              <h2 id="cek-h">Kecamatan paling rawan banjir hari ini.</h2>
              <p>
                Skor 0–100 dari kerawanan dasar dan prakiraan hujan tiga hari.
                Pilih kecamatan untuk melihat rinciannya.
              </p>
            </div>
            <Link className="btn btn--secondary" href="/peta">
              <MapPin size={16} aria-hidden="true" />
              Lihat semua di peta
            </Link>
          </Reveal>
          <Suspense fallback={<DistrictRankingSkeleton />}>
            <DistrictRanking />
          </Suspense>
          <Suspense fallback={<Skeleton className="sk-flood__ghost" />}>
            <FloodFrequency />
          </Suspense>
        </div>
      </section>

      <section
        className="section ground-base"
        id="fitur"
        tabIndex={-1}
        aria-labelledby="fitur-h"
      >
        <FeatureDemoGroup>
          <div className="wrap">
            <div className="group">
              <Reveal className="section-head">
                <h2 id="fitur-h">
                  Empat fitur di atas satu data risiko banjir.
                </h2>
                <p>
                  Semua fitur memakai data yang sama, jadi tidak saling
                  bertentangan.
                </p>
                <FeatureDemoToggle />
              </Reveal>
              <div className="grid">
                <article className="card span-6">
                  <h3 className="sk-heading-icon">
                    <span className="sk-card-index">01</span>
                    <Gauge size={18} aria-hidden="true" />
                    Risiko tiap kecamatan
                  </h3>
                  <p>Satu skor per kecamatan Jakarta.</p>
                  <FeatureDemo
                    kind="risk"
                    label="Contoh tampilan: jumlah kecamatan per status Awas, Siaga, Waspada, dan Normal; memilih Siaga menampilkan Jatinegara dengan skor 68."
                  >
                    <div className="sk-feature" data-ui aria-hidden="true">
                      <div className="sk-feature__head">
                        <span className="sk-feature__title">
                          <MapPin size={14} aria-hidden="true" />
                          Jakarta hari ini
                        </span>
                        <span className="sk-feature__meta">14.00</span>
                      </div>
                      <div className="sk-feature__row">
                        <b>Awas</b>
                        <span>3 kecamatan</span>
                      </div>
                      <div
                        className="sk-feature__row sk-demo__host"
                        data-demo-target
                      >
                        <i className="sk-demo__hl" aria-hidden="true" />
                        <b>Siaga</b>
                        <em className="sk-demo__chip">
                          <i aria-hidden="true" />
                          Jatinegara · 68
                        </em>
                        <span>9 kecamatan</span>
                      </div>
                      <div className="sk-feature__row">
                        <b>Waspada</b>
                        <span>18 kecamatan</span>
                      </div>
                      <div className="sk-feature__row">
                        <b>Normal</b>
                        <span>14 kecamatan</span>
                      </div>
                    </div>
                  </FeatureDemo>
                </article>

                <article className="card span-6">
                  <h3 className="sk-heading-icon">
                    <span className="sk-card-index">02</span>
                    <ClipboardList size={18} aria-hidden="true" />
                    Rencana siaga banjir
                  </h3>
                  <p>Daftar periksa per anggota keluarga.</p>
                  <FeatureDemo
                    kind="plan"
                    label="Contoh tampilan: daftar tas siaga; mencentang obat rutin untuk lansia menaikkan progres dari 8 menjadi 9 dari 22 barang."
                  >
                    <div className="sk-feature" data-ui aria-hidden="true">
                      <div className="sk-feature__head">
                        <span className="sk-feature__title">
                          <Backpack size={14} aria-hidden="true" />
                          Tas siaga
                        </span>
                        <span className="sk-feature__meta sk-demo__count">
                          <span className="sk-demo__from" aria-hidden="true">
                            8/22
                          </span>
                          <span className="sk-demo__to">9/22</span>
                        </span>
                      </div>
                      <ul>
                        <li className="is-done">
                          <span className="sk-check" aria-hidden="true" />
                          Air minum 3 L per orang
                        </li>
                        <li className="is-done">
                          <span className="sk-check" aria-hidden="true" />
                          Dokumen di kantong tahan air
                        </li>
                        <li>
                          <span
                            className="sk-check sk-demo__check"
                            aria-hidden="true"
                            data-demo-target
                          >
                            <i className="sk-demo__tick" />
                          </span>
                          Obat rutin 7 hari untuk lansia
                        </li>
                        <li>
                          <span className="sk-check" aria-hidden="true" />
                          Susu formula dan botol bayi
                        </li>
                      </ul>
                    </div>
                  </FeatureDemo>
                </article>
              </div>
            </div>

            <div className="group">
              <div className="grid">
                <article className="card span-6">
                  <h3 className="sk-heading-icon">
                    <span className="sk-card-index">03</span>
                    <MessageCircle size={18} aria-hidden="true" />
                    Tanya soal banjir
                  </h3>
                  <p>
                    Jawaban bahasa sehari-hari dari pedoman BNPB, BPBD, dan
                    Kementerian Kesehatan, dengan sumber di tiap jawaban.
                  </p>
                  <FeatureDemo
                    kind="chat"
                    label="Contoh tampilan: pertanyaan kapan harus mengungsi kalau ada lansia dijawab dengan saran bersiap saat air mulai naik di gang, bersumber dari Buku Saku BNPB halaman 23."
                  >
                    <div className="sk-feature" data-ui aria-hidden="true">
                      <div className="sk-feature__head">
                        <span className="sk-feature__title">
                          <MessageCircle size={14} aria-hidden="true" />
                          Tanya SiagaKU
                        </span>
                        <span className="sk-tag sk-tag--ai">AI · contoh</span>
                      </div>
                      <p className="sk-feature__q sk-demo__host">
                        <span className="sk-feature__bubble">
                          Kapan harus mengungsi kalau ada lansia?
                        </span>
                        <span
                          className="sk-demo__suggest"
                          aria-hidden="true"
                          data-demo-target
                        >
                          Kapan harus mengungsi kalau ada lansia?
                        </span>
                      </p>
                      <div className="sk-feature__answer">
                        <span className="sk-demo__type">
                          Untuk keluarga dengan lansia, bersiap lebih awal: saat
                          air mulai naik di gang, bukan saat masuk rumah.
                        </span>
                        <span className="sk-feature__src">
                          <b className="sk-demo__ref">[1]</b>
                          BNPB · Buku Saku, hlm. 23
                        </span>
                      </div>
                    </div>
                  </FeatureDemo>
                </article>

                <article className="card span-6">
                  <h3 className="sk-heading-icon">
                    <span className="sk-card-index">04</span>
                    <Camera size={18} aria-hidden="true" />
                    Lapor banjir
                  </h3>
                  <p>
                    Kirim foto dan tinggi air. Laporan warga melengkapi data
                    resmi, bukan menggantikannya.
                  </p>
                  <FeatureDemo
                    kind="report"
                    label="Contoh tampilan: warga mengunggah foto genangan, lalu laporan terkirim; ada 3 laporan di Jatinegara hari ini."
                  >
                    <div className="sk-feature" data-ui aria-hidden="true">
                      <div className="sk-feature__head">
                        <span className="sk-feature__title">
                          <Camera size={14} aria-hidden="true" />
                          Laporan warga
                        </span>
                        <span className="sk-feature__meta">12 menit lalu</span>
                      </div>
                      <div
                        className="sk-feature__upload sk-demo__host"
                        data-demo-target
                      >
                        <i className="sk-demo__hl" aria-hidden="true" />
                        <Camera size={20} aria-hidden="true" />
                        Foto genangan, tinggi air, dan patokan jalan
                      </div>
                      <div className="sk-feature__status">
                        <CloudRain size={14} aria-hidden="true" />
                        Terkirim · 3 laporan di Jatinegara hari ini
                      </div>
                    </div>
                  </FeatureDemo>
                </article>
              </div>
            </div>
          </div>
        </FeatureDemoGroup>
      </section>

      <section
        className="section ground-inverse"
        id="cara"
        tabIndex={-1}
        aria-labelledby="cara-h"
      >
        <div className="wrap">
          <div className="sk-split">
            <div className="sk-split__copy">
              <Reveal className="section-head">
                <h2 id="cara-h">
                  Dari risiko ke rencana siaga, dalam tiga langkah.
                </h2>
                <p>
                  Kamu tidak perlu membaca semua data. Tiga langkah ini cukup
                  untuk tahu apa yang harus disiapkan malam ini.
                </p>
              </Reveal>
              <ol className="sk-steps">
                {STEPS.map((step) => (
                  <li key={step.title}>
                    <div>
                      <b className="sk-heading-icon">
                        <step.icon size={18} aria-hidden="true" />
                        {step.title}
                      </b>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sk-plan sk-depth ground-base" data-ui>
              <div className="sk-plan__head">
                <b>Rencana siaga · Jatinegara</b>
                <span>8 dari 22 selesai</span>
              </div>
              <PlanPreview />
              <div className="sk-plan__foot">
                <span>Data contoh · diperbarui 14.00 WIB</span>
                <Link className="link" href="/rencana">
                  Buat rencana
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section ground-surface"
        id="data"
        tabIndex={-1}
        aria-labelledby="data-h"
      >
        <div className="wrap">
          <div className="sk-split">
            <div className="sk-split__copy">
              <Reveal className="section-head">
                <h2 id="data-h">Sumber data risiko banjir Jakarta.</h2>
                <p>
                  SiagaKU tidak menebak. Setiap skor memakai prakiraan hujan
                  resmi dan riwayat kejadian, dan setiap baris menyebut kapan
                  terakhir diperbarui.
                </p>
              </Reveal>
              <ul className="sk-source-list">
                {SOURCES.map((source) => (
                  <li key={source.name}>
                    <b className="sk-heading-icon">
                      <source.icon size={18} aria-hidden="true" />
                      {source.name}
                    </b>
                    <p>{source.note}</p>
                    <span>{source.tag}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sk-formula sk-depth" data-ui>
              <div className="sk-formula__head">
                <b>Cara skor dihitung</b>
                <span>0–100</span>
              </div>
              <ul className="sk-bars">
                <li className="sk-bar">
                  <span>Kerawanan dasar</span>
                  <span className="sk-mono">bobot 0,55</span>
                  <span className="sk-bar__track" aria-hidden="true">
                    <i className="sk-bar__fill--base" />
                  </span>
                </li>
                <li className="sk-bar">
                  <span>Faktor hujan</span>
                  <span className="sk-mono">bobot 0,45</span>
                  <span className="sk-bar__track" aria-hidden="true">
                    <i className="sk-bar__fill--rain" />
                  </span>
                </li>
              </ul>
              <p className="t-small muted">
                Kerawanan dasar menghitung frekuensi banjir lima tahun terakhir,
                daftar kelurahan rawan BPBD, dan risiko rob di wilayah pesisir.
                Faktor hujan memakai curah hujan terbesar dalam tiga hari ke
                depan.
              </p>
              <ul className="sk-legend">
                {LEGEND.map((item) => (
                  <li key={item.level}>
                    <span
                      className="sk-dot"
                      data-level={item.level}
                      aria-hidden="true"
                    />
                    <RiskBadge level={item.level} size="sm" />
                    <span className="sk-mono">{item.range}</span>
                  </li>
                ))}
              </ul>
              <p className="sk-mono t-small muted">
                skor = round(0,55 × kerawanan + 0,45 × hujan)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section ground-base"
        id="tanya"
        tabIndex={-1}
        aria-labelledby="tanya-h"
      >
        <div className="wrap">
          <div className="sk-ask">
            <div>
              <Reveal className="section-head">
                <h2 id="tanya-h">Pertanyaan warga soal risiko banjir.</h2>
                <p>
                  Empat hal yang paling sering ditanyakan warga sebelum memakai
                  SiagaKU.
                </p>
              </Reveal>
              <div className="faq">
                {FAQ.map((item) => (
                  <details key={item.q} open>
                    <summary className="sk-heading-icon">
                      <CircleQuestionMark size={18} aria-hidden="true" />
                      {item.q}
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="sk-call">
              <span className="sk-call__glyph" aria-hidden="true">
                <Phone size={26} />
              </span>
              <span className="sk-tag">
                <Phone size={13} aria-hidden="true" />
                Darurat
              </span>
              <b className="sk-call__num">112</b>
              <p>
                Gratis 24 jam dari telepon dan ponsel. Untuk air yang sudah
                masuk rumah atau ada orang terjebak.
              </p>
              <Magnetic>
                <a className="btn btn--primary" href="tel:112">
                  Telepon 112
                </a>
              </Magnetic>
              <span className="sk-mono">Jakarta Siaga · 24 jam</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
