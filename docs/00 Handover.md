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

## Status (13 Nov malam)
SELESAI: brainstorming, design doc, PRD, dokumentasi teknis lengkap (13 file .md).
SELESAI JUGA: design disetujui; rencana implementasi 17 task (13 Implementation Plan), termasuk Task 14 Peringatan Dini.
SELESAI JUGA (W4 Data): Kurasi 5 file CSV lengkap di branch `feature/data-curation`:
  1. `kecamatan.csv` (44 kecamatan, koordinat BMKG API, status pesisir rob)
  2. `riwayat_banjir.csv` (240 kejadian banjir 2025–2026 dari rilis BPBD)
  3. `kelurahan_rawan.csv` (116 kelurahan rawan 2023 dari Satu Data Jakarta)
  4. `posko.csv` (277 titik pengungsian dari JSC & Jakarta Satu)
  5. `kontak.csv` (10 kontak darurat resmi DKI Jakarta)
  Semua file diverifikasi, selaras dengan skema database `0001_init.sql`, dan didokumentasikan di `data/README.md`.

BELUM: push/PR ke branch `dev`; Task 9 (RAG PDFs), Task 13 (soal evaluasi), Task 17 (README utama, proposal, video).
File dokumentasi ada di vault Obsidian: C:\Users\hirzi\Work\rhein-stash\Efforts\Projects\SiagaKU\
(00 Handover, 01 Design Doc, 02 PRD, 03 Arsitektur Sistem, 04 Fitur & Alur Pengguna,
05 Desain AI, 06 Data & Database, 07 API Spec, 08 UI-UX, 09 Timeline & Pembagian Tugas,
10 Deliverables Lomba, 11 Risiko & Mitigasi, 12 Referensi & Sumber Data, 13 Implementation Plan, SiagaKU.md).

## Masalah terbuka / risiko
- Kuota AI saat penjurian (mitigasi: fallback, cache, rate limit, billing/alternatif).
- Data riwayat banjir & posko harus dikurasi manual (target minimum di 06 Data & Database).
- Supabase free bisa pause → cron keep-alive harian.
- Template proposal & surat pernyataan belum diunduh (link bit.ly di guidebook).
- PIC: W1 Ukon, W2 Rhein (integrator), W3 Bagus, W4 Syaki. Nama tim resmi & provider alternatif: belum diputuskan.

## Langkah berikutnya (urut)
1. Review 13 Implementation Plan, pilih metode eksekusi (subagent-driven / native).
2. Eksekusi mulai Task 1.
3. Hari 0: akun GitHub/Vercel/Supabase/AI Studio/Groq, create-next-app, deploy pertama, CI.
4. Hari 1: migrasi SQL, data/kecamatan.csv (44 baris), router AI, ingest RAG, layout.
5. Ikuti 09 Timeline & Pembagian Tugas.
```
