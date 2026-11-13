---
title: SiagaKU — Deliverables Lomba IT RUSH 2026
project: "[[SiagaKU]]"
type: checklist
status: draft
created: 2026-11-13
tags: [siagaku, lomba, it-rush-2026, deliverables]
---

# Deliverables Lomba IT RUSH 2026

Sumber: Guidebook Web Dev IT RUSH 2026 (HIMATIF UNIB). Terkait: [[09 Timeline & Pembagian Tugas]]

## 1. Ringkasan Aturan Penting
- Peserta: mahasiswa aktif S1 sederajat, tim 2–4 orang, satu ketua.
- Satu tim, satu subtema, maksimal 1 karya. Karya orisinal, belum pernah juara, tidak sedang diikutkan lomba lain.
- **Website wajib live & publik** (Vercel/Netlify/cPanel, dll.) dan aktif **sampai 30 Nov 2026**.
- **Repo GitHub/GitLab publik**, riwayat commit **tidak boleh dihapus/dimanipulasi**.
- Tech stack bebas. **Template, library, aset open-source, dan AI coding assistant boleh, tapi wajib dicantumkan di proposal dan README.**
- Jika ada login, akun demo wajib di proposal. SiagaKU tanpa login, jadi tulis "Tidak memerlukan login".
- Dilarang SARA, pornografi, judi, malware, konten melanggar hukum (relevan untuk moderasi foto laporan).
- Penjurian daring asinkron tanpa presentasi: juri menguji live website, membaca kode, menonton video, membaca proposal.

## 2. Timeline Lomba
| Tahap | Tanggal |
|---|---|
| Pendaftaran & pengumpulan Gelombang 2 | 7 – **20 Nov 2026, 23.59 WIB** |
| Penjurian | 28 – 29 Nov 2026 |
| Pengumuman | 30 Nov 2026 |

## 3. Checklist Berkas (Google Form)

### Bagian A
- [ ] Scan KTM seluruh anggota

### Bagian B
- [ ] Bukti bayar Gelombang 2 (Rp75.000/tim). Rekening dan link form ada di guidebook.
- [ ] Bukti follow IG @it.rush2026 dan @himatif.unib (semua anggota)
- [ ] Bukti unggah Twibbon (semua anggota)

### Bagian C
- [ ] Link live website: `https://…vercel.app`
- [ ] Link repo publik
- [ ] Link video demo YouTube **Unlisted** (3–5 menit)
- [ ] Proposal PDF: `ITRUSH26_NamaTim_SiagaKU.pdf` (pakai **template resmi** dari guidebook)
- [ ] Surat Pernyataan Orisinalitas dan AI (PDF, template resmi)

## 4. Bobot Penilaian & Strategi

| Kriteria | Bobot | Strategi |
|---|---|---|
| Fungsionalitas & Kualitas Teknis | 25% | Golden path tanpa error; fallback AI; tidak ada layar kosong |
| Inovasi & Ketepatan Solusi | 20% | Tonjolkan RAG + sitasi, personalisasi kelompok rentan, data keselamatan anti-halusinasi, AI vision |
| Relevansi Tema & Dampak | 15% | Data BPBD/BMKG; kaitan hujan ekstrem dan rob dengan perubahan iklim; persona nyata |
| UI/UX | 15% | Mobile-first, 3 klik, bahasa sederhana, aksesibel |
| Kualitas Source Code | 15% | Struktur rapi, TS strict, test, CI, commit bermakna, data CSV transparan |
| Dokumentasi | 10% | Proposal lengkap, video jelas, README kuat |

## 5. Naskah Video Demo (target 4:00, maks 5:00)

| Waktu | Segmen | Isi | Visual |
|---|---|---|---|
| 0:00–0:20 | Perkenalan | Nama tim, anggota, kampus, judul "SiagaKU" | Kamera/slide judul |
| 0:20–0:55 | Latar belakang | Banjir Jakarta (data BPBD: ±200 RW rawan, contoh kejadian 2025–2026), hujan ekstrem & perubahan iklim, masalah P1–P3 | Slide + cuplikan berita (sebut sumber) |
| 0:55–1:15 | Solusi | SiagaKU dalam satu kalimat + 3 fitur AI | Slide arsitektur sederhana |
| 1:15–2:00 | Demo F1 | Cari "Jatinegara" → skor, penjelasan AI, cuaca BMKG, riwayat, titik aman; buka peta | Screen recording produksi |
| 2:00–2:50 | Demo F2 | Wizard: bayi + lansia kursi roda + rumah 1 lantai dekat sungai → hasil rencana → checklist → bagikan WA / cetak | Screen recording |
| 2:50–3:30 | Demo F3 | Tanya "Kapan harus mengungsi kalau ada lansia?" → jawaban + sumber BNPB; tunjukkan kartu darurat ("tolong air sudah masuk rumah") | Screen recording |
| 3:30–3:55 | Demo F8 | "Bagus di Ceger": pantau kelurahan → aktifkan notifikasi → **notifikasi uji muncul** → tunjukkan contoh banner Siaga & cara kerja (BMKG per kelurahan × kerawanan) | Screen recording (desktop + HP) |
| (opsional) | Demo F4 | Upload foto genangan → hasil analisis → peta | Screen recording |
| 3:50–4:15 | Keandalan & teknologi | Fallback Gemini → Groq (tunjukkan badge provider), stack, RAG | Slide/diagram |
| 4:15–4:30 | Penutup | Dampak, rencana pengembangan, ajakan | Slide |

Tips: rekam di 1080p, zoom browser 125%, mode mobile untuk sebagian; sembunyikan bookmark/tab pribadi; narasi direkam terpisah agar jernih; teks subtitle untuk istilah kunci.

## 6. Kerangka Proposal (sesuaikan dengan template resmi)
> Template resmi wajib diikuti. Kerangka di bawah adalah isi yang perlu disiapkan, lalu dipetakan ke bab template.

1. **Identitas tim & judul karya**
2. **Latar belakang:** banjir Jakarta (data BPBD/berita), perubahan iklim & hujan ekstrem, celah informasi warga
3. **Rumusan masalah:** P1–P4 ([[02 PRD#1.2 Masalah yang diselesaikan]])
4. **Tujuan & manfaat**
5. **Solusi:** gambaran SiagaKU, persona, fitur F1–F8 (tonjolkan peringatan dini proaktif per kelurahan)
6. **Pemanfaatan AI:** penjelasan risiko, rencana siaga (structured output), RAG dengan sitasi, vision, fallback; plus langkah anti-halusinasi
7. **Arsitektur & teknologi:** diagram, stack, alasan pemilihan
8. **Metodologi skor risiko:** rumus, sumber, batasan
9. **Tampilan & alur:** screenshot per halaman
10. **Pengujian:** hasil eval chatbot (tabel), uji fallback, Lighthouse
11. **Dampak & rencana pengembangan:** perluasan Jabodetabek, multi-bencana, notifikasi, kolaborasi BPBD
12. **Penggunaan template, library, aset, & AI coding assistant** (**wajib**)
13. **Tautan:** website, repo, video. **Akun demo: tidak diperlukan (tanpa login).**
14. **Daftar pustaka/sumber data**

## 7. Struktur README

```markdown
# SiagaKU — Siaga Banjir Jakarta dengan AI
Badge (deploy, CI) · Link demo · Link video
## Tentang (masalah, solusi, subtema IT RUSH 2026)
## Fitur (dengan GIF/screenshot)
## Arsitektur (diagram mermaid) & cara kerja AI (RAG, fallback)
## Tech stack
## Metodologi skor risiko & sumber data (link ke /data)
## Menjalankan lokal (prasyarat, .env, migrasi, seed, dev)
## Struktur folder
## Pengujian (unit test, eval chatbot)
## Penggunaan library, aset, & AI coding assistant  ← WAJIB
## Batasan & disclaimer
## Tim
## Lisensi
```

## 8. Checklist Uji Sebelum Submit
- [ ] Golden path di produksi: Chrome Android, Safari iOS (jika ada), Chrome desktop
- [ ] 44 kecamatan bisa dibuka tanpa error (script `npm run smoke` atau manual cepat)
- [ ] Fallback: set `GEMINI_API_KEY` salah di preview deploy → chat, rencana, penjelasan tetap jalan via Groq
- [ ] Chat: 5 pertanyaan dalam cakupan menampilkan sumber; 1 di luar topik ditolak; kalimat darurat menampilkan kartu 112
- [ ] Rencana: link bisa dibuka di perangkat lain; cetak rapi
- [ ] Peringatan: pantau kelurahan → izin → notifikasi uji diterima (Chrome desktop & Android); banner muncul saat status dipaksa Siaga (`?debugStatus=Siaga` hanya di preview); workflow GitHub Actions hijau tiap jam
- [ ] Laporan (jika ada): upload foto banjir sukses; foto non-banjir ditolak
- [ ] Tidak ada error di console; tidak ada API key di bundle klien (cari `GEMINI`/`GROQ` di source browser)
- [ ] Lighthouse: Performance ≥ 80, Accessibility ≥ 90 (mobile)
- [ ] `/tentang` berisi sumber data, metodologi, penggunaan AI
- [ ] README lengkap; repo publik; riwayat commit utuh
- [ ] Cron keep-alive aktif; `/api/health` OK
- [ ] Link video bisa dibuka dalam mode incognito (Unlisted, bukan Private)
