# Kredit

SiagaKU dibangun dengan pustaka dan alat sumber terbuka berikut:

- [Next.js](https://nextjs.org) dan [React](https://react.dev) - kerangka aplikasi web
- [Tailwind CSS](https://tailwindcss.com) - gaya
- [shadcn/ui](https://ui.shadcn.com) - komponen UI
- [Base UI](https://base-ui.com) (@base-ui/react) - primitif komponen tanpa gaya
- [lucide-react](https://lucide.dev) - ikon
- [class-variance-authority](https://cva.style) dan tw-animate-css - varian kelas dan animasi
- cn (paket npm `cn`) - pembantu penggabung nama kelas dari shadcn
- Font Epilogue dan JetBrains Mono (via next/font, Google Fonts, lisensi SIL OFL) - tipografi display dan angka
- [taste-skill](https://github.com/Leonxlnx/taste-skill) (design-taste-frontend 2.5.1, MIT License, © 2026 Leonxlnx) - sistem layout, kartu, dan motion yang diadaptasi di `src/styles/taste/` dan `public/taste/moments/`; lisensi lengkap di `THIRD_PARTY_NOTICES.md`
- [zod](https://zod.dev) - validasi data dan env
- [Supabase](https://supabase.com) (@supabase/supabase-js) - klien basis data Postgres dan penyimpanan
- [Leaflet](https://leafletjs.com) (BSD-2-Clause) - peta risiko interaktif; ubin peta dari [OpenStreetMap](https://www.openstreetmap.org/copyright)
- server-only (Vercel) - menjaga modul sisi server tidak masuk ke bundel browser
- [Vercel AI SDK](https://ai-sdk.dev) (`ai`, `@ai-sdk/react`) - panggilan model AI, streaming, structured output, hook chat
- [@ai-sdk/google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai), [@ai-sdk/groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq), dan [@ai-sdk/openai-compatible](https://ai-sdk.dev/providers/openai-compatible-providers) - provider AI dan fallback
- [unpdf](https://github.com/unjs/unpdf) - ekstraksi teks PDF per halaman untuk ingest RAG
- [Vitest](https://vitest.dev) dan @vitejs/plugin-react - pengujian
- [Prettier](https://prettier.io) - pemformat kode
- [tsx](https://tsx.is) - menjalankan skrip TypeScript
- [ESLint](https://eslint.org) dan [TypeScript](https://www.typescriptlang.org) - lint dan pengecekan tipe

## Dokumen pedoman (basis pengetahuan RAG)

Kelima PDF di `data/guidelines/` dipakai sebagai sumber jawaban chatbot dan wajib
dicantumkan sesuai aturan aset (AGENTS.md §6):

| Dokumen | Penerbit | Tahun | Sumber |
|---|---|---|---|
| Panduan Kesiapsiagaan Menghadapi Banjir Bagi Masyarakat | BPBD DKI Jakarta | 2021 | <https://ppid.jakarta.go.id/assets/pdf/buku-saku-panduan-kesiapsiagaan-menghadapi-banjir-bagi-masyarakat.pdf> |
| Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana | BNPB | 2019 | <https://bnpb.go.id/storage/app/media/uploads/24/buku-data-bencana/6-buku-saku-cetakan-4-2019.pdf> |
| Buku Saku Satuan Pendidikan Aman Bencana (SPAB) | Kemendikbudristek & BNPB | 2020 | <https://spab.kemendikdasmen.go.id/web/files/FINAL_Buku_SPAB_Versi-2_Bahasa_20DES.pdf> |
| Buku Pedoman Latihan Kesiapsiagaan Bencana Nasional | BNPB | 2017 | <https://perpustakaan.bnpb.go.id/inlislite/uploaded_files/temporary/DigitalCollection/ZGU1YzVlNjQzNjNkMmIxM2QyNzJiZjdlZjBkZDQ1YjJkMmVlY2QyMg==.pdf> |
| Panduan Kesiapsiagaan Bencana untuk Keluarga | BNPB | 2019 | <https://ppid.bpsdmd.jatengprov.go.id/assets/upload/informasi/informasi_serta_merta_1640654240.pdf> |

Sumber dataset kurasi (kecamatan, riwayat banjir, kelurahan rawan, titik pengungsian,
kontak darurat) beserta tautan verifikasi per baris ada di `data/README.md`.

AI coding assistant: Claude Code (Anthropic) — digunakan untuk scaffolding dan implementasi.
AI coding assistant: opencode — digunakan untuk implementasi router AI dan RAG (Task 5, Task 9).
AI coding assistant: opencode (DeepSeek V4.1 Flash) — redesain UI/UX landing, halaman wilayah, dan peta (Task 8).
