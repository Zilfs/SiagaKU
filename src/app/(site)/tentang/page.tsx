import type { Metadata } from "next";
import {
  BookOpen,
  Database,
  Phone,
  ShieldCheck,
  Sparkles,
  TriangleExclamationPoint,
  Users,
} from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { RAINFALL_CATEGORY_LABELS, classifyRainfall } from "@/lib/risk/score";

export const metadata: Metadata = {
  title: "Tentang & metodologi · SiagaKU",
  description:
    "Cara SiagaKU menghitung skor risiko banjir, sumber data, cara kerja AI, privasi, kredit, dan tim di baliknya.",
};

const REPO = "https://github.com/Zilfs/SiagaKU";

// Sample values feed classifyRainfall, so the table can never drift from the scoring code.
const RAIN_ROWS = [
  { range: "< 5 mm", sample: 0 },
  { range: "5 – < 20 mm", sample: 5 },
  { range: "20 – < 50 mm", sample: 20 },
  { range: "50 – < 100 mm", sample: 50 },
  { range: "100 – 150 mm", sample: 100 },
  { range: "> 150 mm", sample: 151 },
].map((row) => ({ ...row, ...classifyRainfall(row.sample) }));

const LEVEL_ROWS = [
  { level: "low", range: "0 – 24" },
  { level: "moderate", range: "25 – 49" },
  { level: "high", range: "50 – 74" },
  { level: "very_high", range: "75 – 100" },
] as const;

const SOURCES = [
  {
    name: "BMKG – Prakiraan Cuaca",
    href: "https://data.bmkg.go.id/prakiraan-cuaca",
    use: "cuaca 3 hari per kecamatan",
  },
  {
    name: "Open-Meteo Forecast",
    href: "https://open-meteo.com",
    use: "curah hujan harian 3 hari untuk skor",
  },
  {
    name: "BPBD DKI Jakarta",
    href: "https://bpbd.jakarta.go.id",
    use: "riwayat genangan dan banjir 2025–2026",
  },
  {
    name: "Satu Data Jakarta",
    href: "https://satudata.jakarta.go.id",
    use: "kelurahan rawan banjir dan lokasi pengungsian",
  },
  {
    name: "OpenStreetMap",
    href: "https://www.openstreetmap.org/copyright",
    use: "ubin peta (© kontributor OpenStreetMap)",
  },
];

const AI_TOOLS = [
  "Claude Code (Anthropic): scaffolding dan implementasi",
  "opencode: router AI, RAG, dan redesain antarmuka",
];

const INDEX = [
  { href: "#skor", label: "Cara skor" },
  { href: "#level", label: "Level risiko" },
  { href: "#sumber", label: "Sumber data" },
  { href: "#ai", label: "Cara kerja AI" },
  { href: "#privasi", label: "Privasi" },
  { href: "#kredit", label: "Kredit" },
];

export default function AboutPage() {
  return (
    <article className="sk-page sk-about">
      <div className="wrap">
        <header className="sk-page-head">
          <p className="sk-eyebrow">Tentang · Metodologi</p>
          <h1>Bagaimana SiagaKU bekerja</h1>
          <p>
            SiagaKU membantu warga DKI Jakarta bersiap menghadapi banjir: cek
            risiko kecamatan hari ini, tanya seputar kesiapsiagaan, dan susun
            rencana siaga keluarga. Tanpa akun, tanpa data pribadi. Halaman ini
            menjelaskan dari mana angkanya dan di mana batasnya.
          </p>
        </header>

        <nav className="sk-about__index" aria-label="Bagian halaman">
          {INDEX.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sk-about__grid">
          <section
            id="skor"
            className="sk-card sk-about__section sk-about__wide"
            aria-labelledby="skor-h"
          >
            <div className="sk-card__head">
              <h2 id="skor-h">Cara skor risiko dihitung</h2>
              <span className="sk-mono">0–100</span>
            </div>
            <p className="sk-about__formula">
              0,55 × kerawanan dasar + 0,45 × faktor hujan
            </p>
            <div className="sk-about__split">
              <div className="sk-about__block">
                <h3>Kerawanan dasar</h3>
                <ul className="sk-about__bullets">
                  <li>
                    10 poin per kejadian banjir dalam 5 tahun terakhir (maks.
                    50).
                  </li>
                  <li>
                    Hingga 30 poin sesuai porsi kelurahan rawan (min. 10 bila
                    ada).
                  </li>
                  <li>20 poin bila kecamatan pesisir rawan rob.</li>
                </ul>
              </div>
              <div className="sk-about__block">
                <h3>Faktor hujan</h3>
                <p>
                  Memakai curah hujan harian tertinggi dalam 3 hari ke depan.
                  Bila data hujan tidak tersedia, faktor dianggap 0 dan halaman
                  menandainya.
                </p>
              </div>
            </div>

            <table className="sk-about__table">
              <caption className="sr-only">
                Kategori curah hujan dan faktor skornya
              </caption>
              <thead>
                <tr>
                  <th scope="col">Curah hujan 3 hari</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Faktor</th>
                </tr>
              </thead>
              <tbody>
                {RAIN_ROWS.map((row) => (
                  <tr key={row.range}>
                    <td>{row.range}</td>
                    <td>{RAINFALL_CATEGORY_LABELS[row.category]}</td>
                    <td className="sk-mono">{row.factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="sk-field__hint">
              Skor ini estimasi untuk kesiapsiagaan, bukan prediksi atau
              peringatan resmi.
            </p>
          </section>

          <section
            id="level"
            className="sk-card sk-about__section sk-about__narrow"
            aria-labelledby="level-h"
          >
            <div className="sk-card__head">
              <h2 id="level-h">Level risiko</h2>
              <TriangleExclamationPoint size={18} aria-hidden="true" />
            </div>
            <ul className="sk-about__levels">
              {LEVEL_ROWS.map((row) => (
                <li key={row.level}>
                  <RiskBadge level={row.level} />
                  <span className="sk-mono">{row.range}</span>
                </li>
              ))}
            </ul>
            <p className="sk-field__hint">
              Level selalu tampil sebagai warna, label, dan ikon — tidak pernah
              warna saja.
            </p>
          </section>

          <section
            id="sumber"
            className="sk-card sk-about__section sk-about__broad"
            aria-labelledby="sumber-h"
          >
            <div className="sk-card__head">
              <h2 id="sumber-h">Sumber data</h2>
              <Database size={18} aria-hidden="true" />
            </div>
            <ul className="sk-about__list">
              {SOURCES.map((source) => (
                <li key={source.href}>
                  <a href={source.href} rel="noreferrer" target="_blank">
                    {source.name}
                  </a>
                  <span>{source.use}</span>
                </li>
              ))}
            </ul>
            <p className="sk-field__hint">
              Tautan verifikasi per baris data ada di{" "}
              <a className="link" href={`${REPO}/blob/main/data/README.md`}>
                data/README.md
              </a>
              .
            </p>
          </section>

          <section
            id="ai"
            className="sk-card sk-about__section"
            aria-labelledby="ai-h"
          >
            <div className="sk-card__head">
              <h2 id="ai-h">Cara kerja AI</h2>
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <p>
              Penjelasan risiko, jawaban chatbot, dan rencana siaga dibuat model
              AI. Bila penyedia gagal, SiagaKU memakai teks templat, jadi fitur
              tetap jalan.
            </p>
            <ul className="sk-about__chain" aria-label="Urutan penyedia AI">
              <li>Gemini</li>
              <li>Groq</li>
              <li>Alternatif</li>
            </ul>
            <p>
              Chatbot menjawab dari pedoman resmi (BPBD DKI, BNPB,
              Kemendikbudristek) dan menampilkan sumbernya. Titik aman dan
              kontak darurat hanya diambil dari basis data, bukan dikarang AI.
              Nomor darurat yang disebut AI hanya 112.
            </p>
          </section>

          <section
            id="privasi"
            className="sk-card sk-about__section"
            aria-labelledby="privasi-h"
          >
            <div className="sk-card__head">
              <h2 id="privasi-h">Privasi</h2>
              <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <ul className="sk-about__bullets">
              <li>
                Tidak ada akun dan tidak ada kolom nama, alamat, atau telepon.
              </li>
              <li>
                Alamat IP hanya disimpan sebagai hash untuk pembatasan
                permintaan.
              </li>
              <li>
                Pertanyaan dan isian rencana dikirim ke penyedia AI untuk
                diproses.
              </li>
              <li>
                Foto laporan dikompres di perangkat (maksimal 1600 px dan 1 MB)
                dan EXIF (termasuk GPS) dihapus sebelum diunggah.
              </li>
              <li>
                Laporan menyimpan foto, titik lokasi (dari GPS-mu atau titik
                tengah kecamatan yang kamu pilih), dan keterangan opsional,
                tanpa nama pelapor.
              </li>
              <li>
                Peta laporan warga hanya menampilkan laporan 72 jam terakhir,
                tanpa identitas pelapor.
              </li>
            </ul>
          </section>

          <section
            id="kredit"
            className="sk-card sk-about__section sk-about__broad"
            aria-labelledby="kredit-h"
          >
            <div className="sk-card__head">
              <h2 id="kredit-h">Kredit & alat AI</h2>
              <BookOpen size={18} aria-hidden="true" />
            </div>
            <p>
              Dibangun dengan Next.js, React, Tailwind CSS, shadcn/ui, Vercel AI
              SDK, Supabase, zod, Leaflet, dan pustaka sumber terbuka lain. Lima
              dokumen pedoman BPBD DKI, BNPB, dan Kemendikbudristek menjadi
              basis pengetahuan chatbot.
            </p>
            <ul className="sk-about__bullets">
              {AI_TOOLS.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
            <p className="sk-field__hint">
              Daftar lengkap beserta lisensi:{" "}
              <a className="link" href={`${REPO}/blob/main/CREDITS.md`}>
                CREDITS.md
              </a>
              .
            </p>
          </section>

          <section
            id="tim"
            className="sk-card sk-about__section sk-about__narrow"
            aria-labelledby="tim-h"
          >
            <div className="sk-card__head">
              <h2 id="tim-h">Tim & darurat</h2>
              <Users size={18} aria-hidden="true" />
            </div>
            <p>
              Dibuat untuk lomba IT RUSH 2026 oleh Ukon (frontend & UX), Rhein
              (backend & data), Bagus (AI), dan Syaki (data, konten &
              dokumentasi).
            </p>
            <p>
              Ikuti arahan BMKG dan BPBD DKI Jakarta. Dalam keadaan darurat,
              hubungi 112.
            </p>
            <div className="btn-row">
              <a className="btn btn--secondary" href="tel:112">
                <Phone size={16} aria-hidden="true" />
                Telepon 112
              </a>
            </div>
          </section>
        </div>

        <p className="sk-detail-note">
          SiagaKU adalah proyek lomba, bukan layanan resmi pemerintah. Skor dan
          peringatan di sini adalah estimasi berbasis data terbuka. Untuk
          keputusan penyelamatan, ikuti BMKG, BPBD DKI Jakarta, dan petugas di
          lapangan.
        </p>
      </div>
    </article>
  );
}
