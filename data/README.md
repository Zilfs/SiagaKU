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

## `riwayat_banjir.csv` → tabel `flood_events`

240 baris kejadian genangan, 31 kecamatan, 20 tanggal kejadian (8 Februari 2025 – 22 Januari
2026). Dipakai `scripts/seed-banjir.ts`.

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `district_slug` | `district_id` | Slug kecamatan dari `kecamatan.csv`; seed memetakan ke `id`. |
| `subdistrict` | `subdistrict` | Nama kelurahan seperti dilaporkan BPBD (dieja sesuai rilis). |
| `event_date` | `event_date` | Tanggal hujan/kejadian, bukan tanggal rilis (lihat metode). |
| `max_depth_cm` | `max_depth_cm` | Ketinggian air tertinggi pada rilis itu. |
| `affected_rt_count` | `affected_rt_count` | Jumlah RT tergenang. |
| `description` | `description` | Penyebab: curah hujan tinggi, luapan kali, atau ROB. |
| `source_url` | `source_url` | URL rilis resmi BPBD DKI yang memuat baris tersebut. |

### Sumber

Semua baris berasal dari rilis **"UPDATE INFO TERKINI GENANGAN"** milik BPBD DKI Jakarta,
diarsipkan di <https://bpbd.jakarta.go.id/tag/4/banjir>. Contoh:
<https://bpbd.jakarta.go.id/berita/TGVzbzI0UnhuTTBGT0FhcktmNC9ldz09/update-info-terkini-genangan-23-januari-2026-s-d-pukul-18-00-wib>.
Tiap rilis memuat daftar kelurahan, jumlah RT, ketinggian air, dan penyebab.

### Catatan metode

1. **Tanggal kejadian.** Rilis BPBD sering terbit beberapa jam setelah hujan. Tanggal diambil
   dari kalimat "Hujan ... pada <hari>, <tanggal>" di rilis (mis. rilis 23–26 Januari 2026
   semuanya menyebut hujan 22 Januari 2026). Jika kalimat itu tidak ada, dipakai tanggal rilis.
2. **Satu baris per kelurahan per kejadian, bukan per rilis.** Satu kejadian bisa punya
   belasan rilis (per 2–3 jam). Untuk setiap `(event_date, kelurahan)` diambil rilis dengan
   jumlah RT terbesar, lalu ketinggian terbesar pada rilis itu. Jadi tidak ada baris ganda.
3. **Bagian "sudah surut" tidak dihitung.** Rilis memuat daftar wilayah yang sudah surut dan
   ruas jalan; keduanya diabaikan agar tidak menambah jumlah RT secara keliru.
4. **Beberapa kelurahan berbagi satu angka.** Kadang rilis menulis satu "Ketinggian/Penyebab"
   untuk beberapa kelurahan sekaligus (mis. rilis 8 Februari 2025). Nilai itu dipakai untuk
   semua kelurahan di blok yang sama.
5. **Nama kelurahan mengikuti rilis.** Enam nama perlu dipetakan manual ke kode wilayah resmi:

   | Ditulis BPBD | Kode resmi | Kelurahan |
   |---|---|---|
   | `Jelmbar` | `31.73.02.1004` | Jelambar |
   | `Bidaran Cina` | `31.75.03.1002` | Bidara Cina |
   | `Cillitan` | `31.75.04.1006` | Cililitan |
   | `Kampung Tengah` | `31.75.04.1002` | Tengah (Kramat Jati) |
   | `Cilandak Timur` (kota tidak tertulis) | `31.74.04.1003` | Cilandak Timur (Pasar Minggu) |
   | `Tanah Abang` | — | Nama lama; tidak ada di dataset Kemendagri, dipetakan ke kecamatan Tanah Abang |

6. **Rentang 2020–2024 belum tercakup.** Arsip daring BPBD hanya memuat rilis mulai 2025;
   rilis 2020–2024 tidak lagi tersedia di situsnya. Daripada menyalin angka tanpa sumber,
   CSV ini dibatasi pada rilis yang bisa dibuka publik. Target "≥ 40 baris dari ≥ 15 kecamatan"
   (`docs/06` §6) sudah terlampaui. Jika tim punya arsip BPBD/berita 2020–2024, baris bisa
   ditambahkan dengan format yang sama.
7. **`base_vulnerability` tidak ada di CSV ini.** Dihitung `seed-banjir.ts` dari jumlah
   kejadian per kecamatan (rumus `docs/06` §2).

### Verifikasi

- Diambil 13 November 2026 dari 181 halaman rilis genangan BPBD (182 URL pada indeks tag;
  1 duplikat).
- 240 baris, 31 kecamatan, 20 tanggal kejadian, 0 `source_url` kosong, 0 `max_depth_cm` kosong.
- Uji sampel 16 baris: halaman sumber dibuka ulang dan memuat nama kelurahan serta jumlah RT
  yang sama (16/16 cocok).

## `kelurahan_rawan.csv` → tabel `flood_prone_subdistricts`

116 kelurahan di 38 kecamatan yang masih tergenang pada 2023, dengan jumlah RW tergenang per
kelurahan. Dipakai `scripts/seed-banjir.ts` untuk komponen "+30 ada kelurahan rawan" di
`base_vulnerability` (`docs/06` §2).

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `district_slug` | `district_id` | Slug kecamatan dari `kecamatan.csv`; seed memetakan ke `id`. |
| `subdistrict` | `subdistrict` | Nama resmi kelurahan (Kemendagri), bukan ejaan mentah dataset. |
| `rw_count` | `rw_count` | Jumlah RW di kelurahan itu yang tergenang pada 2023. |
| `data_year` | `data_year` | `2023`. |
| `source_url` | `source_url` | Halaman dataset di Satu Data Jakarta. |

### Sumber

Dataset resmi **"Luasan Daerah Tergenang Tahun 2023"** milik Dinas Sumber Daya Air Provinsi DKI
Jakarta (organisasi `org50`), di Satu Data Jakarta:
<https://satudata.jakarta.go.id/open-data/detail?kategori=dataset&page_url=luasan-daerah-tergenang-tahun-2023>.

Data diambil lewat API publik portal (566 → 479 baris, satu baris per RT):

```
https://ws.jakarta.go.id/gateway/DataPortalSatuDataJakarta/1.0/satudata
  ?kategori=dataset&tipe=detail&url=luasan-daerah-tergenang-tahun-2023
```

### Catatan metode

1. **`rw_count` = jumlah RW berbeda** di satu kelurahan yang punya
   `luas_genangan_tahun_2023 > 0`. Hanya baris dengan luas > 0 yang dihitung; baris dengan
   luas 0 berarti RT itu tidak tergenang pada 2023.
2. **Baris agregat tidak dihitung sebagai RW.** Sebagian kelurahan punya baris dengan
   `rw = 0` / `rt = 0` (luas total kelurahan yang tidak bisa dipetakan ke RW tertentu).
   Baris itu dibuang dari hitungan RW, bukan dianggap "RW 0".
3. **Nama kelurahan memakai ejaan resmi Kemendagri.** Satu salah ketik di dataset dipetakan:
   `KERENDANG` → `Krendang` (`31.73.04.1005`, Tambora).
4. **Kenapa dataset 2023, bukan daftar lain.** Ada tiga dataset resmi yang mirip; yang dipakai
   adalah yang paling baru dan paling rinci (per RW, berbasis genangan nyata):

   | Dataset | Organisasi | Tahun | Isi | Dipakai? |
   |---|---|---|---|---|
   | Luasan Daerah Tergenang Tahun 2023 | Dinas SDA | 2023 | Luas genangan per RT/RW | **Ya** |
   | Data Daerah Rawan Banjir DKI Jakarta | Dinas SDA | 2014 | 566 RW rawan di 112 kelurahan | Tidak (terlalu lama) |
   | Daerah Rawan Banjir Provinsi DKI Jakarta | BPBD | 2017 (update 2020) | 82 kelurahan, tanpa jumlah RW | Tidak (tanpa `rw_count`) |

   Dataset 2014 dan 2017 tetap dicatat di sini sebagai pembanding, bukan bahan CSV, karena
   `rw_count` tidak boleh dikarang.
5. **Asal angka 2023.** Menurut deskripsi dataset, luas genangan dihitung dari selisih
   "Peta Sebaran Genangan Berbasis Rumah Tangga Tahun 2021" (Pantau Banjir Jakarta Smart City)
   dikurangi reduksi akibat pembangunan polder/waduk Dinas SDA.
6. **Rentang tahun tidak seragam dengan `riwayat_banjir.csv`.** `riwayat_banjir.csv` memakai
   rilis 2025–2026; file ini memakai data 2023 karena itu tahun terakhir yang tersedia per RW.
   Keduanya diisi apa adanya, tidak disamakan tahunnya.

### Verifikasi

- Diambil 13 November 2026 dari API Satu Data Jakarta (479 baris; 263 baris dengan luas 2023 > 0).
- Dihitung ulang dengan jalur kode terpisah: 116/116 `rw_count` cocok, 0 duplikat
  `(district_slug, subdistrict)`, 116/116 `district_slug` ada di `kecamatan.csv`.
- Total 206 RW di 116 kelurahan; 0 kelurahan tanpa RW setelah baris `rw = 0` dibuang.
- 0 `source_url` kosong, 0 `rw_count <= 0`.

## File data lain (belum ada)

Header di bawah sudah disesuaikan dengan migrasi `0001_init.sql`. Untuk file yang merujuk
kecamatan dipakai **`district_slug`** (bukan `district_id`) supaya CSV tetap terbaca manusia;
script seed yang memetakan slug → `id`.

| File | Tabel | Header | Target |
|---|---|---|---|
| `posko.csv` | `shelters` | `district_slug,name,type,address,lat,lng,is_verified,source_url` | ≥ 2 per kecamatan untuk 15 kecamatan paling rawan; `type`: `official_post`/`subdistrict_office`/`school`/`mosque`/`other` |
| `kontak.csv` | `emergency_contacts` | `name,phone,scope,sort_order` | minimal `112` (Jakarta Siaga) + kontak resmi lain |

**Perlu disepakati dengan penulis `scripts/seed-*.ts`:** apakah CSV merujuk kecamatan lewat
`district_slug` (usulan di atas) atau `district_id` (angka `id` dari `kecamatan.csv`).
