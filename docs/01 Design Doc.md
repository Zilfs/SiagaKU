---
title: SiagaKU — Design Doc
project: "[[SiagaKU]]"
type: design-doc
status: draft
created: 2026-11-13
tags: [siagaku, lomba, it-rush-2026, design]
---

# SiagaKU — Design Doc

> [!info] Konteks
> Dokumen ini adalah hasil sesi brainstorming 13 November 2026. Ini adalah sumber kebenaran untuk *apa* yang dibangun dan *kenapa*. Detail produk ada di [[02 PRD]], detail teknis di [[03 Arsitektur Sistem]] dan dokumen turunannya.

## 1. Intent & Kenapa

**SiagaKU** adalah web app kesiapsiagaan banjir untuk warga **DKI Jakarta**. Warga bisa mengecek seberapa berisiko wilayahnya hari ini, mendapat rencana siaga yang dipersonalisasi AI untuk keluarganya, dan bertanya ke chatbot yang jawabannya bersumber dari pedoman resmi.

**Kenapa dibangun:** untuk lomba **Web Development IT RUSH 2026** (HIMATIF UNIB), subtema **Mitigasi Bencana dan Perubahan Iklim**. Lomba mewajibkan integrasi AI di dalam fitur. Lihat [[10 Deliverables Lomba]].

**Kenapa banjir Jakarta:**
- Banjir adalah bencana paling sering dan paling terasa di Jakarta. BPBD DKI (6 Nov 2026) memetakan sekitar 200 RW yang masih rawan banjir dan genangan menjelang musim hujan.
- Banjir menghubungkan dua sisi subtema: **mitigasi bencana** (kesiapsiagaan) dan **perubahan iklim** (hujan ekstrem makin sering, banjir rob di pesisir utara).
- Tim kuliah di Jakarta (UPNVJ), jadi ceritanya autentik untuk video dan proposal.
- Data publik tersedia: prakiraan cuaca BMKG per kelurahan, data curah hujan Open-Meteo, rilis BPBD DKI.

**Seperti apa sukses itu:**
- Juri membuka website, memilih kecamatan, dan dalam kurang dari 1 menit melihat risiko hari ini, membuat rencana siaga, dan bertanya ke chatbot, **tanpa error dan tanpa login**.
- Fitur AI terasa *menyelesaikan masalah*, bukan tempelan: rencana siaga sesuai profil keluarga, jawaban chatbot mengutip sumber, dan laporan foto dianalisis otomatis.
- Semua deliverable terkumpul sebelum **20 November 2026 pukul 23.59 WIB**.

## 2. Goals, Non-goals, Anti-goals

### Goals
1. **Cek Risiko Wilayah:** skor risiko banjir per kecamatan (44 kecamatan DKI) dari kerawanan historis + prakiraan hujan, ditampilkan di peta dan halaman detail.
2. **Rencana Siaga Personal (AI):** form profil keluarga, lalu rencana terstruktur (checklist tas siaga, langkah sebelum/saat/setelah banjir, titik evakuasi terdekat, kontak darurat). Bisa dibagikan lewat link dan dicetak.
3. **Tanya SiagaKU (AI + RAG):** chatbot kesiapsiagaan banjir yang menjawab dari pedoman resmi (BNPB, BPBD DKI) dan mengutip sumbernya.
4. **Peringatan Dini Banjir (F8)** *(Should; ditambahkan 13 Nov)*: warga memilih **kelurahan** yang dipantau (mis. Ceger). Jika prakiraan BMKG 24 jam ke depan menunjukkan hujan cukup lebat **dan** wilayahnya rawan, warga mendapat (a) **banner peringatan** di aplikasi dan (b) **notifikasi browser (Web Push)** walau situs ditutup. SiagaKU menjadi **PWA ringan** (manifest + service worker) agar notifikasi bisa jalan, termasuk di iPhone lewat "Add to Home Screen". Ada tombol **"Kirim notifikasi uji"** untuk juri.
5. **Lapor Banjir (AI vision)** *(Could; turun dari Should)*: warga mengunggah foto genangan, AI menilai jenis dan tingkat keparahan, lalu laporan muncul di peta.
6. ~~**Konteks iklim:** kartu tren hujan ekstrem~~ **Dipotong** (13 Nov) demi F8. Diganti kartu teks statis "konteks iklim" di halaman wilayah.

### Non-goals (sengaja tidak dibuat)
- Login atau akun pengguna (untuk warga maupun admin).
- Notifikasi email, SMS, WhatsApp, atau Telegram (hanya Web Push + banner).
- Mode offline penuh PWA (service worker hanya untuk push).
- Bencana selain banjir; wilayah di luar DKI Jakarta.
- Prediksi banjir dengan model ML terlatih (lihat Pendekatan C).
- Aplikasi mobile native.
- Dashboard petugas atau alur verifikasi laporan oleh admin.

### Anti-goals (gagal walau "jalan")
- **Fitur AI mati saat dinilai juri** karena kuota habis atau API error tanpa fallback.
- **AI mengarang fakta keselamatan:** nomor darurat palsu, posko evakuasi fiktif, atau saran berbahaya.
- **Mengklaim memprediksi banjir.** Skor harus disajikan sebagai *estimasi risiko untuk kesiapsiagaan*, lengkap dengan disclaimer dan metodologi.
- **Juri terhambat** oleh login, layar kosong (data belum di-seed), loading lebih dari 10 detik tanpa feedback, atau tampilan rusak di mobile.
- **Repo berantakan:** API key bocor di repo, commit history di-rewrite (dilarang aturan lomba), README kosong.

## 3. Constraints

| Constraint | Sumber | Dampak ke desain |
|---|---|---|
| Deadline 20 Nov 2026 23.59 WIB (~7 hari) | Guidebook | Skop ketat, MoSCoW, no-login |
| Website wajib live sampai 30 Nov 2026 | Guidebook | Hosting gratis yang stabil (Vercel + Supabase); Supabase free project bisa *pause* jika idle, jadi perlu keep-alive |
| Repo publik, riwayat commit tidak boleh dimanipulasi | Guidebook | Jangan pernah `push --force`/rebase di `main`; secret hanya di env |
| Wajib integrasi AI | Guidebook | 3–4 titik AI nyata |
| Penggunaan template/library/AI coding assistant wajib dicantumkan | Guidebook | Bagian "Kredit & Penggunaan AI" di README dan proposal |
| Penjurian daring asinkron, juri menguji sendiri | Guidebook | Keandalan > jumlah fitur; data demo harus sudah terisi |
| Bobot: Fungsionalitas 25, Inovasi 20, Relevansi 15, UI/UX 15, Kode 15, Dokumentasi 10 | Guidebook | Lihat pemetaan di [[02 PRD#Pemetaan ke kriteria juri]] |
| Kuota gratis Gemini terbatas dan bisa berubah | Riset 13 Nov | Fallback Groq, cache, rate limit per IP |
| Budget ≈ Rp0 (kecuali biaya daftar Rp75.000) | Asumsi | Semua layanan tier gratis; opsi billing Gemini sebagai asuransi saat penjurian |
| Tim 4 orang, mahasiswa | Konteks | Pembagian per area, lihat [[09 Timeline & Pembagian Tugas]] |

## 4. Pendekatan yang Dipertimbangkan

| | A. Monolit Next.js + RAG di Supabase | B. Monolit tanpa vector DB | C. Next.js + FastAPI ML |
|---|---|---|---|
| Ringkasan | Satu app Next.js; data risiko dikurasi di Postgres; chatbot RAG (pgvector) | Semua pedoman dimasukkan ke prompt (long context) | Layanan Python terpisah dengan model ML prediksi risiko |
| Kelebihan | Hemat kuota, fallback ke Groq tetap muat, RAG nyata dengan sitasi, satu deploy | Paling cepat dibuat | Kesan "AI" paling kuat |
| Kekurangan | Butuh ±½ hari pipeline ingest | Token boros, kuota cepat habis, fallback sulit, terlihat seperti "membungkus API" | 2 deployment, data latih sulit, berisiko gagal dalam 7 hari |
| Keputusan | **Dipilih** | Ditolak | Ditolak |

**Dipilih: A**, oleh tim (13 Nov). Alasannya: menyeimbangkan keandalan saat juri menguji langsung (bobot 25%) dengan teknik AI yang bisa dibanggakan (bobot 20%), tanpa memaksakan skop.

## 5. Keputusan "How" yang Sudah Ditetapkan

| Area | Keputusan | Diputuskan oleh |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript**, deploy di **Vercel** | Tim |
| Data & storage | **Supabase**: Postgres, Storage (foto laporan), **pgvector** (RAG) | Tim |
| LLM utama | **Google Gemini (Flash)** | Tim |
| LLM fallback | **Groq**, otomatis saat Gemini 429/5xx/timeout | Tim |
| Peta | **Leaflet** (react-leaflet) + tile OpenStreetMap | Tim |
| Wilayah & bencana | **Banjir, DKI Jakarta**, granularitas **kecamatan** | Tim |
| Login | **Tidak ada** | Tim |
| Peringatan | **Banner in-app + Web Push (PWA ringan)**, granularitas **kelurahan** | Tim (13 Nov) |
| Arsitektur | Pendekatan A | Tim |

## 6. Keputusan yang Diambil Claude (bisa dikoreksi)

| Area | Keputusan | Alasan |
|---|---|---|
| SDK AI | **Vercel AI SDK** (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`) | Satu interface untuk dua provider, jadi fallback cukup ganti model; mendukung streaming chat dan structured output (zod) |
| Model id | Dibaca dari env (`GEMINI_MODEL`, `GROQ_MODEL`, dll.), **tidak di-hardcode** | Nama model Gemini sering berganti; pilih Flash stabil yang tersedia di free tier saat setup |
| Embedding | `gemini-embedding-001`, dimensi output 768 | Stabil, kecil di DB; fallback retrieval = Postgres full-text search |
| Data cuaca | **BMKG** (prakiraan resmi, ditampilkan) + **Open-Meteo** (angka curah hujan mm untuk skor dan data historis iklim) | BMKG adalah sumber resmi untuk publik; Open-Meteo memberi angka presipitasi numerik dan arsip 10 tahun |
| Skor risiko | Rumus transparan berbobot (bukan ML), lihat [[06 Data & Database#Rumus skor risiko]] | Bisa dijelaskan dan dipertanggungjawabkan; sesuai anti-goal |
| Anti-halusinasi | Posko evakuasi dan kontak darurat **diambil dari database**; AI hanya memilih dan menjelaskan, tidak mengarang | Keselamatan |
| Simpan rencana | Disimpan di DB dengan slug acak; bisa dibuka lewat link `/rencana/[slug]` | Tanpa login tetap bisa dibagikan ke keluarga |
| Peta v1 | Marker lingkaran per kecamatan (centroid) berwarna sesuai level; polygon choropleth jika GeoJSON batas kecamatan didapat di hari 1 | Mengurangi risiko data |
| Styling | Tailwind CSS + shadcn/ui | Cepat, konsisten, aksesibel |
| Bahasa UI | Bahasa Indonesia | Target pengguna dan juri |
| Proteksi kuota | Rate limit per IP (hash) di Postgres, cache jawaban chat FAQ, cache penjelasan risiko 3 jam | Anti-goal "AI mati saat dinilai" |
| Data demo | Seed laporan contoh (diberi label "contoh") dan riwayat banjir | Juri tidak melihat layar kosong |
| Peringatan: logika | Rule-based (bukan ML): kerawanan kelurahan + hujan BMKG 24 jam; teks notifikasi **template** (tanpa AI, agar cron andal & hemat kuota); dedupe 6 jam | Andal, jujur, bisa dijelaskan |
| Peringatan: jadwal | **GitHub Actions terjadwal tiap jam** memanggil `/api/cron/peringatan` | Cron Vercel paket gratis terbatas frekuensinya; GitHub Actions gratis untuk repo publik |
| Keep-alive | Vercel Cron harian memanggil `/api/health` (yang melakukan query DB) | Mencegah Supabase free project ter-pause sebelum 30 Nov |

### Prioritas & Garis Potong (keputusan Claude)

| Prioritas | Fitur | Aturan |
|---|---|---|
| **Must** | F1 Cek Risiko, F2 Rencana Siaga, F3 Tanya SiagaKU | Harus stabil sebelum fitur lain disentuh |
| **Should** | F8 Peringatan Dini (banner + Web Push + PWA) | Mulai hari ke-5 **hanya jika** F1–F3 lolos uji end-to-end. Banner (A) dikerjakan dulu, Web Push (B) menyusul |
| **Could** | F4 Lapor Banjir | Hanya jika F8 selesai sebelum Kamis pagi |
| **Dipotong** | F5 Tren iklim | Diganti kartu teks statis "konteks iklim" |

**Code freeze fitur:** Kamis 19 Nov pukul 12.00 WIB. Setelah itu hanya perbaikan bug, rekaman video, dan dokumen.

### Jawaban tim atas pertanyaan builder (13 Nov)

- **Kapasitas tim:** pembagian peran belum ditetapkan dan akan menyesuaikan. Karena itu [[09 Timeline & Pembagian Tugas]] disusun per **jalur kerja (workstream)**, bukan per nama. Tim tinggal mengisi siapa yang memegang jalur mana.
- **Billing AI:** tim siap mengaktifkan billing Gemini bila perlu, atau memakai penyedia alternatif (gateway API pihak ketiga yang kompatibel dengan format OpenAI). Konsekuensinya, router AI mendukung **3 tingkat provider**: Gemini → Groq → *provider alternatif opsional* (`@ai-sdk/openai-compatible`, diatur lewat env). Proteksi kuota cukup tingkat menengah (cache, rate limit per IP, log) tanpa perlu pemantauan manual 24 jam.

### Ketersediaan data (keputusan Claude)

- Data rawan dan riwayat banjir **belum terkumpul**, jadi diasumsikan kurasi manual di hari 1–2 (lihat [[06 Data & Database#1. Sumber Data]]). Rilis BPBD berbasis RW/kelurahan dipetakan ke kecamatan induknya.
- **Posko evakuasi:** jika daftar resmi tidak ditemukan, pakai titik aman umum (kantor kelurahan/kecamatan, sekolah, masjid besar) yang ditandai **"perkiraan lokasi aman, konfirmasi ke kelurahan"** (`terverifikasi=false`). Tidak pernah diklaim sebagai posko resmi.
- **Pedoman RAG** dikumpulkan di hari 1. Kandidat ada di [[12 Referensi & Sumber Data]].

## 7. Ringkasan Desain

```
Browser (Next.js RSC + client components)
  │
  ├─ /peta, /wilayah/[slug]  ──►  /api/risiko/[id] ──► Supabase (kecamatan, riwayat, iklim)
  │                                              └──► BMKG + Open-Meteo (cache 1–3 jam)
  │                                              └──► AI: penjelasan risiko (cache 3 jam)
  ├─ /rencana                ──►  /api/rencana     ──► AI structured output + posko dari DB
  ├─ /tanya                  ──►  /api/chat        ──► embed query → pgvector top-k → AI stream
  ├─ /peringatan             ──►  /api/push/*      ──► push_subscription
  │   GitHub Actions (tiap jam) ─► /api/cron/peringatan ─► BMKG per kelurahan → skor → web-push
  └─ /lapor                  ──►  /api/laporan     ──► Storage + AI vision → tabel laporan
                                          │
                           lib/ai/router.ts: Gemini ──(429/5xx/timeout)──► Groq
```

Detail di [[03 Arsitektur Sistem]], [[04 Fitur & Alur Pengguna]], [[05 Desain AI]], [[06 Data & Database]], [[07 API Spec]], dan [[08 UI-UX]].

## 8. Diserahkan ke Builder

- Library komponen spesifik di luar shadcn/ui, ikon, dan font.
- Struktur folder internal di bawah `src/` (ikuti saran di [[03 Arsitektur Sistem]], boleh disesuaikan).
- Copywriting final UI (draf ada di [[08 UI-UX]]).
- Pemilihan model Gemini/Groq persis, sesuai yang tersedia di free tier saat setup.
- Ukuran chunk RAG dan threshold similarity, disetel berdasarkan hasil uji.
- Tampilan visual detail (palet sudah diusulkan di [[08 UI-UX]]).

## 9. Pertanyaan Terbuka

Lihat [[11 Risiko & Mitigasi#Pertanyaan terbuka]].
