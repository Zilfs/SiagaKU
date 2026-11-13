# Data SiagaKU

Folder ini berisi data kurasi untuk seeding database. Semua file di-commit ke repo publik
supaya juri bisa memeriksa asal datanya.

> **Konvensi nama:** skema database memakai nama Inggris
> (`supabase/migrations/0001_init.sql`, branch `feature/database`). Karena itu header CSV
> memakai nama kolom tabel, bukan nama Indonesia di `docs/06 Data & Database.md`.
> Terjemahan: `kecamatan`→`districts`, `riwayat_banjir`→`flood_events`,
> `kelurahan_rawan`→`flood_prone_subdistricts`, `posko_evakuasi`→`shelters`,
> `kontak_darurat`→`emergency_contacts`, `kerawanan_dasar`→`base_vulnerability`,
> `pesisir_rob`→`tidal_flood_prone`, `sumber_url`→`source_url`.

## `kecamatan.csv` → tabel `districts`

44 kecamatan DKI Jakarta, satu baris per kecamatan. Dipakai oleh `scripts/seed-kecamatan.ts`
(Task 4 di `docs/13 Implementation Plan.md`).

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `id` | `id` | 1–44, urut `region_code`. Stabil karena `flood_events`/`shelters` merujuk `district_id`. |
| `slug` | `slug` | ID URL, huruf kecil + tanda hubung. Unik. |
| `name` | `name` | Nama tampilan kecamatan. |
| `city` | `city` | `Jakarta Pusat/Utara/Barat/Selatan/Timur/Kepulauan Seribu`. |
| `region_code` | `region_code` | Kode Kemendagri, format `31.71.01`. Unik. |
| `bmkg_adm4` | `bmkg_adm4` | Kode kelurahan perwakilan untuk API BMKG, format `31.71.01.1001`. |
| `lat`, `lng` | `lat`, `lng` | Koordinat pusat kecamatan (lihat catatan metode). |
| `tidal_flood_prone` | `tidal_flood_prone` | `true` jika masuk wilayah pesisir rawan rob. |
| `notes` | `notes` | Jejak verifikasi: kode adm4 + kelurahan + tanggal cek. |

Kolom `districts` yang **tidak** diisi dari CSV:

- `base_vulnerability` — dihitung `seed-banjir.ts` dari `flood_events` + `flood_prone_subdistricts`
  + `tidal_flood_prone` (rumus `docs/06` §2).
- `geojson` — kosong sampai ada GeoJSON batas kecamatan dengan lisensi jelas.

### Sumber

- **Kecamatan, kelurahan, kode wilayah:** dataset publik Kemendagri di
  <https://github.com/cahyadsn/wilayah> (`db/wilayah.sql`; versi daring: <https://wilayah.id>).
  Repo itu memuat 44 kecamatan dan 267 kelurahan untuk kode `31.xx`.
- **`bmkg_adm4` + koordinat:** API prakiraan cuaca BMKG,
  `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}`. Objek `data[0].lokasi`
  mengembalikan `desa`, `kecamatan`, `kotkab`, `lat`, `lon`.
- **Wilayah pesisir rawan rob:** BPBD DKI Jakarta via detikNews, 2 Mei 2026 —
  <https://news.detik.com/berita/d-8471199/waspada-potensi-banjir-rob-di-12-wilayah-pesisir-jakarta-sampai-8-mei>.
  12 wilayah: Kamal Muara, Kapuk Muara, Penjaringan, Pluit, Ancol, Kamal, Marunda,
  Cilincing, Kalibaru, Muara Angke, Tanjung Priok, Kepulauan Seribu.

### Catatan metode

1. **Kelurahan perwakilan.** BMKG menerima kode level kelurahan. Tiap kecamatan memakai
   kelurahan yang namanya sama; jika tidak ada, kelurahan pertama pada dataset
   (mis. Jatinegara → `Kampung Melayu`, Cakung → `Jatinegara`).
2. **Koordinat** = titik kelurahan perwakilan dari BMKG, bukan centroid poligon kecamatan.
   Selisihnya kecil dan cukup untuk marker peta serta `kecamatanTerdekat` (batas 15 km).
   Jika nanti dipakai choropleth GeoJSON, koordinat ini tidak berpengaruh.
3. **`tidal_flood_prone`** dipetakan dari 12 wilayah BPBD ke kecamatan induk = **7 kecamatan**:
   Penjaringan, Pademangan, Tanjung Priok, Cilincing, Kalideres, Kepulauan Seribu Utara,
   Kepulauan Seribu Selatan. `Koja` dan `Kelapa Gading` tidak ditandai karena tidak ada di
   daftar BPBD di atas, walau berbatasan pesisir.
4. **Nama tampilan** memakai ejaan warga: `Palmerah`, `Kramat Jati`, `Pulo Gadung`
   (Kemendagri: `Pal Merah`, `Kramatjati`, `Pulogadung`).
5. **Kode Ceger** adalah `31.75.10.1008`, **bukan** `31.75.10.1004` (itu Munjul). Contoh di
   `docs/06` perlu dikoreksi sebelum Task 14 (kelurahan/peringatan dini).

### Verifikasi

- Diambil 13 November 2026.
- 44/44 kode `bmkg_adm4` dibalas HTTP 200 oleh API BMKG.
- 44/44 nama `kecamatan` dari BMKG cocok dengan kolom `name` (setelah normalisasi poin 4).
- 44/44 `region_code` dan `bmkg_adm4` ada di `cahyadsn/wilayah`, tanpa duplikat.
- 44 slug unik, 6 kota, `tidal_flood_prone=true` untuk 7 baris.

## File data lain (belum ada)

Header di bawah sudah disesuaikan dengan migrasi `0001_init.sql`. Untuk file yang merujuk
kecamatan dipakai **`district_slug`** (bukan `district_id`) supaya CSV tetap terbaca manusia;
script seed yang memetakan slug → `id`.

| File | Tabel | Header | Target |
|---|---|---|---|
| `riwayat_banjir.csv` | `flood_events` | `district_slug,subdistrict,event_date,max_depth_cm,affected_rt_count,description,source_url` | ≥ 40 baris, ≥ 15 kecamatan, 2020–2026; `source_url` wajib |
| `kelurahan_rawan.csv` | `flood_prone_subdistricts` | `district_slug,subdistrict,rw_count,data_year,source_url` | daftar RW/kelurahan rawan BPBD |
| `posko.csv` | `shelters` | `district_slug,name,type,address,lat,lng,is_verified,source_url` | ≥ 2 per kecamatan untuk 15 kecamatan paling rawan; `type`: `official_post`/`subdistrict_office`/`school`/`mosque`/`other` |
| `kontak.csv` | `emergency_contacts` | `name,phone,scope,sort_order` | minimal `112` (Jakarta Siaga) + kontak resmi lain |

**Perlu disepakati dengan penulis `scripts/seed-*.ts`:** apakah CSV merujuk kecamatan lewat
`district_slug` (usulan di atas) atau `district_id` (angka `id` dari `kecamatan.csv`).
