---
title: SiagaKU — Product Requirements Document
project: "[[SiagaKU]]"
type: prd
version: 1.0
status: draft
owner: Tim SiagaKU
created: 2026-11-13
tags: [siagaku, prd, it-rush-2026]
---

# PRD — SiagaKU

> **Satu kalimat:** SiagaKU membantu warga Jakarta tahu seberapa berisiko wilayahnya terhadap banjir hari ini dan apa yang harus disiapkan keluarganya, dengan AI yang menjawab dari pedoman resmi.

Terkait: [[01 Design Doc]] · [[04 Fitur & Alur Pengguna]] · [[05 Desain AI]] · [[10 Deliverables Lomba]]

---

## 1. Latar Belakang & Masalah

### 1.1 Konteks
- Jakarta adalah kota dengan risiko banjir tinggi akibat curah hujan ekstrem, luapan sungai (Ciliwung, Pesanggrahan, dll.), dan banjir rob di pesisir utara.
- BPBD DKI Jakarta (6 Nov 2026) memetakan sekitar **200 RW** yang masih rawan banjir dan genangan, antara lain di Rawa Buaya, Tegal Alur, Cawang, Kampung Melayu, dan Cililitan.
- Perubahan iklim meningkatkan frekuensi hujan ekstrem, sehingga kesiapsiagaan rumah tangga makin penting.

### 1.2 Masalah yang diselesaikan
| # | Masalah | Bukti / alasan |
|---|---|---|
| P1 | Warga tidak punya gambaran sederhana **"seberapa berisiko wilayahku hari ini"**. Info cuaca dan info rawan banjir terpisah dan teknis. | Prakiraan BMKG berupa data cuaca, daftar rawan BPBD berupa rilis berita/PDF |
| P2 | Panduan kesiapsiagaan bersifat **umum**, tidak menyesuaikan kondisi keluarga (bayi, lansia, disabilitas, hewan peliharaan). | Buku saku BNPB ditulis untuk semua orang |
| P3 | Saat bingung ("air mulai masuk, apa yang harus dilakukan?"), warga mencari di mesin pencari atau grup WA, sehingga **jawabannya tidak terverifikasi**. | Pengamatan umum |
| P4 | Informasi genangan dari warga tersebar dan **tidak terstruktur**. | Laporan lewat media sosial |
| P5 | Warga baru sadar saat air sudah naik. Tidak ada **peringatan proaktif per kelurahan** yang menggabungkan prakiraan hujan dan kerawanan wilayah. | Prakiraan BMKG harus dicek sendiri dan tidak memuat konteks rawan banjir |

### 1.3 Peluang
AI generatif bisa (a) menerjemahkan data teknis menjadi bahasa sederhana, (b) mempersonalisasi pedoman umum, (c) menjawab pertanyaan dengan dasar dokumen resmi, dan (d) menstrukturkan laporan foto.

---

## 2. Tujuan & Metrik

### 2.1 Tujuan produk
1. Warga mendapat **status risiko wilayah** dalam ≤ 3 klik.
2. Warga mendapat **rencana siaga keluarga** yang spesifik dalam ≤ 2 menit.
3. Pertanyaan kesiapsiagaan terjawab **dengan sumber**.

### 2.2 Tujuan lomba
Memaksimalkan skor di 6 kriteria juri (lihat §9).

### 2.3 Metrik keberhasilan (diukur saat uji internal)
| Metrik | Target |
|---|---|
| Waktu muat halaman wilayah (P75, 4G) | < 3 detik |
| Waktu sampai token pertama chatbot | < 3 detik |
| Waktu generate rencana siaga | < 15 detik |
| Jawaban chatbot yang menyertakan ≥ 1 sitasi (untuk pertanyaan dalam cakupan) | ≥ 90% dari 30 pertanyaan uji |
| Jawaban chatbot yang menolak dengan sopan untuk pertanyaan di luar cakupan | 100% dari 10 pertanyaan uji |
| Fitur AI tetap berjalan saat provider utama dimatikan (uji fallback) | 100% fitur teks |
| Notifikasi uji diterima setelah klik tombol | ≤ 10 detik (Chrome desktop & Android) |
| Cron peringatan selesai untuk semua kelurahan terpantau | < 60 detik per run |
| Lighthouse Accessibility (halaman utama) | ≥ 90 |
| Error JS di konsol saat skenario demo | 0 |

---

## 3. Pengguna

### 3.1 Persona

**Bu Rina (38), ibu rumah tangga, Kampung Melayu**
- Rumah di bantaran Ciliwung, punya bayi 8 bulan dan ibu mertua (70) yang memakai kursi roda.
- Kebutuhan: tahu kapan harus bersiap, dan apa saja yang perlu disiapkan untuk bayi dan lansia.
- Perangkat: HP Android kelas menengah.

**Dimas (22), mahasiswa, ngekos di Cengkareng**
- Sering terjebak genangan saat berangkat kuliah.
- Kebutuhan: cek cepat kondisi hujan dan rawan banjir, dan tahu harus berbuat apa kalau kos kebanjiran.
- Mau ikut melaporkan genangan.

**Pak Hadi (55), ketua RT, Penjaringan**
- Wilayah pesisir dengan rob.
- Kebutuhan: bahan sosialisasi kesiapsiagaan untuk warga, rencana yang bisa dicetak dan dibagikan.

### 3.2 Pengguna sekunder
- **Juri lomba:** menguji fungsionalitas, membaca kode, menilai UI/UX. Butuh akses tanpa login, data demo terisi, dan alur yang jelas.

---

## 4. Ruang Lingkup

### 4.1 In-scope (v1, sampai 20 Nov 2026)
| ID  | Fitur                                                                           | Prioritas |
| --- | ------------------------------------------------------------------------------- | --------- |
| F1  | Cek Risiko Wilayah (peta + halaman detail kecamatan)                            | **Must**  |
| F2  | Rencana Siaga Personal (AI, structured output)                                  | **Must**  |
| F3  | Tanya SiagaKU (chatbot RAG dengan sitasi)                                       | **Must**  |
| F8  | **Peringatan Dini Banjir** per kelurahan (banner in-app + Web Push, PWA ringan) | Should    |
| F4  | Lapor Banjir (upload foto + AI vision + peta laporan)                           | Could     |
| F5  | Konteks Iklim: **dipotong**, diganti kartu teks statis                          | —         |
| F6  | Halaman Tentang & Metodologi (sumber data, rumus, penggunaan AI, disclaimer)    | **Must**  |
| F7  | Tombol & banner darurat (112 Jakarta Siaga) di semua halaman                    | **Must**  |

### 4.2 Out-of-scope
Login/akun, notifikasi email/SMS/WA/Telegram, mode offline PWA, bencana selain banjir, wilayah di luar DKI, prediksi ML terlatih, aplikasi native, dashboard admin, moderasi manual laporan.

---

## 5. Kebutuhan Fungsional

### F1 — Cek Risiko Wilayah
| ID | Kebutuhan |
|---|---|
| F1.1 | Halaman `/peta` menampilkan peta Jakarta dengan 44 kecamatan, diwarnai sesuai level risiko hari ini. |
| F1.2 | Pengguna bisa mencari kecamatan lewat kolom pencarian (autocomplete) atau dengan klik di peta. |
| F1.3 | Tombol "Gunakan lokasiku" (Geolocation API) memilih kecamatan terdekat dari koordinat pengguna. Jika izin ditolak, tampil pesan dan fallback ke pencarian. |
| F1.4 | Halaman `/wilayah/[slug]` menampilkan: skor (0–100) dan level; komponen skor (kerawanan dasar dan faktor hujan) dengan penjelasan; prakiraan cuaca BMKG 3 hari; curah hujan maksimum 3 hari (mm); riwayat banjir (tanggal, kelurahan, tinggi air, sumber); titik aman/posko terdekat; label "rawan rob" untuk wilayah pesisir. |
| F1.5 | **Penjelasan AI** (2–4 kalimat bahasa sederhana) tentang arti risiko hari ini dan satu tindakan utama. Di-cache 3 jam per kecamatan. Jika AI gagal, tampil teks template berbasis level. |
| F1.6 | Setiap angka menampilkan sumber dan waktu pembaruan ("BMKG, diperbarui 14.00 WIB"). |
| F1.7 | Jika BMKG/Open-Meteo gagal, tampilkan data cache terakhir dengan label "data terakhir: …". Jika tidak ada cache, skor hanya dari kerawanan dasar dengan label "tanpa data hujan". |
| F1.8 | CTA dari halaman wilayah: "Buat rencana siaga untuk wilayah ini" (pra-isi kecamatan) dan "Tanya SiagaKU". |

### F2 — Rencana Siaga Personal
| ID | Kebutuhan |
|---|---|
| F2.1 | Form 3 langkah: (1) wilayah (kecamatan; jenis hunian: rumah tapak 1 lantai / bertingkat / kos / apartemen; lantai unit), (2) anggota keluarga (jumlah dewasa, anak, balita/bayi, lansia, ibu hamil, penyandang disabilitas dengan jenis kebutuhan, orang dengan obat rutin, hewan peliharaan), (3) kondisi (punya kendaraan, jarak ke sungai: dekat/sedang/jauh/tidak tahu, pernah kebanjiran: ya/tidak). |
| F2.2 | Tidak ada field nama, alamat lengkap, atau nomor HP. |
| F2.3 | Output terstruktur: ringkasan risiko; checklist tas siaga (item, jumlah, untuk siapa, prioritas); langkah **sebelum / saat / setelah** banjir; catatan khusus per kelompok rentan; titik evakuasi (2–3, **dipilih dari DB**); kontak darurat (**dari DB**). |
| F2.4 | Checklist bisa dicentang (state disimpan di localStorage per slug). |
| F2.5 | Rencana disimpan dengan URL unik `/rencana/[slug]`, dengan tombol Salin link, Bagikan ke WhatsApp (`wa.me/?text=`), dan Cetak / Simpan PDF (CSS print). |
| F2.6 | Validasi output dengan zod. Jika tidak valid, retry 1x, lalu fallback provider. Jika semuanya gagal, tampilkan rencana template statis berbasis profil (rule-based) dengan label "rencana dasar". |
| F2.7 | Loading state bertahap: "Membaca risiko wilayah…", "Menyusun checklist…", "Menyesuaikan untuk anggota keluarga…". |

### F3 — Tanya SiagaKU (Chatbot RAG)
| ID | Kebutuhan |
|---|---|
| F3.1 | Halaman `/tanya` dan widget mengambang (tombol chat di pojok) di semua halaman kecuali `/tanya`. |
| F3.2 | Jawaban di-*stream*, dalam Bahasa Indonesia sederhana, berupa poin-poin bila langkah-langkah. |
| F3.3 | Setiap jawaban berbasis dokumen menampilkan sitasi bernomor [1], [2] dan daftar sumber (judul dokumen, penerbit, halaman, tautan). |
| F3.4 | Pertanyaan di luar cakupan (bukan banjir/kesiapsiagaan) ditolak dengan sopan dan diarahkan kembali. |
| F3.5 | **Deteksi darurat** (rule-based, sebelum AI): kata kunci seperti "tolong", "terjebak", "air sudah masuk", "hanyut", "tenggelam", "darurat" memunculkan kartu darurat merah: **Telepon 112** + langkah keselamatan singkat statis. AI tetap menjawab di bawahnya. |
| F3.6 | Konteks wilayah opsional: jika pengguna datang dari halaman wilayah, chatbot tahu kecamatan dan level risikonya. |
| F3.7 | Saran pertanyaan (chips) di layar kosong, misalnya "Apa isi tas siaga?", "Kapan harus mengungsi?", "Cara mengamankan listrik saat banjir?", "Apa itu banjir rob?". |
| F3.8 | Riwayat percakapan hanya di sisi klien (state). Maksimum 10 pesan terakhir dikirim ke server. |
| F3.9 | Jika retrieval tidak menemukan dokumen relevan, AI menjawab dari pengetahuan umum **dengan label** "Jawaban umum, tidak dari dokumen resmi". |

### F8 — Peringatan Dini Banjir (Should)
| ID | Kebutuhan |
|---|---|
| F8.1 | Halaman `/peringatan` dan tombol "🔔 Pantau wilayah ini" di halaman wilayah. Pengguna memilih **kelurahan** (autocomplete 267 kelurahan DKI, atau "Gunakan lokasiku" → kelurahan terdekat ≤ 5 km). |
| F8.2 | **Banner (A):** kelurahan pantauan disimpan di `localStorage` (`siagaku:pantau`). Di setiap halaman, header menampilkan banner jika status kelurahan itu **Siaga** atau **Awas**: "⚠️ Potensi banjir di Ceger · hujan lebat diperkirakan 15.00–18.00 WIB · [Lihat langkah]". |
| F8.3 | **Web Push (B):** tombol "Aktifkan notifikasi" → izin browser → subscription disimpan di server bersama kode kelurahan. Tidak ada data identitas. |
| F8.4 | **Tombol "Kirim notifikasi uji"** mengirim notifikasi contoh dalam ≤ 10 detik, agar juri bisa mencoba tanpa menunggu hujan. |
| F8.5 | **Logika status** (rule-based, dihitung per kelurahan dari prakiraan BMKG 24 jam ke depan): lihat [[06 Data & Database#7. Logika Peringatan Dini]]. Status: **Normal**, **Waspada**, **Siaga**, **Awas**. Push hanya untuk **Siaga** dan **Awas**. |
| F8.6 | Pengecekan otomatis **tiap jam** (GitHub Actions → `/api/cron/peringatan`). Dedupe: maksimal 1 notifikasi per subscription per 6 jam, kecuali status naik (Siaga → Awas). |
| F8.7 | Isi notifikasi: judul "⚠️ Potensi banjir di {kelurahan}", isi "{kategori hujan} diperkirakan {jam mulai}–{jam selesai} WIB. Siapkan tas siaga & pantau info BMKG/BPBD." Klik → `/wilayah/{slug kecamatan}?kel={kode}`. Teks dari template (bukan AI). |
| F8.8 | Pengguna bisa **berhenti memantau** (unsubscribe), yang menghapus subscription di server. Subscription yang ditolak push service (404/410) dihapus otomatis. |
| F8.9 | **PWA ringan:** `manifest` (nama, ikon 192/512, warna tema), service worker untuk `push` & `notificationclick`. Untuk iPhone: tampilkan panduan "Tambahkan ke Layar Utama" jika `PushManager` tidak tersedia. |
| F8.10 | Disclaimer di halaman & notifikasi: "Potensi, bukan kepastian. Peringatan resmi tetap dari BMKG & BPBD DKI." |
| F8.11 | Browser tanpa dukungan push / izin ditolak: banner (A) tetap jalan, dengan pesan cara mengaktifkan izin. |

### F4 — Lapor Banjir (Could)
| ID | Kebutuhan |
|---|---|
| F4.1 | Halaman `/lapor`: unggah 1 foto (jpg/png/webp, dikompres di klien ≤ 1 MB, maks dimensi 1600 px), lokasi (GPS atau pin di peta), deskripsi opsional (≤ 280 karakter). |
| F4.2 | Foto diunggah langsung ke Supabase Storage lewat signed URL, lalu server memanggil AI vision. |
| F4.3 | Hasil AI: apakah foto banjir/genangan (bool), tingkat keparahan (1 Genangan ringan < 30 cm · 2 Sedang 30–70 cm · 3 Tinggi 70–150 cm · 4 Sangat tinggi > 150 cm), estimasi tinggi air, ringkasan 1 kalimat, confidence. |
| F4.4 | Foto yang bukan banjir ditandai `ditolak` dan tidak tampil di peta publik. Pengguna mendapat pesan ramah. |
| F4.5 | Halaman `/laporan` (atau layer di `/peta`): marker laporan 72 jam terakhir + laporan demo (label "Contoh"). |
| F4.6 | Rate limit: 5 laporan per IP per jam. EXIF lokasi dihapus di klien sebelum upload. |
| F4.7 | Disclaimer: "Laporan warga belum diverifikasi petugas." |

### F5 — Konteks Iklim (DIPOTONG 13 Nov, diganti kartu teks statis)
| ID | Kebutuhan |
|---|---|
| F5.1 | Kartu di halaman wilayah: grafik batang jumlah hari hujan lebat (≥ 50 mm) per tahun 2016–2025 untuk **kota administrasi** kecamatan tersebut. |
| F5.2 | Kalimat penjelasan dihasilkan AI sekali saat seeding (bukan per request) dan disimpan. Contoh: "Dalam 10 tahun terakhir, Jakarta Timur rata-rata mengalami X hari hujan lebat per tahun…". |
| F5.3 | Catatan metodologi: data reanalysis (Open-Meteo/ERA5), resolusi kasar, hanya indikasi tren. |

### F6 — Tentang & Metodologi
- Rumus skor risiko lengkap dan bobotnya; daftar sumber data dengan tautan; cara kerja AI (RAG, fallback); **penggunaan library, aset, dan AI coding assistant** (wajib menurut guidebook); disclaimer; tim.

### F7 — Darurat
- Tombol "Darurat" di header (merah) membuka modal: **112 Jakarta Siaga** (tap-to-call `tel:112`), kontak lain dari DB, dan 5 langkah keselamatan saat banjir (teks statis, bersumber).

---

## 6. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Keandalan** | Fallback AI 3 tingkat (Gemini → Groq → alternatif); setiap fitur AI punya fallback non-AI (template); data eksternal di-cache; halaman tidak boleh crash karena satu sumber gagal (error boundary per kartu). |
| **Performa** | Server Components untuk halaman data; peta di-load dinamis (`ssr:false`); gambar dioptimasi; target LCP < 2,5 detik. |
| **Responsif** | Mobile-first; diuji di 360 px, 768 px, dan 1280 px. |
| **Aksesibilitas** | Kontras WCAG AA; level risiko memakai **warna + teks + ikon** (tidak hanya warna); navigasi keyboard; label form; `aria-live` untuk stream chat. |
| **Keamanan** | API key hanya di server (env Vercel); RLS aktif; validasi input zod di semua route; rate limit; sanitasi markdown output AI (tanpa HTML mentah); header keamanan dasar. |
| **Privasi** | Tanpa akun; tanpa data identitas; IP di-hash; EXIF dihapus; pemberitahuan bahwa input dikirim ke penyedia AI. |
| **Kualitas kode** | TypeScript strict; ESLint + Prettier; struktur folder rapi; unit test untuk fungsi murni (skor, router AI, deteksi darurat); conventional commits; CI GitHub Actions (lint + typecheck + test). |
| **Ketersediaan** | Live sampai minimal 30 Nov 2026; cron keep-alive harian; monitoring sederhana via `/api/health`. |
| **Bahasa** | UI Bahasa Indonesia. |

---

## 7. Asumsi & Ketergantungan
- API BMKG publik dan Open-Meteo tetap tersedia selama periode lomba.
- Kuota gratis Gemini dan Groq cukup untuk pengembangan; billing atau provider alternatif disiapkan untuk penjurian.
- Data rawan dan riwayat banjir bisa dikurasi dari sumber publik dalam 1–2 hari.
- Tim punya akses ke akun GitHub, Vercel, Supabase, Google AI Studio, dan Groq.

## 8. Risiko Utama
Ringkasan; detail di [[11 Risiko & Mitigasi]].
1. Kuota AI habis saat penjurian → fallback + billing/alternatif + cache.
2. Data kurasi tidak lengkap → target minimum data, label "perkiraan".
3. Skop melebar → garis potong MoSCoW dan code freeze 19 Nov 12.00.
4. AI berhalusinasi info keselamatan → data keselamatan dari DB, sitasi, prompt ketat, uji 40 pertanyaan.

---

## 9. Pemetaan ke Kriteria Juri

| Kriteria (bobot) | Bagaimana SiagaKU menjawab | Bukti yang ditunjukkan |
|---|---|---|
| Fungsionalitas & Kualitas Teknis (25%) | 3 fitur inti stabil + peringatan dini push, fallback berlapis, cache, tanpa login | Demo live; uji fallback di video |
| Inovasi & Ketepatan Solusi (20%) | Peringatan dini proaktif per kelurahan (PWA push), RAG dengan sitasi pedoman resmi, rencana siaga terpersonalisasi untuk kelompok rentan, AI vision untuk laporan, data keselamatan anti-halusinasi | Proposal bagian solusi, video |
| Relevansi Tema & Dampak (15%) | Banjir Jakarta = mitigasi + iklim (hujan ekstrem, rob); kartu tren iklim | Latar belakang berbasis data BPBD |
| UI/UX (15%) | Mobile-first, 3 klik ke informasi, bahasa sederhana, aksesibel | Screenshot, Lighthouse |
| Kualitas Source Code (15%) | TS strict, struktur modular, test, CI, README lengkap, data CSV transparan | Repo GitHub |
| Dokumentasi (10%) | Proposal sesuai template, video 3–5 menit, README dengan arsitektur & kredit AI | Deliverables |

---

## 10. Rilis & Milestone

| Milestone | Tanggal | Isi |
|---|---|---|
| M0 Setup | Jum 13 Nov (malam) | Repo, akun, env, skeleton deploy |
| M1 Data & Fondasi | Sab 14 Nov | Skema DB, seed kecamatan, layout, router AI, kurasi data dimulai |
| M2 Fitur inti alpha | Min 15 – Sen 16 Nov | F1, F2, F3 jalan end-to-end (kasar) |
| M3 Fitur inti beta | Sel 17 Nov | Polishing F1–F3, F6, F7, eval |
| M3b Peringatan Dini | Rab 18 Nov | F8 banner + Web Push + PWA; F4 jika sempat |
| M4 Feature freeze | **Kam 19 Nov 12.00** | F8/F4 masuk atau dipotong; hanya bug fix |
| M5 Submit | **Jum 20 Nov, target 20.00** (batas 23.59) | Video, proposal, surat, form |

Detail: [[09 Timeline & Pembagian Tugas]].

## 11. Pertanyaan Terbuka
Lihat [[11 Risiko & Mitigasi#Pertanyaan terbuka]].
