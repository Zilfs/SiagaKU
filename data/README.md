# Data SiagaKU

Folder ini berisi data kurasi yang dipakai untuk seeding database. Semua file di sini
di-commit ke repo publik supaya juri bisa memeriksa asal datanya.

> Catatan bahasa: header CSV memakai nama kolom database (Inggris), isi dan dokumentasi
> memakai Bahasa Indonesia.

## `kecamatan.csv`

44 kecamatan DKI Jakarta, satu baris per kecamatan. Dipakai oleh `scripts/seed-kecamatan.ts`
(Task 4 di `docs/13 Implementation Plan.md`).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `slug` | teks | ID URL, huruf kecil dan tanda hubung, mis. `jatinegara`. Unik. |
| `nama` | teks | Nama tampilan kecamatan. |
| `kota` | teks | Kota administrasi: `Jakarta Pusat/Utara/Barat/Selatan/Timur/Kepulauan Seribu`. |
| `kode_wilayah` | teks | Kode Kemendagri (Kepmendagri 100.1.1-6117/2022), format `31.71.01`. Unik. |
| `adm4_bmkg` | teks | Kode kelurahan perwakilan untuk API BMKG, format `31.71.01.1001`. |
| `lat`, `lng` | desimal | Koordinat pusat kecamatan (lihat catatan di bawah). |
| `pesisir_rob` | boolean | `true` jika kecamatan masuk wilayah pesisir rawan rob. |
| `sumber_url` | teks | URL verifikasi BMKG untuk `adm4_bmkg` (bukti kode valid dan koordinat berasal dari sana). |

### Sumber

- **Daftar kecamatan, kelurahan, dan kode wilayah:** dataset publik Kemendagri via
  <https://wilayah.id> (level 3 `districts`, level 4 `villages`, `updated_at` 2025-07-04).
  Contoh: <https://wilayah.id/api/districts/31.71.json>.
- **Kode `adm4_bmkg` dan koordinat:** API prakiraan cuaca BMKG,
  `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}`. Objek `data[0].lokasi`
  mengembalikan `desa`, `kecamatan`, `kotkab`, `lat`, dan `lon` untuk kode tersebut.
- **Daftar wilayah pesisir rawan rob:** BPBD DKI Jakarta melalui detikNews,
  2 Mei 2026 — <https://news.detik.com/berita/d-8471199/waspada-potensi-banjir-rob-di-12-wilayah-pesisir-jakarta-sampai-8-mei>.
  Daftar 12 wilayah: Kamal Muara, Kapuk Muara, Penjaringan, Pluit, Ancol, Kamal, Marunda,
  Cilincing, Kalibaru, Muara Angke, Tanjung Priok, Kepulauan Seribu.

### Catatan metode

1. **Kelurahan perwakilan.** BMKG menerima kode level kelurahan (`adm4`). Untuk tiap kecamatan
   dipilih kelurahan yang namanya sama dengan kecamatan; jika tidak ada, dipakai kelurahan
   pertama pada dataset (mis. Jatinegara memakai `Kampung Melayu`, Cakung memakai `Jatinegara`).
2. **Koordinat** adalah titik kelurahan perwakilan dari BMKG, bukan centroid poligon
   kecamatan. Selisihnya kecil (skala kecamatan) dan cukup untuk peta marker serta pencarian
   "kecamatan terdekat" (batas 15 km di Task 4). Jika nanti dipakai choropleth GeoJSON,
   koordinat ini tidak berpengaruh.
3. **`pesisir_rob`** dipetakan dari 12 wilayah BPBD ke kecamatan induknya, sehingga
   menghasilkan 7 kecamatan:
   `Penjaringan`, `Pademangan`, `Tanjung Priok`, `Cilincing`, `Kalideres`,
   `Kepulauan Seribu Utara`, `Kepulauan Seribu Selatan`.
   `Koja` dan `Kelapa Gading` **tidak** ditandai walau berbatasan dengan pesisir, karena tidak
   masuk daftar BPBD di atas. Konsekuensinya skor mereka tidak mendapat tambahan +20 dan
   wilayah yang benar-benar terkena rob tetap ditandai "rawan rob".
4. **Nama tampilan** memakai ejaan yang lazim dipakai warga. Dataset Kemendagri menulis
   `Pal Merah`, `Kramatjati`, dan `Pulogadung`; di sini dipakai `Palmerah`, `Kramat Jati`,
   `Pulo Gadung` beserta slug-nya.
5. **`kerawanan_dasar` tidak ada di CSV ini.** Nilainya dihitung saat seeding dari
   `riwayat_banjir.csv` + `kelurahan_rawan.csv` (rumus di `docs/06 Data & Database.md` §2).

### Verifikasi

- Diambil 13 November 2026.
- 44/44 kode `adm4_bmkg` dibalas HTTP 200 oleh API BMKG.
- 44/44 nama `kecamatan` yang dikembalikan BMKG cocok dengan kolom `nama` (setelah
  normalisasi ejaan di poin 4).
- 44 slug unik, 6 kota, total 44 baris.

Skrip pengambilan data bersifat sekali pakai dan tidak di-commit (berisi pemanggilan API
berulang). Untuk memperbarui data, jalankan ulang pengambilan `districts`/`villages` dari
`wilayah.id`, verifikasi tiap `adm4` ke BMKG, lalu perbarui tabel di atas.

## File data lain (belum ada)

| File | Status | Task |
|---|---|---|
| `riwayat_banjir.csv` | menyusul — target ≥ 40 kejadian, ≥ 15 kecamatan, 2020–2026 | T4 |
| `kelurahan_rawan.csv` | menyusul — daftar RW/kelurahan rawan BPBD | T4 |
| `posko.csv` | menyusul — titik aman/posko per kecamatan | T4 |
| `kontak.csv` | menyusul — kontak darurat (112 dan lainnya) | T4 |
| `pedoman/` + `index.json` | menyusul — ≥ 5 dokumen resmi untuk RAG | T9 |
| `demo/` | menyusul — foto laporan contoh | T15 |
