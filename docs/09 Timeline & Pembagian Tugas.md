---
title: SiagaKU — Timeline & Pembagian Tugas
project: "[[SiagaKU]]"
type: plan
status: draft
created: 2026-11-13
tags: [siagaku, timeline, tim]
---

# Timeline & Pembagian Tugas

Terkait: [[02 PRD#10. Rilis & Milestone]] · [[10 Deliverables Lomba]]

> [!important] Tanggal kunci
> - **Kam 19 Nov 12.00 WIB:** feature freeze
> - **Jum 20 Nov 20.00 WIB:** target submit (buffer 4 jam)
> - **Jum 20 Nov 23.59 WIB:** batas resmi Gelombang 2
> - 28–29 Nov penjurian · 30 Nov pengumuman. Website wajib tetap live.

## 1. Jalur Kerja (Workstream)

PIC ditetapkan 13 Nov 2026 (task per orang: [[13 Implementation Plan]]). Satu orang boleh memegang lebih dari satu jalur. Jika hanya 2 orang yang ngoding, gabungkan W1+W2 dan W3+W4 (lihat §4).

| Jalur | Tanggung jawab | Skill dibutuhkan | PIC |
|---|---|---|---|
| **W1 Frontend & UX** | Layout, halaman, komponen, peta Leaflet, form rencana, UI chat, responsif, aksesibilitas | React/Next.js, Tailwind | Ukon |
| **W2 Backend & Data Platform** | Supabase (skema, migrasi, RLS, storage), route handler, cache, rate limit, BMKG/Open-Meteo, skor risiko, seeding, deploy & cron | TypeScript, SQL | Rhein (integrator, review & merge PR) |
| **W3 AI** | Router fallback, prompt, schema zod, RAG ingest + retrieval, chat stream, vision, eval 40 pertanyaan | TypeScript, LLM API | Bagus |
| **W4 Data, Konten & Dokumentasi** | Kurasi CSV (kecamatan, riwayat, rawan, posko, kontak), kumpulkan pedoman PDF, foto demo, proposal, naskah & rekaman video, README, QA manual, berkas pendaftaran | Riset, menulis, desain dasar | Syaki |

## 2. Rencana Harian

### Jum 13 Nov (malam) — Hari 0: Setup
- [ ] Semua: buat akun/project **GitHub (repo publik)**, Vercel, Supabase, Google AI Studio (API key), Groq (API key)
- [ ] W2: `create-next-app` (TS, Tailwind, App Router, ESLint) → push → deploy pertama ke Vercel (halaman "Hello SiagaKU")
- [ ] W2: tambah shadcn/ui, Prettier, Vitest, CI GitHub Actions, `.env.example`, `env.ts`
- [ ] W4: daftar Gelombang 2 (Rp75.000), follow IG, twibbon, scan KTM; unduh template proposal & surat pernyataan
- [ ] Semua: ikuti konvensi branch di `AGENTS.md` (branch `feature/<nama-fitur>` dari `dev`, dinamai sesuai fitur bukan nama orang, mis. `feature/chat-bot`; `git pull origin dev` sebelum kerja, PR ke `dev`; `dev` → `main` oleh Rhein; jangan pernah force-push)

### Sab 14 Nov — Hari 1: Fondasi & Data
- [ ] W2: migrasi SQL ([[06 Data & Database#3. Skema Database (Supabase Postgres)]]), bucket storage, `db/client.ts`, `cache.ts`, `rate-limit.ts`
- [ ] W2: `bmkg.ts` + `openmeteo.ts` (+ unit test parser dengan fixture JSON)
- [ ] W2: `score.ts` + test
- [ ] W3: `providers.ts` + `router.ts` + test (mock error 429/500/timeout); endpoint uji `/api/health?deep=1`
- [ ] W3: `ingest-dokumen.ts` (chunk + embed), uji dengan 1 PDF
- [ ] W1: layout global (header, footer, modal Darurat), landing, design tokens
- [ ] W4: **`data/districts.csv` 44 baris** (prioritas!), mulai `flood_events.csv`, `flood_prone_subdistricts.csv`, `emergency_contacts.csv`; kumpulkan ≥ 5 PDF pedoman
- **Akhir hari:** seed kecamatan jalan, deploy hijau

### Min 15 Nov — Hari 2: F1 + mulai F2/F3
- [ ] W1: `/peta` (Leaflet, marker per level, popup), `/wilayah/[slug]` (kartu skor, cuaca, riwayat, titik aman)
- [ ] W2: `/api/kecamatan`, `/api/risiko/[id]`, seed riwayat/rawan/posko, hitung `kerawanan_dasar`
- [ ] W3: ingest semua dokumen; `rag.ts` (match + FTS fallback); `/api/chat` streaming
- [ ] W4: lanjut kurasi (target minimum data), `shelters.csv`; foto demo laporan (milik sendiri / lisensi bebas)
- **Akhir hari:** F1 jalan end-to-end di produksi

### Sen 16 Nov — Hari 3: F2 + F3 jalan
- [ ] W1: wizard `/rencana` + halaman hasil + checklist + print CSS; UI chat (`/tanya` + widget, sumber, kartu darurat)
- [ ] W2: `/api/rencana` (+ verifikasi titik aman), `/api/risiko/[id]/penjelasan`, `fallback-plan.ts`
- [ ] W3: prompt + schema rencana; prompt chat; `emergency.ts` + test; penjelasan risiko
- [ ] W4: kalibrasi skor (cek kecamatan langganan banjir); mulai draf proposal bab latar belakang
- **Akhir hari:** golden path ([[04 Fitur & Alur Pengguna#2. Alur Utama ("Golden Path" untuk demo & juri)]]) bisa dijalankan

### Sel 17 Nov — Hari 4: Stabilkan inti + F6/F7
- [ ] W1: polishing responsif, loading/empty/error state, `/tentang`
- [ ] W2: cron keep-alive, header keamanan, optimasi cache/ISR
- [ ] W3: **eval 40 pertanyaan + 6 profil** → perbaiki prompt; uji fallback (matikan key Gemini sementara)
- [ ] W4: QA manual golden path di 3 perangkat; draf proposal bab solusi & fitur; draf naskah video
- **Gate:** jika F1–F3 lolos QA → lanjut F4 besok. Jika belum → Hari 5 untuk stabilisasi.

### Rab 18 Nov — Hari 5: F8 Peringatan Dini (Should) / F4 (Could)
- [ ] W2: `seed-kelurahan.ts`, `evaluasiPeringatan` + test, `/api/kelurahan`, `/api/peringatan/[kode]`, `/api/cron/peringatan`, workflow GitHub Actions tiap jam
- [ ] W1: `/peringatan`, banner global, tombol "Pantau wilayah ini", manifest + ikon, `sw.js`, alur izin push + panduan iOS
- [ ] W3: `web-push` (VAPID), `/api/push/subscribe|unsubscribe|test`; bantu W1 di service worker
- [ ] Uji: notifikasi uji di Chrome desktop, Chrome Android, iPhone (PWA terpasang)
- [ ] Jika F8 selesai sebelum malam: mulai F4 (`/lapor` + vision). F5 **dipotong** (kartu teks statis)
- [ ] W4: screenshot untuk proposal; lanjut proposal; README (instalasi, arsitektur, kredit AI)

### Kam 19 Nov — Hari 6: Freeze 12.00 & QA
- [ ] Pagi: selesaikan F8 atau potong ke banner saja (A); F4 hanya jika sudah hampir jadi
- [ ] **12.00 feature freeze.** Setelah ini hanya bug fix.
- [ ] Semua: bug bash (checklist [[10 Deliverables Lomba#Checklist uji sebelum submit]]), Lighthouse
- [ ] W4 (+1 orang): **rekam video demo** malam ini di produksi
- [ ] Finalisasi README

### Jum 20 Nov — Hari 7: Submit
- [ ] Pagi: edit video (3–5 menit) → upload YouTube **Unlisted**
- [ ] Finalisasi proposal → PDF `ITRUSH26_NamaTim_SiagaKU.pdf`; surat pernyataan orisinalitas & AI → PDF
- [ ] Siang: smoke test terakhir di produksi; cek repo publik & riwayat commit utuh
- [ ] **20.00 submit** Google Form (Bagian A, B, C); screenshot bukti submit
- [ ] Aktifkan billing Gemini / siapkan provider alternatif untuk periode penjurian

### 21–30 Nov — Pasca-submit
- [ ] **Jangan deploy perubahan besar.** Hanya hotfix kritis (dan dicatat).
- [ ] Cek `/api/health` harian; pantau `ai_log` untuk error/fallback
- [ ] 28–29 Nov: siaga jika ada masalah layanan

## 3. Definisi Selesai (DoD) per Fitur
- Jalan di produksi (Vercel), bukan hanya lokal
- Responsif 360 px & 1280 px
- Loading, empty, dan error state ada
- Input divalidasi; error ramah
- Lint + typecheck + test lulus di CI
- Sudah dicoba oleh anggota tim lain (bukan pembuatnya)

## 4. Skema Jika Hanya 2 Orang Ngoding
| Orang | Jalur |
|---|---|
| Dev A | W1 + bagian UI dari W3 (chat UI) |
| Dev B | W2 + W3 (router, RAG, prompt) |
| Non-dev | W4 penuh |
Konsekuensi: F8 cukup banner (A) + push jika sempat; F4 dipotong; F5 dipotong.

## 5. Ritual Tim
- **Stand-up 10 menit** tiap pagi (chat grup): kemarin, hari ini, hambatan.
- **Check-in malam:** demo singkat apa yang sudah live.
- Papan tugas: GitHub Projects (kolom Todo / Doing / Review / Done) dengan issue per item di atas.
