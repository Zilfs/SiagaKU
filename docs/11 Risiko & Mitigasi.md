---
title: SiagaKU — Risiko & Mitigasi
project: "[[SiagaKU]]"
type: risk-register
status: draft
created: 2026-11-13
tags: [siagaku, risiko]
---

# Risiko & Mitigasi

Terkait: [[01 Design Doc]] · [[09 Timeline & Pembagian Tugas]]

Skala: Dampak (D) & Kemungkinan (K): 1 rendah – 3 tinggi.

| # | Risiko | D | K | Mitigasi | Pemicu / tanda | PIC |
|---|---|---|---|---|---|---|
| R1 | **Kuota AI habis saat penjurian** | 3 | 2 | Fallback 3 tingkat; cache penjelasan & FAQ chat; rate limit per IP; billing Gemini / provider alternatif aktif 20–30 Nov; fallback template non-AI | `ai_log` banyak `quota` | W3 |
| R2 | **Skop tidak selesai** | 3 | 2 | MoSCoW; gate hari 4; feature freeze 19 Nov 12.00; F5 dipotong pertama | Golden path belum jalan akhir hari 3 | Semua |
| R3 | **Data kurasi kurang** (riwayat, posko) | 2 | 2 | Target minimum ([[06 Data & Database#6. Target Volume Data Minimum (agar demo meyakinkan)]]); label "perkiraan"; prioritaskan 15 kecamatan paling rawan | < 20 baris riwayat di akhir hari 2 | W4 |
| R4 | **AI berhalusinasi info keselamatan** | 3 | 2 | Titik aman & kontak dari DB; validasi ID; sitasi; prompt larangan; eval 40 pertanyaan; deteksi darurat rule-based | Eval gagal > 10% | W3 |
| R5 | **Supabase free project ter-pause** sebelum 30 Nov | 3 | 2 | Cron harian `/api/health` (query DB); cek manual 2 hari sekali pasca-submit | Health check gagal | W2 |
| R6 | **API BMKG berubah/lambat/down** | 2 | 2 | Cache 3 jam + stale; timeout 5 s; skor tetap dari Open-Meteo | Timeout di log | W2 |
| R7 | **Model Gemini/Groq ganti nama/deprecated** | 2 | 1 | Model id di env; cek AI Studio saat setup & sebelum submit | Error 404 model | W3 |
| R8 | **API key bocor ke repo publik** | 3 | 1 | `.gitignore`, review PR, secret scanning GitHub; jika bocor → **rotasi key** (bukan rewrite history) | Alert GitHub | W2 |
| R9 | **Upload foto tidak pantas** | 2 | 1 | AI vision menolak + tidak tampil; rate limit; laporan non-demo hanya 72 jam | — | W3 |
| R10 | **Bug di produksi saat juri menguji** | 3 | 2 | Error boundary per kartu; QA multi-perangkat; tidak deploy besar setelah submit | — | Semua |
| R11 | **Video/proposal mepet** | 2 | 2 | Mulai draf proposal hari 3; rekam video hari 6 malam; submit target 20.00 | Draf belum ada di hari 5 | W4 |
| R12 | **Pelanggaran aturan orisinalitas/kredit** | 3 | 1 | Catat semua library/aset/AI assistant sejak hari 0 di `CREDITS.md`; foto demo milik sendiri | — | W4 |
| R14 | **Push tidak sampai** (izin ditolak, iOS non-PWA, subscription kedaluwarsa) | 2 | 2 | Banner (A) sebagai jaring pengaman; panduan iOS; hapus subscription 404/410; tombol uji | Uji gagal di satu platform | W1 |
| R15 | **Cron GitHub Actions telat/tidak jalan** (jadwal GHA bisa tertunda, repo tanpa aktivitas) | 2 | 2 | Jadwal tiap jam (toleran telat); `workflow_dispatch` untuk jalan manual; banner mengevaluasi on-demand bila status > 1 jam; cek tab Actions harian pasca-submit | Run terakhir > 2 jam | W2 |
| R16 | **Peringatan palsu / terlalu sering** | 2 | 2 | Syarat faktor hujan ≥ 20; push hanya Siaga/Awas; dedupe 6 jam; label "potensi" | Banyak push saat hujan ringan | W2 |
| R13 | **Tile OSM rate-limited** | 1 | 1 | Pakai tile OSM standar dengan atribusi; alternatif CARTO basemap gratis | Tile tidak muncul | W1 |

## Pertanyaan Terbuka

| # | Pertanyaan | Dampak | Status |
|---|---|---|---|
| Q1 | Siapa memegang W1–W4? | Paralelisasi | Tim, Hari 0 |
| Q2 | Nama tim resmi (untuk nama file proposal)? | Berkas | Tim |
| Q3 | Provider alternatif mana yang dipakai jika billing Gemini tidak diaktifkan? Pastikan **kompatibel format OpenAI** dan mendukung model yang dibutuhkan. | Router AI | Tim, sebelum 20 Nov |
| Q4 | Apakah ada dataset resmi posko pengungsian DKI yang bisa diakses? | Kualitas titik aman | W4, Hari 1 |
| Q5 | GeoJSON batas kecamatan DKI tersedia & lisensinya jelas? | Peta choropleth vs marker | W1/W4, Hari 1 |
| Q6 | Domain kustom (mis. `siagaku.vercel.app` cukup)? | Branding | Tim |
| Q7 | Isi persis template proposal & surat pernyataan (perlu diunduh dari link guidebook) | Bab proposal | W4, Hari 0 |
