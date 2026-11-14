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
- Tim siap aktifkan billing Gemini atau pakai provider alternatif saat penjurian.
- Pembagian peran (13 Nov): W1 Frontend = Ukon, W2 Backend/Data = Rhein, W3 AI = Bagus,
  W4 Data/Konten/Dokumentasi = Syaki.

## Status (14 Nov 2026)
SELESAI:
- Brainstorming, design doc, PRD, dan dokumentasi teknis lengkap (13 file .md).
- W4 Task 4 (Kurasi Data): 5 file CSV lengkap & terverifikasi, plus `data/README.md`:
  1. `kecamatan.csv` (44 kecamatan, koordinat BMKG API, status pesisir rob)
  2. `riwayat_banjir.csv` (240 kejadian banjir 2025–2026 dari rilis BPBD)
  3. `kelurahan_rawan.csv` (116 kelurahan rawan 2023 dari Satu Data Jakarta)
  4. `posko.csv` (283 titik pengungsian dari JSC & kantor kelurahan Jakarta Satu, 44/44 kecamatan)
  5. `kontak.csv` (9 kontak darurat terverifikasi; 0812-1237-575 = Pusdalops BNPB, bukan BPBD)
- W4 Task 9 (Dokumen RAG): 5 file PDF pedoman resmi (BPBD DKI, BNPB, Kemendikbud) di `data/guidelines/`.
- W4 Task 13 (Evaluasi RAG): 40 soal + 6 profil uji di `tests/eval/` (lihat `tests/eval/README.md`).
- W2 Task 1–3: boilerplate + CI, migrasi `0001_init.sql` (12 tabel, RLS, RPC RAG, bucket `reports`),
  cache `getOrSet`, skor risiko, klien BMKG & Open-Meteo. Struktur kode feature-based (`docs/14 Struktur Kode.md`).
- W3 Task 5: router AI gemini → groq → alt (`src/lib/ai/`), merge PR #4.
- W2 Task 6: `src/lib/rate-limit.ts` (fixed window, bucket chat/plan/report/explanation, fail open saat DB error),
  `src/lib/http.ts` (`jsonError`, `HttpError`, `parseJson`), migrasi `0002_rate_limit.sql` (`hit_rate_limit`).
- Proteksi branch `dev` & `main` aktif (wajib PR, 1 approval orang lain, CI hijau, tanpa force-push).

BELUM: Task 17 (README utama, proposal, video).
File dokumentasi ada di vault Obsidian: C:\Users\hirzi\Work\rhein-stash\Efforts\Projects\SiagaKU\
(00 Handover, 01 Design Doc, 02 PRD, 03 Arsitektur Sistem, 04 Fitur & Alur Pengguna,
05 Desain AI, 06 Data & Database, 07 API Spec, 08 UI-UX, 09 Timeline & Pembagian Tugas,
10 Deliverables Lomba, 11 Risiko & Mitigasi, 12 Referensi & Sumber Data, 13 Implementation Plan, SiagaKU.md).

## Masalah terbuka / risiko
- Kuota AI saat penjurian (mitigasi: fallback, cache, rate limit, billing/alternatif).
- Data riwayat banjir & posko harus dikurasi manual (target minimum di 06 Data & Database).
- `tests/eval/profil.json` P03 memakai `lantai: 12` (sesuai 05 Desain AI §7), sedangkan 07 API Spec membatasi `lantai` 0–10. Perlu keputusan Rhein: naikkan batas `lantai` (usul 0–60) atau turunkan profil uji.
- `docs/06 Data & Database.md` baris 205 memakai kode Ceger `31.75.10.1004` (itu kode Munjul); yang benar `31.75.10.1008`.
- Supabase belum dibuat: `0001_init.sql` dan `0002_rate_limit.sql` belum dijalankan; `.env.local` & key AI belum ada.
- PR #7 (RAG, Bagus) menunggu perbaikan: konflik handover + pakai folder `data/guidelines/` (bukan `data/pedoman/`).
- Issue #15 (Syaki): nama file data → bahasa Inggris, cek sumber PDF 04, cantumkan PDF di CREDITS.
- Supabase free bisa pause → cron keep-alive harian.
- Template proposal & surat pernyataan belum diunduh (link bit.ly di guidebook).
- PIC: W1 Ukon, W2 Rhein (integrator), W3 Bagus, W4 Syaki. Nama tim resmi & provider alternatif: belum diputuskan.

## Langkah berikutnya (urut)
1. Rhein: buat project Supabase, jalankan migrasi 0001–0002, isi `.env.local`, setup Vercel.
2. Rhein: putuskan batas `lantai` (lihat risiko di atas), lalu Task 7 (API risiko + penjelasan AI).
3. Bagus: perbaiki PR #7, lalu jalankan `npm run rag:ingest` setelah key ada.
4. Syaki: issue #15. Ukon: Task 8 (UI dasar) setelah Task 7 siap.
5. Ikuti 09 Timeline & Pembagian Tugas.
```
