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
- Batas `hunian.lantai` 0–60 (14 Nov), angka lain di input rencana tetap 0–10.
- Pembagian peran (13 Nov): W1 Frontend = Ukon, W2 Backend/Data = Rhein, W3 AI = Bagus,
  W4 Data/Konten/Dokumentasi = Syaki.

## Status (14 Nov 2026)
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
- Proteksi branch `dev` & `main` aktif (wajib PR, 1 approval orang lain, CI hijau, tanpa force-push).
- URL resmi dokumen pedoman `04` sudah diverifikasi Syaki (Perpustakaan BNPB).
- `CREDITS.md` diperbarui dengan daftar PDF pedoman.

BELUM: ingest korpus pedoman ke Supabase (butuh GEMINI_API_KEY; target >= 5 dokumen, >= 150 chunk); Task 17 (README utama, proposal, video).
File dokumentasi ada di vault Obsidian: C:\Users\hirzi\Work\rhein-stash\Efforts\Projects\SiagaKU\
(00 Handover, 01 Design Doc, 02 PRD, 03 Arsitektur Sistem, 04 Fitur & Alur Pengguna,
05 Desain AI, 06 Data & Database, 07 API Spec, 08 UI-UX, 09 Timeline & Pembagian Tugas,
10 Deliverables Lomba, 11 Risiko & Mitigasi, 12 Referensi & Sumber Data, 13 Implementation Plan, SiagaKU.md).

## Masalah terbuka / risiko
- Kuota AI saat penjurian (mitigasi: fallback, cache, rate limit, billing/alternatif).
- Data riwayat banjir & posko harus dikurasi manual (target minimum di 06 Data & Database).
- `docs/06 Data & Database.md` baris 205 memakai kode Ceger `31.75.10.1004` (itu kode Munjul); yang benar `31.75.10.1008`.
- Supabase belum dibuat: `0001_init.sql` dan `0002_rate_limit.sql` belum dijalankan; `.env.local` & key AI belum ada.
- Supabase free bisa pause → cron keep-alive harian.
- Template proposal & surat pernyataan belum diunduh (link bit.ly di guidebook).
- PIC: W1 Ukon, W2 Rhein (integrator), W3 Bagus, W4 Syaki. Nama tim resmi: belum diputuskan.

## Langkah berikutnya (urut)
1. Rhein: buat project Supabase, jalankan migrasi 0001–0002, isi `.env.local`, setup Vercel.
2. Rhein: seed data (Task 4 script) supaya API T7 punya data; Ukon: Task 8 pakai tipe di `src/features/risk/types.ts`.
3. Bagus: jalankan `npm run rag:ingest` setelah key ada (PR #7 sudah di-merge), lalu lanjut chat API.
4. Syaki: Task 17 (README utama, proposal, video).
5. Ikuti 09 Timeline & Pembagian Tugas.
```
