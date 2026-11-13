---
title: SiagaKU — Referensi & Sumber Data
project: "[[SiagaKU]]"
type: reference
status: draft
created: 2026-11-13
tags: [siagaku, referensi, data]
---

# Referensi & Sumber Data

Terkait: [[06 Data & Database]] · [[05 Desain AI]]

> [!note] Status verifikasi
> ✅ = sudah dicek saat brainstorming 13 Nov 2026. 🔎 = kandidat, **perlu dicari/diverifikasi** tim (URL, lisensi, isi).

## 1. API & Data Cuaca
| Sumber | Detail | Status |
|---|---|---|
| BMKG Prakiraan Cuaca | `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_kelurahan}`. Prakiraan 3 hari, interval 3 jam (suhu, kelembapan, kondisi cuaca, angin, tutupan awan, jarak pandang). Batas ±60 request/menit per IP. Contoh adm4: `31.71.01.1001` (Gambir). | ✅ |
| Portal Data Terbuka BMKG | https://data.bmkg.go.id/prakiraan-cuaca · contoh kode: https://github.com/infoBMKG/data-cuaca | ✅ |
| Peringatan dini cuaca BMKG (CAP) | Tersedia di data.bmkg.go.id. Opsional untuk menaikkan level risiko | 🔎 |
| Open-Meteo Forecast | `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&daily=precipitation_sum&timezone=Asia/Jakarta&forecast_days=3`. Gratis non-komersial, tanpa key | 🔎 cek ketentuan |
| Open-Meteo Historical | `https://archive-api.open-meteo.com/v1/archive?...&start_date=2016-01-01&end_date=2025-12-31&daily=precipitation_sum` | 🔎 |

## 2. Data Banjir Jakarta
| Sumber | Isi | Status |
|---|---|---|
| Metro TV / Antara, 6 Nov 2026: "BPBD DKI Sebut 200 RW di Jakarta Rawan Banjir" | ±200 RW rawan banjir & genangan; contoh: Rawa Buaya, Tegal Alur (Jakbar), Cawang, Kampung Melayu, Cililitan (Jaktim) | ✅ https://www.metrotvnews.com/read/Ky6CqRdm-bpbd-dki-sebut-200-rw-di-jakarta-rawan-banjir |
| Tirto: "Sepertiga Kelurahan di DKI Jakarta Rawan Banjir" | Data BPBD 2017/2018: 82 dari 262 kelurahan rawan, tersebar di 31 kecamatan | ✅ https://tirto.id/sepertiga-kelurahan-di-dki-jakarta-rawan-banjir-c9Um |
| Republika (2019): 86 RW rawan banjir | Daftar per kecamatan/kelurahan dari rencana kontingensi BPBD | ✅ https://news.republika.co.id/berita/pz42sk430/86-rw-di-jakarta-rawan-banjir |
| Rilis kejadian banjir 2025–2026 (Antara, Katadata, Detik, Metro TV, Tirto) | Contoh: 3 Mar 2025 (Kampung Melayu 250 cm, Cawang 300 cm); 22–23 Jan 2026 (±130 RT); 8 Mar 2026 (75 RT, Cipete Utara & Pela Mampang 1,7 m) | ✅ (lihat berita), kurasi ke CSV |
| BPBD DKI Jakarta (situs, X @BPBDJakarta, Pusdatin) | Data genangan real-time & historis | 🔎 |
| Portal Satu Data Jakarta | Dataset RW rawan banjir, lokasi pengungsian | 🔎 |
| Kontak darurat | **112 Jakarta Siaga** | ✅ (Berita Jakarta) |

## 3. Wilayah & Peta
| Sumber | Status |
|---|---|
| Kode wilayah Kemendagri (Kepmendagri No. 100.1.1-6117 Tahun 2022), dataset publik di GitHub (mis. `cahyadsn/wilayah`) | 🔎 |
| GeoJSON batas kecamatan DKI | 🔎 |
| OpenStreetMap tiles (atribusi wajib) | ✅ umum |

## 4. Pedoman untuk RAG (kandidat)
| Dokumen | Penerbit | Status |
|---|---|---|
| Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana | BNPB | 🔎 |
| Panduan/Pedoman Kesiapsiagaan Bencana untuk Keluarga | BNPB | 🔎 |
| Materi kesiapsiagaan banjir & tas siaga bencana | BPBD DKI Jakarta | 🔎 |
| Rencana kontingensi banjir DKI (bagian publik) | BPBD DKI | 🔎 |
| Panduan keselamatan listrik saat banjir | PLN | 🔎 |
| Informasi banjir rob & perubahan iklim | BMKG | 🔎 |

Kriteria: resmi (pemerintah/lembaga), berbahasa Indonesia, boleh diakses publik. Simpan URL asli di `data/pedoman/index.json` agar sitasi bisa diklik.

## 5. Teknologi
| Topik | Catatan | Status |
|---|---|---|
| Next.js 16 | Major stabil sejak Okt 2025; Turbopack default; Node ≥ 20 | ✅ |
| Gemini API | Daftar model berubah cepat; pilih Flash stabil yang tersedia di free tier (cek AI Studio). Embedding: `gemini-embedding-001` | ✅ |
| Gemini free tier | Kuota per menit/hari, dipangkas sejak Des 2025; angka pasti hanya di AI Studio; data free tier dapat dipakai Google | ✅ |
| Groq | Free tier per model (contoh: 30 RPM / 1.000 RPD untuk model teks tertentu); kompatibel OpenAI | ✅ |
| xAI Grok | Tidak punya free tier permanen | ✅ |
| Vercel AI SDK | `ai`, `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/openai-compatible` | 🔎 cek versi |
| Supabase pgvector | Ekstensi `vector`, index HNSW | ✅ umum |

## 6. Guidebook Lomba
- `GUIDEBOOK WEB DEV IT RUSH.pdf`: ringkasan di [[10 Deliverables Lomba]]. Template proposal & surat pernyataan ada di link bit.ly dalam guidebook.
