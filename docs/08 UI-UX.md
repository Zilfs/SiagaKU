---
title: SiagaKU — UI/UX Guidelines
project: "[[SiagaKU]]"
type: design-spec
status: draft
created: 2026-11-13
tags: [siagaku, ui, ux, design]
---

# UI/UX Guidelines

Terkait: [[04 Fitur & Alur Pengguna]] · [[02 PRD]]

## 1. Prinsip
1. **Tenang, bukan panik.** Topiknya serius; visualnya jernih, tidak dramatis. Merah hanya untuk level "Sangat Tinggi" dan tombol darurat.
2. **Jawaban dulu, detail kemudian.** Setiap halaman membuka dengan status atau jawaban, lalu rincian bisa diperluas.
3. **Bahasa warga.** "Hujan lebat (62 mm)" lebih baik daripada "precipitation_sum 62.4".
4. **Mobile-first, jempol-friendly.** Target sentuh ≥ 44 px, CTA utama di area bawah layar mobile.
5. **Jujur soal data.** Sumber + waktu pembaruan di setiap angka; label "perkiraan", "contoh", "AI" jelas terlihat.

## 2. Identitas Visual (usulan)

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--primary` | Biru laut `#0E5E8C` | Brand, tombol utama |
| `--primary-foreground` | `#FFFFFF` | |
| `--accent` | Teal `#14A39A` | Highlight, AI badge |
| `--bg` | `#F7FAFC` | Latar |
| `--risk-rendah` | `#2E9E5B` | Level Rendah |
| `--risk-sedang` | `#E2B007` | Level Sedang (teks gelap di atasnya) |
| `--risk-tinggi` | `#E8771E` | Level Tinggi |
| `--risk-sangat` | `#C62828` | Level Sangat Tinggi, Darurat |

- **Font:** Plus Jakarta Sans (judul & isi). Cocok secara nama dan konteks, gratis di Google Fonts. Fallback: Inter/system.
- **Ikon:** lucide-react (`CloudRain`, `Waves`, `Backpack`, `MessageCircle`, `Camera`, `Phone`, `MapPin`, `ShieldCheck`).
- **Logo:** wordmark "Siaga**KU**" + ikon perisai/tetes air sederhana (dibuat sendiri, tanpa aset berhak cipta).
- **Level risiko** selalu memakai **warna + label teks + ikon** (aksesibilitas buta warna).

## 3. Wireframe Teks

### 3.1 Landing (mobile)
```
┌─────────────────────────────┐
│ ☰  SiagaKU        [🔴 Darurat]│
├─────────────────────────────┤
│ Siap Hadapi Banjir,         │
│ Mulai dari Rumahmu.         │
│ Cek risiko wilayahmu hari   │
│ ini & buat rencana siaga    │
│ keluarga dengan bantuan AI. │
│ ┌─────────────────────────┐ │
│ │🔍 Cari kecamatan...      │ │
│ └─────────────────────────┘ │
│ [📍 Gunakan lokasiku]        │
├─────────────────────────────┤
│ Jakarta hari ini            │
│ 🔴 3  🟠 9  🟡 18  🟢 14     │
│ kecamatan    [Lihat peta →] │
├─────────────────────────────┤
│ [🗺 Cek Risiko] [🎒 Rencana] │
│ [💬 Tanya]      [📷 Lapor]   │
├─────────────────────────────┤
│ Sumber: BMKG · BPBD DKI ... │
└─────────────────────────────┘                 (💬)
```

### 3.2 Halaman Wilayah
```
┌─────────────────────────────┐
│ ← Jatinegara · Jakarta Timur│
├─────────────────────────────┤
│  ╭───────╮  RISIKO HARI INI │
│  │  68   │  🟠 TINGGI        │
│  ╰───────╯  diperbarui 14.00│
│ ✨ Penjelasan AI             │
│ "Hujan lebat diperkirakan…  │
│  Wilayah ini sering terdam- │
│  pak luapan Ciliwung…"      │
│ ➜ Tindakan utama: Pindahkan │
│   barang penting ke tempat  │
│   tinggi.                   │
├─────────────────────────────┤
│ Kenapa skornya segini? ▾    │
│  Kerawanan wilayah  80 ████ │
│  Faktor hujan       70 ███▌ │
├─────────────────────────────┤
│ Cuaca 3 hari (BMKG)  ⟶ geser│
│ 13:00 16:00 19:00 22:00 ... │
│ 🌧 31° 🌧 29° ☁ 27° ...      │
├─────────────────────────────┤
│ Riwayat banjir              │
│ • 3 Mar 2025 Kp. Melayu 250cm│
│ • ...                [sumber]│
├─────────────────────────────┤
│ Titik aman terdekat [peta]  │
├─────────────────────────────┤
│ Tren hujan ekstrem (F5) ▁▃▅▂│
├─────────────────────────────┤
│[🎒 Buat rencana siaga]       │
│[💬 Tanya tentang wilayah ini]│
└─────────────────────────────┘
```
Desktop: 2 kolom (kiri skor + penjelasan + komponen; kanan cuaca + peta mini + riwayat).

### 3.3 Hasil Rencana
```
┌─────────────────────────────┐
│ Rencana Siaga Keluarga      │
│ Jatinegara · 🟠 Tinggi       │
│ ✨ Dibuat dengan AI · 14 Nov │
│ [🔗 Salin] [WA] [🖨 Cetak]   │
├─────────────────────────────┤
│ Ringkasan ...               │
├─────────────────────────────┤
│ 🎒 Tas Siaga   8/22 siap ▓▓░ │
│ [Wajib] [Semua]             │
│ ☑ Air minum 3 L/orang ×3hr  │
│ ☐ Susu formula & botol (bayi)│
│ ☐ Obat rutin 7 hari (lansia)│
├─────────────────────────────┤
│ [Sebelum][Saat][Setelah]    │
│ 1. ...                      │
├─────────────────────────────┤
│ 👵 Lansia (kursi roda)       │
│ • Tentukan pendamping ...   │
├─────────────────────────────┤
│ 📍 Titik aman               │
│ ✅ Posko SDN ... (resmi)     │
│ ⚠ Kantor Kel. ... (perkiraan)│
├─────────────────────────────┤
│ ☎ 112 Jakarta Siaga [Telepon]│
└─────────────────────────────┘
```

### 3.4 Chat
```
┌─────────────────────────────┐
│ 💬 Tanya SiagaKU         ✕  │
│ Konteks: Jatinegara (Tinggi)│
├─────────────────────────────┤
│        Kapan harus mengungsi│
│        kalau ada lansia? 🧑 │
│ 🤖 Untuk keluarga dengan     │
│ lansia, mengungsilah lebih  │
│ awal, yaitu saat ...[1]     │
│ 1. ...                      │
│ Sumber:                     │
│ [1] BNPB · Buku Saku … hlm.23│
├─────────────────────────────┤
│ [Ketik pertanyaan…]   [➤]   │
│ Isian diproses AI. Jangan   │
│ tulis data pribadi.         │
└─────────────────────────────┘
```

## 4. Microcopy Kunci

| Tempat | Teks |
|---|---|
| Hero | **Siap Hadapi Banjir, Mulai dari Rumahmu.** |
| Sub-hero | Cek risiko banjir wilayahmu hari ini dan buat rencana siaga keluarga dengan bantuan AI. |
| Disclaimer skor | Skor ini adalah **estimasi untuk kesiapsiagaan**, bukan peringatan resmi. Ikuti informasi BMKG dan BPBD DKI Jakarta. |
| Badge AI | ✨ Dibuat dengan AI. Periksa kembali sebelum digunakan. |
| Rencana dasar | Rencana dasar. Layanan AI sedang sibuk, jadi kami tampilkan panduan standar. |
| Chat kosong | Halo! Tanyakan apa saja soal persiapan menghadapi banjir. Jawaban kami bersumber dari pedoman BNPB & BPBD. |
| Darurat | **Dalam bahaya? Hubungi 112 sekarang.** Layanan Jakarta Siaga, gratis 24 jam. |
| Laporan ditolak | Foto ini sepertinya bukan genangan atau banjir, jadi tidak kami tampilkan di peta. |
| Laporan demo | Contoh, untuk demonstrasi |
| Rate limit | Pelan-pelan dulu ya 🙏 Coba lagi dalam beberapa menit. |
| Banner Siaga | ⚠️ **Potensi banjir di {kelurahan}.** {Kategori} diperkirakan {mulai}–{selesai} WIB. [Lihat langkah] |
| Banner Awas | 🚨 **Waspada tinggi di {kelurahan}.** Hujan lebat + wilayah rawan. Siapkan evakuasi dini. [Lihat langkah] |
| Tombol push | 🔔 Aktifkan notifikasi peringatan |
| Uji push | Kirim notifikasi uji |
| iOS | Di iPhone, ketuk **Bagikan → Tambahkan ke Layar Utama**, lalu buka SiagaKU dari ikon itu untuk mengaktifkan notifikasi. |
| Disclaimer peringatan | Ini **potensi**, bukan kepastian. Peringatan resmi tetap dari BMKG dan BPBD DKI Jakarta. |

## 5. Aksesibilitas Checklist
- [ ] Kontras teks ≥ 4.5:1 (cek kuning `--risk-sedang` → pakai teks gelap)
- [ ] Semua input punya `<label>`; error dikaitkan `aria-describedby`
- [ ] Fokus terlihat; urutan tab logis; modal menjebak fokus & bisa ditutup Esc
- [ ] Stream chat di `aria-live="polite"`
- [ ] Peta punya alternatif daftar kecamatan (bukan hanya visual)
- [ ] Gambar punya `alt`; ikon dekoratif `aria-hidden`
- [ ] Mendukung zoom 200% tanpa layout pecah
- [ ] Lighthouse Accessibility ≥ 90

## 6. Cetak (Rencana)
CSS `@media print`: sembunyikan header/footer/widget, tampilkan checklist dalam 2 kolom, sertakan QR code ke URL rencana (lib `qrcode`), plus kontak darurat dalam kotak tebal.


## 7. Halaman Peringatan (wireframe)
```
┌─────────────────────────────┐
│ 🔔 Peringatan Dini Banjir    │
│ Dapat kabar saat wilayahmu  │
│ berpotensi banjir.          │
│ ┌─────────────────────────┐ │
│ │🔍 Cari kelurahan: Ceger  │ │
│ └─────────────────────────┘ │
│ Ceger · Cipayung · Jaktim   │
│ Status sekarang: 🟡 Waspada  │
│ Hujan sedang 15.00–18.00    │
├─────────────────────────────┤
│ [🔔 Aktifkan notifikasi]     │
│ [Kirim notifikasi uji]      │
│ Berhenti memantau           │
├─────────────────────────────┤
│ Cara kerja: prakiraan BMKG  │
│ per kelurahan × kerawanan → │
│ Normal/Waspada/Siaga/Awas ▾ │
│ Ini potensi, bukan kepastian│
└─────────────────────────────┘
```
Warna status: Normal hijau · Waspada kuning · Siaga oranye · Awas merah (sama dengan token level risiko).

## 8. PWA
- `manifest`: `name: "SiagaKU — Siaga Banjir Jakarta"`, `short_name: "SiagaKU"`, `theme_color: #0E5E8C`, `background_color: #F7FAFC`, `display: standalone`, ikon 192/512 (+ maskable).
- Ikon notifikasi: logo 192 px; badge monokrom 72 px.
