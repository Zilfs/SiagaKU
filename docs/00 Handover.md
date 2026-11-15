---
title: SiagaKU — Handover untuk Sesi Baru
project: "[[SiagaKU]]"
type: handover
created: 2026-11-13
tags: [siagaku, handover]
---

# Handover (copy-paste ke sesi baru)

```
## Konteks
Aku (Rhein, mahasiswa Informatika UPNVJ) dan tim (4 orang) ikut Lomba Web Development
IT RUSH 2026 (HIMATIF UNIB), subtema "Mitigasi Bencana dan Perubahan Iklim". Wajib ada fitur AI.
Deadline submit: Jum 20 Nov 2026 23.59 WIB (target internal 20.00). Feature freeze Kam 19 Nov 12.00.
Website wajib live sampai 30 Nov 2026; repo publik; riwayat commit tidak boleh dimanipulasi;
penggunaan library/aset/AI coding assistant wajib dicantumkan di proposal & README.
Penjurian daring asinkron: juri menguji live website sendiri.
Bobot: Fungsionalitas 25, Inovasi 20, Relevansi 15, UI/UX 15, Kode 15, Dokumentasi 10.

## Produk: SiagaKU
Web app kesiapsiagaan banjir untuk warga DKI Jakarta (44 kecamatan), tanpa login.
- F1 (Must) Cek Risiko Wilayah: peta + halaman kecamatan; skor 0–100 =
  round(0.55*kerawanan_dasar + 0.45*faktor_hujan); cuaca BMKG; penjelasan AI (cache 3 jam).
- F2 (Must) Rencana Siaga Personal: wizard 3 langkah → AI structured output (zod) →
  /rencana/[slug] bisa dibagikan/dicetak. Titik aman & kontak darurat DIAMBIL DARI DB.
- F3 (Must) Tanya SiagaKU: chatbot RAG (pgvector, gemini-embedding-001 768 dim) dengan sitasi
  pedoman BNPB/BPBD; deteksi darurat rule-based → kartu 112.
- F8 (Should, hari 5) Peringatan Dini per KELURAHAN (contoh: Bagus di Ceger): prakiraan BMKG 24 jam ×
  kerawanan → Normal/Waspada/Siaga/Awas; banner in-app (localStorage) + Web Push (PWA ringan:
  manifest + sw.js, VAPID, web-push) dengan tombol "Kirim notifikasi uji"; cron GitHub Actions tiap jam
  → /api/cron/peringatan; dedupe 6 jam; teks template tanpa AI; iOS perlu Add to Home Screen.
- F4 (Could) Lapor Banjir: foto → AI vision → peta. F5 tren iklim DIPOTONG (kartu teks statis).
- F6 Tentang & Metodologi, F7 tombol Darurat 112.

## Keputusan
- Pendekatan A: monolit Next.js 16 (App Router, TS) di Vercel + Supabase (Postgres, Storage, pgvector).
- Vercel AI SDK; router fallback: Gemini → Groq → provider alternatif OpenAI-compatible (opsional).
  Model id dari env. Pindah provider saat 429/5xx/timeout/invalid; tidak pindah saat safety block.
- Setiap fitur AI punya fallback non-AI (template).
- Data cuaca: BMKG (tampil, resmi) + Open-Meteo (angka mm untuk skor & historis).
- Tailwind + shadcn/ui, Leaflet, Recharts, zod, Vitest, GitHub Actions CI.
- Urutan provider (14 Nov): Gemini gratis → Groq gratis → Gemini berbayar lewat slot `ALT_AI_*` (endpoint OpenAI-compatible Gemini, project Google terpisah dengan billing + budget alert). Tanpa ubah kode. Embedding RAG tetap pakai key Gemini gratis (kalau habis, retrieval turun ke FTS).
- Kode error baru `UNAUTHORIZED` (401) untuk route ber-token (health deep, cron T14); helper `isBearer` di `src/lib/http.ts`.
- Key AI opsional (14 Nov): `parseEnv` tidak lagi menolak env tanpa Gemini/Groq, hanya memberi peringatan. Tanpa key, penjelasan, chat, dan rencana memakai template, jadi site tetap jalan (sebelumnya seluruh route 500).
- Batas `hunian.lantai` 0–60 (14 Nov), angka lain di input rencana tetap 0–10.
- Pembagian peran (13 Nov): W1 Frontend = Ukon, W2 Backend/Data = Rhein, W3 AI = Bagus,
  W4 Data/Konten/Dokumentasi = Syaki.

## Status (15 Nov 2026)
SELESAI:
- Brainstorming, design doc, PRD, dan dokumentasi teknis lengkap (13 file .md).
- W4 Task 4 (Kurasi Data): 5 file CSV lengkap & terverifikasi (rename ke Inggris: `districts.csv`, `flood_events.csv`, `flood_prone_subdistricts.csv`, `shelters.csv`, `emergency_contacts.csv`).
- W4 Task 9 (Dokumen RAG): 5 file PDF pedoman resmi di `data/guidelines/` + `index.json`.
- W4 Task 13 (Evaluasi RAG): 40 soal + 6 profil uji di `tests/eval/` (key JSON: `group`, `question`, `must_include`, `name`, `district_slug`).
- W3 Task 5: router AI gemini → groq → alt (`src/lib/ai/`), merge PR #4.
- W3 Task 9 (RAG): chunking, embedding 768 dim, retrieval vector dengan fallback FTS, dan skrip ingest di branch feature/rag. Korpus membaca `data/guidelines/` + `data/guidelines/index.json` (5 entri); folder `data/pedoman/` dihapus.
- W2 Task 1–3: boilerplate + CI, migrasi `0001_init.sql` (12 tabel, RLS, RPC RAG, bucket `reports`),
  cache `getOrSet`, skor risiko, klien BMKG & Open-Meteo. Struktur kode feature-based (`docs/14 Struktur Kode.md`).
- W2 Task 6: `src/lib/rate-limit.ts` (fixed window, bucket chat/plan/report/explanation, fail open saat DB error),
  `src/lib/http.ts` (`jsonError`, `HttpError`, `parseJson`), migrasi `0002_rate_limit.sql` (`hit_rate_limit`).
- W2 Task 7: `GET /api/districts`, `GET /api/risk/[id]` (id atau slug), `GET /api/risk/[id]/explanation`
  (AI + cache 3 jam, fallback template). Kode di `src/features/risk/`. Key JSON respons bahasa Inggris
  camelCase (mis. `score`, `level: "high"`, `components.rainfallFactor`), bukan key Indonesia di docs/07;
  bentuk lengkap ada di `src/features/risk/types.ts` (`DistrictSummary`, `RiskDetail`). Bagian `iklim` tidak ada (F5 dipotong).
- W2 Task 12: `GET /api/health` (cek DB; `?deep=1` + `Authorization: Bearer CRON_SECRET` ping tiap provider, `skip` bila env kosong; 503 bila gagal), cron harian `vercel.json` (keep-alive Supabase), header keamanan di `next.config.ts`, `src/app/error.tsx`, halaman `/tentang` (rumus skor & tabel hujan dibaca dari `src/lib/risk/`, sumber, AI, privasi, kredit, disclaimer, tim; gaya polos, menunggu sistem visual PR #22).
- W3 Task 10 (backend Tanya SiagaKU): `POST /api/chat` streaming AI SDK (`createUIMessageStream`), `detectEmergency` rule-based (`src/features/chat/detect-emergency.ts`), prompt + konteks bernomor (`server/chat-prompt.ts`), cache 24 jam hanya untuk satu pesan tanpa `kecamatan_id` (`ai:chat:{sha256}`), rate limit 20/10 menit, fallback teks "Maaf, SiagaKU sedang sibuk…" + kartu darurat bila semua provider gagal. Data part aktual bahasa Inggris: `data-emergency` `{active}`, `data-sources` `{items}`, `data-meta` `{provider,model,fallback,cached}` (bukan `darurat`/`aktif` di docs/07). Payload `useChat` (`parts`) dan `content` sama-sama diterima. UI `/tanya` + komponen chat belum (Ukon).
- W2 Task 4 (seed): `npm run db:seed` (`scripts/seed.ts` + `scripts/lib/{csv,seed-data}.ts`) memvalidasi 5 CSV, memetakan slug ke id, menghitung `base_vulnerability` (kejadian per tanggal unik 5 tahun; kelurahan rawan +30 flat sampai T14), lalu mengisi 5 tabel. Diuji ke Postgres lokal dengan migrasi 0001 (44/240/116/283/9 baris; Jatinegara 80, Cengkareng 80, Kalideres 100). `src/lib/geo.ts`: `distanceKm`, `findNearestDistrict`.
- Proteksi branch `dev` & `main` aktif (wajib PR, 1 approval orang lain, CI hijau, tanpa force-push).
- URL resmi dokumen pedoman `04` sudah diverifikasi Syaki (Perpustakaan BNPB).
- `CREDITS.md` diperbarui dengan daftar PDF pedoman.
- W1 Task 8 (UI dasar, irisan pertama): sistem visual + landing baru (token warna, header/footer/dialog Darurat, hero triptych, panel cek risiko, empat kartu fitur, langkah, sumber data, FAQ), `/wilayah/[slug]` + 404 ramah, dan `/peta` Leaflet dengan tombol "Gunakan lokasiku". Semua memakai data contoh (`src/lib/demo/`) sampai Task 7 siap; tes `tests/components/{risk-badge,emergency}.test.tsx` ditambahkan.
- W1: landing + halaman wilayah + peta sudah di-merge ke `dev` (PR #22, 14 Nov).
- W1 `/tentang` (15 Nov, branch `feature/about-ui`): halaman metodologi memakai sistem visual (index chip, kartu skor/level, tabel hujan, sumber, AI, privasi, kredit, tim), angkanya tetap dibaca dari `src/lib/risk/`, dan tautan footer ditambahkan.
- Font diputuskan (Hirzi, 15 Nov): Plus Jakarta Sans (via next/font, Google Fonts, SIL OFL) untuk display, teks, dan angka; Epilogue + JetBrains Mono tidak dipakai lagi.
- W2 Task 14 backend (15 Nov, branch `feature/early-warning`): migrasi `0004_early_warning.sql` (`subdistricts`, `push_subscriptions`, `early_warning_status`, RLS tanpa policy); `evaluateEarlyWarning`/`shouldSendPush`/`notificationText` murni di `src/features/early-warning/evaluate.ts` (aturan docs/06 §7; status `normal|advisory|watch|warning`; jendela berakhir di ujung slot hujan terakhir, +3 jam); `GET /api/subdistricts?q=`, `GET /api/early-warning/[code]` (status < 1 jam dipakai, selain itu evaluasi on-demand, BMKG gagal → status lama `stale: true`), `POST /api/push/{subscribe,unsubscribe,test}` (rate limit 10/jam dan 3/10 menit, VAPID kosong → 503), `POST /api/cron/early-warning` (Bearer `CRON_SECRET`; kelurahan berlangganan ∪ 10 paling rawan, maks 50, konkurensi 5; 404/410 → subscription dihapus) dipicu tiap jam oleh `.github/workflows/early-warning.yml`. `npm run db:seed-subdistricts` mencari kelurahan dengan probe BMKG (`region_code` + `.1001…`, berhenti setelah 2× 404). UI #43 diselaraskan: `subdistrictCode` di subscribe, `rainfall24hMm`/`rainfallCategory` dibaca dan kategori ditampilkan berlabel Indonesia. docs/07 diperbarui. Library baru `web-push`.
- W1 T14 UI/PWA (15 Nov, branch `feature/alert-ui`): `/peringatan` (cari kelurahan, status, aktifkan/uji/hentikan notifikasi, panduan iOS), banner Siaga/Awas yang bisa ditutup 3 jam, manifest + ikon 192/512/maskable + badge, `sw.js` push-only, dan tombol **Pantau wilayah ini** di halaman kecamatan (`/peringatan?kecamatan=<slug>` menampilkan konteks kecamatan). API memakai path Inggris (`/api/subdistricts`, `/api/early-warning/[code]`, `/api/push/*`); status dan payload dibaca toleran (Indonesia/Inggris, snake_case/camelCase).

- W3 Task 11 (backend Rencana Siaga): `POST /api/plans` (rate limit 5/10 menit) + `GET /api/plans/[slug]`; schema `.strict()` bahasa Inggris (`district_id`, `housing`, `members`, `conditions`), output `PreparednessPlan` (`summary`, `recommendedReadinessLevel`, `goKit`, `before`/`during`/`after`, `vulnerableGroups`, `safePointIds`, `safePointReason`) di `src/features/plan/`. Model `withFallback "plan"` + `Output.object`; `safePointIds` selalu disaring ke shelter kecamatan (maks 6 ditawarkan, maks 3 disimpan); semua provider gagal atau output tidak valid -> rencana dasar rule-based, `provider: "template"`, HTTP 201. Slug 10 karakter dari `node:crypto`. UI `/rencana` belum (Ukon); 30 tes.
- W3 Task 13 (runner eval AI, 15 Nov, branch `feature/ai-eval`): `scripts/eval.ts` memanggil `POST /api/chat` + `POST /api/plans`/`GET /api/plans/[slug]`, membaca SSE (`data-emergency`/`data-sources`/`data-meta`), mengecek 40 soal dan 6 profil, lalu menulis `docs/eval-hasil.md`; exit code 1 bila target belum tercapai. Logika lulus/gagal murni di `scripts/lib/eval-checks.ts` (34 tes). `tests/eval/profiles.json` + README diterjemahkan ke kontrak Inggris (`district_id`, `housing`, `members`, `conditions`, `safePointIds`). Runner memakai `x-forwarded-for` unik per request (rate limit 20/10 menit chat, 5/10 menit plan) dan mengulang 429 setelah `Retry-After`. `npm run eval`. Revisi review Hirzi (15 Nov): rencana `provider: "template"` dihitung gagal, `--limit` melewati grup kosong dari gate, label provider memakai provider asli, satuan seperti `110 cm` tidak dianggap nomor telepon, penanda `maaf` polos dihapus, dan lima knob env opsional dihapus (hanya `EVAL_BASE_URL`). Revisi kedua: satuan hanya dicocokkan sebagai kata utuh (`110 malam ini` tetap nomor telepon, `110 meter` bukan), waktu tiap baris diukur sekali di `main` termasuk jalur gagal, dan `ChatAnswer.fallback` dihapus. **Eval live belum dijalankan**: `.env.local` belum punya kredensial Supabase/Gemini.
- AI live (14 Nov): `GEMINI_MODEL=gemini-3.5-flash-lite` di `.env.local` dan Vercel Production (key sensitive). Dipilih karena menjawab ~2 dtk; `gemini-3.5-flash` ~14 dtk (mepet `AI_TIMEOUT_MS` 20 dtk), `gemini-3.8-flash`/`gemini-flash-latest` timeout, `gemini-2.5-flash` tidak tersedia untuk key baru. Hindari alias `-latest`. Penjelasan risiko di production sudah `provider: "gemini"`.
- Korpus RAG (14 Nov): `npm run rag:ingest` memasukkan 5 dokumen, 447 chunk, semua ber-embedding. Kuota gratis embedding Gemini 100 teks/menit, jadi ingest dijeda 13 dtk per 20 teks; kalau ada chunk tanpa embedding, jalankan `npm run rag:backfill`.
- W1 Task 15 UI (15 Nov, branch `feature/report-ui`): `/lapor` (foto + kompres canvas 1600 px/1 MB, EXIF hilang, pilih kecamatan atau lokasi, deskripsi opsional, status unggah → AI) dan `/laporan` (peta Leaflet dengan marker kamera + daftar kartu 72 jam, label **Contoh** untuk demo, empty/error state). Memakai kontrak docs/07 yang diterjemahkan sesuai AGENTS: `POST /api/reports/upload-url`, `POST /api/reports`, `GET /api/reports?hours=72`; belum ada di `dev`.
- W2 Task 17 smoke (15 Nov, branch `feature/smoke-test`): `npm run smoke` (`SMOKE_BASE_URL=https://<prod>`; 44 `/wilayah/{slug}` → 200, `/api/health` `ok:true`, 1 `POST /api/plans` → 201, 1 `POST /api/chat` → stream berisi teks; exit 1 bila ada FAIL) dan `npm run check:bundle` (setelah `npm run build`, memindai `.next/static` untuk nama dan nilai secret server; nilai tidak pernah dicetak). Uji pertama ke `siaga-ku.vercel.app`: 45/47 PASS, plans & chat 404 karena production belum memuat T10/T11. Catatan: tiap run menulis 1 baris rencana ke DB production; run ulang < 10 menit kena rate limit 429 di `/api/plans`.

BELUM: T11-UI `/rencana` (PR #42, review kedua 15 Nov: request changes, 3 poin); backend T15 lapor banjir (`/api/reports*`, vision; PIC belum ditentukan); T13 eval live (runner selesai, menunggu kredensial); key chat masih `kecamatan_id` (perlu rename ke `district_id`); T17 (README utama, proposal, video, Lighthouse, tag `v1.0.0`). T14: migrasi 0004 + seed kelurahan + VAPID/secret GitHub belum dijalankan di production.
File dokumentasi ada di vault Obsidian: C:\Users\hirzi\Work\rhein-stash\Efforts\Projects\SiagaKU\
(00 Handover, 01 Design Doc, 02 PRD, 03 Arsitektur Sistem, 04 Fitur & Alur Pengguna,
05 Desain AI, 06 Data & Database, 07 API Spec, 08 UI-UX, 09 Timeline & Pembagian Tugas,
10 Deliverables Lomba, 11 Risiko & Mitigasi, 12 Referensi & Sumber Data, 13 Implementation Plan, SiagaKU.md).

## Masalah terbuka / risiko
- Kuota AI saat penjurian (mitigasi: fallback, cache, rate limit, billing/alternatif).
- Data riwayat banjir & posko harus dikurasi manual (target minimum di 06 Data & Database).
- `docs/06 Data & Database.md` baris 205 memakai kode Ceger `31.75.10.1004` (itu kode Munjul); yang benar `31.75.10.1008`.
- Supabase project `lqyrtrmorzndqdpdqcaz` (14 Nov): migrasi 0001–0003 dijalankan lewat MCP Supabase, seed 44/240/116/283/9 baris, `/api/health` dan endpoint T7 sudah dites dengan data asli. **Jangan pakai `supabase db push`**: riwayat migrasi remote memakai versi tanggal (`20261114…_init`), bukan `0001`, jadi CLI akan mencoba membuat ulang tabel. Migrasi baru: tambah file `supabase/migrations/000N_*.sql` di PR lalu jalankan lewat MCP (`apply_migration`). Advisor tersisa: `vector` di schema public (dibiarkan, memindahkannya berisiko) dan RLS tanpa policy (disengaja, akses hanya lewat server).
- Supabase free bisa pause → cron keep-alive harian.
- Template proposal & surat pernyataan belum diunduh (link bit.ly di guidebook).
- PIC: W1 Ukon, W2 Rhein (integrator), W3 Bagus, W4 Syaki. Nama tim resmi & provider alternatif: belum diputuskan.
- API yang belum ada di `dev`: `/api/reports`, `/api/reports/upload-url` (T15). `/lapor` dan menu "Lapor" sudah di `dev`; tahan rilis ke `main` sampai backend T15 ada atau sembunyikan menunya.

## Langkah berikutnya (urut)
1. Rhein: merge T14 backend, jalankan migrasi 0004 lewat MCP, `npm run db:seed-subdistricts`, buat VAPID (`npx web-push generate-vapid-keys`) → env Vercel, isi secret GitHub `CRON_SECRET` + `SITE_URL`, jalankan workflow Early warning sekali, lalu uji push di Chrome/Android/iPhone (plan T14 langkah 9).
2. Rhein: tambah Groq (`GROQ_API_KEY` + `GROQ_MODEL`) sebagai cadangan kalau kuota Gemini gratis habis saat penjurian; tentukan PIC backend T15.
3. Bagus: T13 runner selesai (`npm run eval`); jalankan eval live begitu `.env.local` punya kredensial Supabase/Gemini, lalu isi tabel di `docs/eval-hasil.md` dan perbaiki prompt sampai target. Rapikan key chat `kecamatan_id` → `district_id` di PR terpisah.
4. Syaki: Task 17 (README utama, proposal, video).
5. Ukon: perbaiki PR #42 sesuai review kedua (slug tidak dikenal mengunci wizard, checklist tertimpa `[]`, label tipe titik aman Indonesia lewat peta label bersama yang juga dipakai `features/risk/components/safe-points.tsx`), lalu `git pull origin dev`.
6. Rhein: setelah rilis `dev` → `main`, jalankan `SMOKE_BASE_URL=<prod> npm run smoke` dan `npm run build && npm run check:bundle` sampai semua PASS, lalu Lighthouse mobile `/` dan `/wilayah/jatinegara` (skor ke README).
7. Ikuti 09 Timeline & Pembagian Tugas.
```
