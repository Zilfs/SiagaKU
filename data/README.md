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
>
> **Nama file CSV juga memakai nama tabel (Inggris)**, sesuai AGENTS.md §3:
> `districts.csv`, `flood_events.csv`, `flood_prone_subdistricts.csv`,
> `shelters.csv`, `emergency_contacts.csv`.

## `districts.csv` → tabel `districts`

44 kecamatan DKI Jakarta, satu baris per kecamatan. Dipakai oleh `scripts/seed-kecamatan.ts`
(Task 4 di `docs/13 Implementation Plan.md`).

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `id` | `id` | 1–44, urut `region_code`. Stabil karena `flood_events`/`shelters` merujuk `district_id`. |
| `slug` | `slug` | ID URL, huruf kecil + tanda hubung. Unik. |
| `name` | `name` | Nama kecamatan sesuai Kemendagri (ejaan umum). |
| `city` | `city` | Kota administrasi (`Jakarta Barat`, `Jakarta Pusat`, dst.). |
| `region_code` | `region_code` | Kode kecamatan Kemendagri (mis. `31.73.01`). Unik. |
| `bmkg_adm4` | `bmkg_adm4` | Kode adm4 kelurahan perwakilan untuk query BMKG (mis. `31.73.01.1001`). |
| `lat` / `lng` | `lat` / `lng` | Koordinat kelurahan perwakilan (`data[0].lokasi` BMKG), bukan centroid poligon. |
| `tidal_flood_prone` | `tidal_flood_prone` | `true` jika termasuk 7 kecamatan pesisir rawan rob (BPBD DKI, 2 Mei 2026). |
| `notes` | `notes` | Jejak verifikasi per baris (status ADM4, `lokasi` BMKG). |

`base_vulnerability` **tidak ada di CSV**; nilainya dihitung `scripts/seed-banjir.ts` dari
`flood_events.csv` + `flood_prone_subdistricts.csv` (rumus `docs/06` §2).

---

## `flood_events.csv` → tabel `flood_events`

240 kejadian banjir tingkat kelurahan sepanjang 2025–2026 (sampai Januari 2026).

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `district_slug` | `district_id` | Slug kecamatan; seed memetakan ke `id`. |
| `subdistrict` | `subdistrict` | Nama kelurahan. |
| `event_date` | `event_date` | Tanggal kejadian hujan/banjir (`YYYY-MM-DD`). |
| `max_depth_cm` | `max_depth_cm` | Ketinggian air maksimal (diambil dari rentang tertinggi di rilis). |
| `affected_rt_count` | `affected_rt_count` | Jumlah RT yang tergenang pada puncak kejadian di rilis tersebut. |
| `description` | `description` | Deskripsi penyebab (curahan hujan/rob/luapan kali). |
| `source_url` | `source_url` | Tautan ke rilis berita resmi BPBD DKI Jakarta. |

### Sumber
Data diambil dari tag **"Update Info Terkini Genangan"** pada situs resmi BPBD DKI Jakarta:
<https://bpbd.jakarta.go.id/tag/update-info-terkini-genangan>.

### Catatan metode
1. **Tanggal kejadian adalah tanggal hujan**, bukan selalu tanggal rilis. Tanggal diekstrak
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

---

## `flood_prone_subdistricts.csv` → tabel `flood_prone_subdistricts`

116 kelurahan di 38 kecamatan yang masih tergenang pada 2023, dengan jumlah RW tergenang per
kelurahan. Dipakai `scripts/seed-banjir.ts` untuk komponen "+30 ada kelurahan rawan" di
`base_vulnerability` (`docs/06` §2).

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `district_slug` | `district_id` | Slug kecamatan dari `districts.csv`; seed memetakan ke `id`. |
| `subdistrict` | `subdistrict` | Nama resmi kelurahan (Kemendagri), bukan ejaan mentah dataset. |
| `rw_count` | `rw_count` | Jumlah RW di kelurahan itu yang tergenang pada 2023. |
| `data_year` | `data_year` | `2023`. |
| `source_url` | `source_url` | Halaman dataset di Satu Data Jakarta. |

### Sumber
Dataset resmi **"Luasan Daerah Tergenang Tahun 2023"** milik Dinas Sumber Daya Air Provinsi DKI
Jakarta (organisasi `org50`), di Satu Data Jakarta:
<https://satudata.jakarta.go.id/open-data/detail?kategori=dataset&page_url=luasan-daerah-tergenang-tahun-2023>.

### Catatan metode
1. **`rw_count` = jumlah RW berbeda** di satu kelurahan yang punya
   `luas_genangan_tahun_2023 > 0`. Hanya baris dengan luas > 0 yang dihitung; baris dengan
   luas 0 berarti RT itu tidak tergenang pada 2023.
2. **Baris agregat tidak dihitung sebagai RW.** Sebagian kelurahan punya baris dengan
   `rw = 0` / `rt = 0` (luas total kelurahan yang tidak bisa dipetakan ke RW tertentu).
   Baris itu dibuang dari hitungan RW, bukan dianggap "RW 0".
3. **Nama kelurahan memakai ejaan resmi Kemendagri.** Satu salah ketik di dataset dipetakan:
   `KERENDANG` → `Krendang` (`31.73.04.1005`, Tambora).

---

## `shelters.csv` → tabel `shelters`

283 titik lokasi pengungsian (shelters) di 44 kecamatan DKI Jakarta (semua kecamatan terwakili,
minimal 2 titik per kecamatan).

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `district_slug` | `district_id` | Slug kecamatan; seed memetakan ke `id`. |
| `name` | `name` | Nama titik/lokasi. |
| `type` | `type` | `official_post` \| `subdistrict_office` \| `school` \| `mosque` \| `other`. |
| `address` | `address` | Alamat lokasi (kelurahan/jalan). |
| `lat` | `lat` | Latitude (WGS84). |
| `lng` | `lng` | Longitude (WGS84). |
| `is_verified` | `is_verified` | `true` = titik pengungsian yang dipublikasikan JSC saat banjir 2020; `false` = kantor kelurahan (cadangan, bukan posko resmi). |
| `source_url` | `source_url` | URL item portal Jakarta Satu asal baris tersebut. |

### Sumber
- [Titik Lokasi Pengungsian Banjir (JSC, 4 Januari 2020)](https://jakartasatu.jakarta.go.id/portal/home/item.html?id=18292662b7044438bcc039427f9ae5bf)
  → 35 baris, `is_verified = true` (23 `other`, 7 `mosque`, 3 `school`, 2 `subdistrict_office`).
- [Kantor Pemerintahan (Jakarta Satu)](https://jakartasatu.jakarta.go.id/portal/home/item.html?id=7123ac8ab81644c4b499a3258129a5b1)
  → 242 kantor kelurahan, `is_verified = false`.
- [Lokasi Kantor Lurah Kepulauan Seribu (Jakarta Satu)](https://jakartasatu.jakarta.go.id/portal/home/item.html?id=899d73ba788c4022a1bfd8b6337dfcd0)
  → 6 kantor kelurahan Kepulauan Seribu (3 Utara + 3 Selatan), `is_verified = false`. Layer ini
  dipakai terpisah karena layer `Kantor_Pemerintahan` tidak memuat Kepulauan Seribu.

### Catatan metode
1. **Hanya kantor kelurahan, bukan posko bencana.** Titik `is_verified = false` adalah kantor
   kelurahan yang dipakai sebagai titik cadangan/pengumpulan; jangan klaim sebagai posko resmi.
2. **Alamat sebagian berupa deskriptor lokasi.** Baris JSC memakai format "RW 010, Kebon Pala"
   dari dataset aslinya, bukan alamat jalan lengkap.
3. **Kecamatan kepulauan.** Koordinat Kepulauan Seribu berada di luar bbox daratan Jakarta
   (lat hingga -5,98), jadi validasi koordinat harus memakai bbox `lat -6.5..-5.5`,
   `lng 106.4..107.0`.
4. **Lima kantor kelurahan tanpa alamat.** `Bambu Apus`, `Pondok Pinang`, `Cipinang Melayu`,
   `Palmerah`, dan `Sungai Bambu` memang tidak punya nilai `alamat` di layer sumber.
   Kolom `address` dibiarkan kosong (bukan diisi tebakan).

---

## `emergency_contacts.csv` → tabel `emergency_contacts`

Daftar nomor telepon darurat penting di DKI Jakarta.

| Kolom CSV | Kolom tabel | Keterangan |
|---|---|---|
| `name` | `name` | Nama instansi/layanan. |
| `phone` | `phone` | Nomor telepon (string). |
| `scope` | `scope` | `provincial` atau `national`. |
| `sort_order` | `sort_order` | Urutan tampil (1=paling penting). |

### Sumber per nomor

| Nomor | Status | Sumber |
|---|---|---|
| 112 (Jakarta Siaga) | terverifikasi | [BPBD DKI](https://bpbd.jakarta.go.id/berita/cmF4cWZmQjVFTm9kOGpyVVhINzUyQT09/kunjungan-ke-kantor-bpbd-dki-jakarta), [Pemprov DKI](https://www.instagram.com/reel/CFRQUAsgpxK/) |
| 021-3459444 (BPBD DKI) | terverifikasi | [Kumparan](https://kumparan.com/kumparantech/catat-ini-nomor-telepon-penting-darurat-banjir-di-jakarta-1sYYYJYcZNQ), [CNN Indonesia](https://www.cnnindonesia.com/nasional/20200101163245-20-461640/daftar-posko-dan-nomor-telepon-darurat-saat-banjir-jakarta) |
| 0812-1237-575 | terverifikasi sebagai **BNPB**, bukan BPBD | [Tirto](https://tirto.id/bencana-alam-2021-daftar-nomor-telepon-darurat-bnpb-dan-bpbd-f9lo), [Kompas TV](https://www.kompas.tv/nasional/139923/kamu-alami-bencana-alam-ini-daftar-nomor-telepon-kontak-darurat-bnpb-dan-bpbd-yang-bisa-kamu-hubungi) |
| 113 (Damkar) | terverifikasi | nomor tunggal darurat nasional |
| 119 (AGD) | terverifikasi | nomor tunggal layanan kesehatan (Kemenkes) |
| 123 (PLN) | terverifikasi | call center PLN |
| 1500-223 (PAM Jaya) | terverifikasi | [PAM Jaya](https://pamjaya.co.id/en/berita/informasi-peningkatan-pelayanan-pemeliharaan-sistem-call-center-1500-223) |
| 115 (BASARNAS) | terverifikasi | [Kumparan](https://kumparan.com/kumparantech/catat-ini-nomor-telepon-penting-darurat-banjir-di-jakarta-1sYYYJYcZNQ) |
| 110 (Polri) | terverifikasi | nomor tunggal darurat nasional |

Catatan: nomor BPBD `021-3459444` sebelumnya muncul dua kali ("Call Center BPBD" dan
"Posko Banjir Pemprov DKI"); duplikatnya dihapus agar daftar tidak membingungkan. Nomor
`0812-1237-575` sebelumnya salah diberi label BPBD DKI — sumber resmi menyebutnya Pusdalops
**BNPB**, sehingga `scope` diubah menjadi `national`.
