import type { Metadata } from "next";
import { RISK_LEVEL_LABELS } from "@/lib/risk/level";
import { RAINFALL_CATEGORY_LABELS, classifyRainfall } from "@/lib/risk/score";

export const metadata: Metadata = {
  title: "Tentang & Metodologi · SiagaKU",
  description:
    "Cara SiagaKU menghitung skor risiko banjir, sumber data, cara kerja AI, privasi, dan kredit.",
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
].map((r) => ({ ...r, ...classifyRainfall(r.sample) }));

const LEVEL_ROWS = [
  { level: "low", range: "0 – 24" },
  { level: "moderate", range: "25 – 49" },
  { level: "high", range: "50 – 74" },
  { level: "very_high", range: "75 – 100" },
] as const;

const SOURCES = [
  {
    name: "BMKG – Prakiraan Cuaca (data.bmkg.go.id)",
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Tentang SiagaKU</h1>
        <p>
          SiagaKU membantu warga DKI Jakarta bersiap menghadapi banjir: cek
          risiko kecamatan hari ini, tanya seputar kesiapsiagaan, dan susun
          rencana siaga keluarga. Tanpa akun, tanpa data pribadi.
        </p>
      </header>

      <Section title="Cara skor risiko dihitung">
        <p>
          Skor (0–100) ={" "}
          <strong>0,55 × kerawanan dasar + 0,45 × faktor hujan</strong>,
          dibulatkan.
        </p>
        <p>
          <strong>Kerawanan dasar</strong> (0–100) per kecamatan: 10 poin per
          kejadian banjir dalam 5 tahun terakhir (maks. 50), ditambah hingga 30
          poin sesuai porsi kelurahan rawan (min. 10 bila ada), ditambah 20 bila
          kecamatan pesisir rawan rob.
        </p>
        <p>
          <strong>Faktor hujan</strong> memakai curah hujan harian tertinggi
          dalam 3 hari ke depan:
        </p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Curah hujan</th>
              <th scope="col">Kategori</th>
              <th scope="col">Faktor</th>
            </tr>
          </thead>
          <tbody>
            {RAIN_ROWS.map((r) => (
              <tr key={r.range}>
                <td>{r.range}</td>
                <td>{RAINFALL_CATEGORY_LABELS[r.category]}</td>
                <td>{r.factor}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Bila data hujan tidak tersedia, faktor hujan dianggap 0 dan halaman
          menandainya. Level risiko:
        </p>
        <ul className="list-disc pl-6">
          {LEVEL_ROWS.map((r) => (
            <li key={r.level}>
              {r.range}: {RISK_LEVEL_LABELS[r.level]}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Sumber data">
        <ul className="list-disc pl-6">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a
                className="underline"
                href={s.href}
                rel="noreferrer"
                target="_blank"
              >
                {s.name}
              </a>
              : {s.use}
            </li>
          ))}
        </ul>
        <p>
          Tautan verifikasi per baris data ada di{" "}
          <a className="underline" href={`${REPO}/blob/main/data/README.md`}>
            data/README.md
          </a>
          .
        </p>
      </Section>

      <Section title="Cara kerja AI">
        <p>
          Penjelasan risiko, jawaban chatbot, dan rencana siaga dibuat model AI
          dengan urutan cadangan: Gemini, lalu Groq, lalu penyedia alternatif.
          Bila semua penyedia gagal, SiagaKU memakai teks templat, jadi fitur
          tetap jalan.
        </p>
        <p>
          Chatbot menjawab dari pedoman resmi (BPBD DKI, BNPB,
          Kemendikbudristek) dan menampilkan sumbernya. Titik aman dan kontak
          darurat hanya diambil dari basis data, bukan dikarang AI. Nomor
          darurat yang disebut AI hanya 112.
        </p>
      </Section>

      <Section title="Privasi">
        <p>
          Tidak ada akun dan tidak ada kolom nama, alamat, atau nomor telepon.
          Alamat IP hanya disimpan dalam bentuk hash untuk pembatasan
          permintaan. Pertanyaan dan isian rencana dikirim ke penyedia AI untuk
          diproses.
        </p>
      </Section>

      <Section title="Kredit: pustaka, aset, dan AI coding assistant">
        <p>
          Dibangun dengan Next.js, React, Tailwind CSS, shadcn/ui, Vercel AI
          SDK, Supabase, zod, Leaflet, dan pustaka sumber terbuka lain. Lima
          dokumen pedoman BPBD DKI, BNPB, dan Kemendikbudristek menjadi basis
          pengetahuan chatbot.
        </p>
        <p>AI coding assistant yang dipakai:</p>
        <ul className="list-disc pl-6">
          {AI_TOOLS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>
          Daftar lengkap beserta lisensi:{" "}
          <a className="underline" href={`${REPO}/blob/main/CREDITS.md`}>
            CREDITS.md
          </a>
          .
        </p>
      </Section>

      <Section title="Disclaimer">
        <p>
          Skor SiagaKU adalah estimasi untuk kesiapsiagaan, bukan prediksi atau
          peringatan resmi. Ikuti arahan BMKG dan BPBD DKI Jakarta. Dalam
          keadaan darurat, hubungi{" "}
          <a className="underline" href="tel:112">
            112
          </a>
          .
        </p>
      </Section>

      <Section title="Tim">
        <p>
          Dibuat untuk lomba IT RUSH 2026 oleh Ukon (frontend & UX), Rhein
          (backend & data), Bagus (AI), dan Syaki (data, konten & dokumentasi).
        </p>
      </Section>
    </main>
  );
}
