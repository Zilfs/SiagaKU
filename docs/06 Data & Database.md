---
title: SiagaKU — Data & Database
project: "[[SiagaKU]]"
type: tech-spec
status: draft
created: 2026-11-13
tags: [siagaku, database, supabase, data]
---

# Data & Database

Terkait: [[01 Design Doc]] · [[03 Arsitektur Sistem]] · [[05 Desain AI]] · [[12 Referensi & Sumber Data]]

## 1. Sumber Data

| Data | Sumber | Cara pakai | Frekuensi |
|---|---|---|---|
| Prakiraan cuaca per kelurahan (3 hari, interval 3 jam) | **BMKG** `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}` | Ditampilkan di halaman wilayah (sumber resmi) | Cache 3 jam |
| Curah hujan harian (mm) prakiraan 3 hari | **Open-Meteo Forecast** `api.open-meteo.com/v1/forecast` (`daily=precipitation_sum`) | Input `faktor_hujan` skor risiko | Cache 1 jam |
| Curah hujan historis 10 tahun | **Open-Meteo Archive** `archive-api.open-meteo.com/v1/archive` | Kartu tren iklim (dihitung sekali saat seeding) | Sekali |
| Daftar kecamatan/kelurahan DKI + kode wilayah | Kode wilayah Kemendagri (dataset `wilayah` publik) | Seed tabel `kecamatan`, kode adm4 perwakilan | Sekali |
| Wilayah rawan banjir & riwayat kejadian | Rilis BPBD DKI, berita (Antara, Berita Jakarta, dll.), portal data Pemprov DKI (jika ada dataset) | **Dikurasi manual** ke CSV, lalu di-seed | Sekali (+ tambahan) |
| Lokasi posko/pengungsian | Rilis BPBD DKI / kelurahan; fallback: kantor kelurahan, sekolah, masjid besar (ditandai "perkiraan") | Seed `posko_evakuasi` | Sekali |
| Batas kecamatan (GeoJSON) | Repo GeoJSON batas administrasi Indonesia (cari di GitHub) | Choropleth peta (opsional) | Sekali |
| Pedoman kesiapsiagaan | BNPB (buku saku/panduan), BPBD DKI, materi publik lain | Ingest RAG | Sekali |

> [!warning] Batasan
> - BMKG prakiraan cuaca dibatasi sekitar **60 request/menit per IP**. Selalu lewat cache server, jangan dipanggil langsung dari browser.
> - Data historis Open-Meteo (reanalysis) beresolusi kasar (sekitar puluhan km), jadi **tren iklim dihitung per kota administrasi** (6 wilayah), bukan per kecamatan. Ini ditulis jujur di halaman metodologi.
> - Kurasi data rawan dan riwayat banjir adalah pekerjaan manual. Catat **URL sumber** setiap baris.

## 2. Rumus Skor Risiko

Skor 0–100 = estimasi risiko banjir **untuk kesiapsiagaan**, bukan prediksi.

```
skor = round(0.55 × kerawanan_dasar + 0.45 × faktor_hujan)
```

### kerawanan_dasar (0–100), statis, dihitung saat seeding
| Komponen | Nilai |
|---|---|
| Frekuensi kejadian 5 tahun terakhir (`riwayat_banjir` di kecamatan itu) | `min(50, jumlah_kejadian × 10)` |
| Ada kelurahan di daftar rawan BPBD | `+30` (atau proporsional: `30 × kelurahan_rawan / total_kelurahan`, minimal 10 jika ada) |
| Kecamatan pesisir dengan risiko rob | `+20` |
| **Total** | `min(100, jumlah)` |

### faktor_hujan (0–100), dinamis
Ambil **maksimum `precipitation_sum` harian** dalam 3 hari ke depan (Open-Meteo, titik centroid kecamatan). Kategori intensitas mengikuti klasifikasi BMKG (mm/hari):

| Curah hujan | Kategori | faktor_hujan |
|---|---|---|
| < 5 | Tidak/sangat ringan | 0 |
| 5 – 20 | Ringan | 20 |
| 20 – 50 | Sedang | 45 |
| 50 – 100 | Lebat | 70 |
| 100 – 150 | Sangat lebat | 90 |
| > 150 | Ekstrem | 100 |

### Level
| Skor | Level | Warna |
|---|---|---|
| 0–24 | Rendah | hijau |
| 25–49 | Sedang | kuning |
| 50–74 | Tinggi | oranye |
| 75–100 | Sangat Tinggi | merah |

> [!note] Kalibrasi
> Bobot 0,55/0,45 adalah titik awal. Setelah seeding, cek apakah wilayah yang dikenal langganan banjir (mis. Kampung Melayu/Jatinegara, Cengkareng, Kalideres) memang muncul Tinggi saat hujan lebat dan Sedang saat hujan ringan. Sesuaikan bobot jika perlu, lalu tulis alasannya di halaman `/tentang`.

Fungsi skor ditulis sebagai **fungsi murni** `hitungSkorRisiko(kerawanan, maxHujanMm)` di `src/lib/risk/score.ts` dengan unit test.

## 3. Skema Database (Supabase Postgres)

```sql
-- Ekstensi
create extension if not exists vector;
create extension if not exists pg_trgm;

-- 3.1 Wilayah
create table kecamatan (
  id            smallint primary key,            -- id internal 1..44
  slug          text unique not null,            -- 'jatinegara'
  nama          text not null,                   -- 'Jatinegara'
  kota          text not null,                   -- 'Jakarta Timur'
  kode_wilayah  text unique not null,            -- '31.75.03' (Kemendagri)
  adm4_bmkg     text not null,                   -- kelurahan perwakilan utk BMKG
  lat           double precision not null,       -- centroid
  lng           double precision not null,
  pesisir_rob   boolean not null default false,
  kerawanan_dasar smallint not null default 0 check (kerawanan_dasar between 0 and 100),
  catatan       text,
  geojson       jsonb                            -- opsional, polygon batas
);

create table riwayat_banjir (
  id            bigint generated always as identity primary key,
  kecamatan_id  smallint not null references kecamatan(id),
  kelurahan     text,
  tanggal       date not null,
  tinggi_max_cm integer,
  jumlah_rt     integer,
  keterangan    text,
  sumber_url    text not null
);
create index on riwayat_banjir (kecamatan_id, tanggal desc);

create table kelurahan_rawan (
  id            bigint generated always as identity primary key,
  kecamatan_id  smallint not null references kecamatan(id),
  kelurahan     text not null,
  jumlah_rw     integer,
  tahun_data    smallint,
  sumber_url    text not null
);

create table posko_evakuasi (
  id            bigint generated always as identity primary key,
  kecamatan_id  smallint not null references kecamatan(id),
  nama          text not null,
  jenis         text not null,          -- 'posko_resmi' | 'kantor_kelurahan' | 'sekolah' | 'masjid' | 'lainnya'
  alamat        text,
  lat           double precision,
  lng           double precision,
  terverifikasi boolean not null default false,  -- false = "perkiraan lokasi aman"
  sumber_url    text
);

create table kontak_darurat (
  id     smallint generated always as identity primary key,
  nama   text not null,      -- 'Jakarta Siaga'
  nomor  text not null,      -- '112'
  cakupan text not null,     -- 'DKI' | 'nasional' | kota tertentu
  urutan smallint not null default 0
);

-- 3.2 Iklim (per kota administrasi)
create table iklim_tahunan (
  kota          text not null,
  tahun         smallint not null,
  hari_hujan_lebat integer not null,   -- jumlah hari precipitation_sum >= 50 mm
  total_hujan_mm numeric not null,
  primary key (kota, tahun)
);

-- 3.3 Cache data eksternal & AI
create table cache_kv (
  key        text primary key,          -- 'bmkg:31.75.03.1001', 'om:forecast:12', 'ai:penjelasan:12'
  value      jsonb not null,
  expires_at timestamptz not null
);

-- 3.4 RAG
create table dokumen (
  id        smallint generated always as identity primary key,
  judul     text not null,
  penerbit  text not null,              -- 'BNPB', 'BPBD DKI Jakarta'
  tahun     smallint,
  url       text not null
);

create table dokumen_chunk (
  id          bigint generated always as identity primary key,
  dokumen_id  smallint not null references dokumen(id) on delete cascade,
  urutan      integer not null,
  halaman     integer,
  judul_bagian text,
  konten      text not null,
  embedding   vector(768),
  fts         tsvector generated always as (to_tsvector('indonesian', konten)) stored
);
create index on dokumen_chunk using hnsw (embedding vector_cosine_ops);
create index on dokumen_chunk using gin (fts);

-- 3.5 Fitur pengguna
create table rencana_siaga (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,      -- 10 char nanoid, utk URL
  kecamatan_id smallint not null references kecamatan(id),
  profil       jsonb not null,            -- input form (tanpa data identitas)
  rencana      jsonb not null,            -- output AI tervalidasi zod
  provider     text not null,             -- 'gemini' | 'groq'
  model        text not null,
  created_at   timestamptz not null default now()
);

create table laporan (
  id            uuid primary key default gen_random_uuid(),
  kecamatan_id  smallint references kecamatan(id),
  lat           double precision not null,
  lng           double precision not null,
  foto_path     text not null,            -- path di bucket 'laporan'
  deskripsi     text,
  ai_status     text not null default 'menunggu',  -- 'menunggu' | 'selesai' | 'gagal' | 'ditolak'
  ai_hasil      jsonb,                    -- {apakah_banjir, keparahan, estimasi_tinggi_air, ringkasan, confidence}
  ai_provider   text,
  is_demo       boolean not null default false,
  ip_hash       text,
  created_at    timestamptz not null default now()
);
create index on laporan (created_at desc);

-- 3.6 Peringatan Dini (F8)
create table kelurahan (
  kode          text primary key,                -- adm4, mis. '31.75.10.1004' (cek kode Ceger di dataset)
  kecamatan_id  smallint not null references kecamatan(id),
  nama          text not null,                   -- 'Ceger'
  lat           double precision,                -- diisi dari field lokasi respons BMKG
  lng           double precision,
  rawan         boolean not null default false   -- ada di kelurahan_rawan
);
create index on kelurahan using gin (nama gin_trgm_ops);

create table push_subscription (
  id            uuid primary key default gen_random_uuid(),
  endpoint      text unique not null,
  p256dh        text not null,
  auth          text not null,
  kelurahan_kode text not null references kelurahan(kode),
  last_sent_at  timestamptz,
  last_status   text,                            -- 'Siaga' | 'Awas'
  created_at    timestamptz not null default now()
);
create index on push_subscription (kelurahan_kode);

create table peringatan_status (                 -- hasil evaluasi terakhir per kelurahan (dipakai banner & cron)
  kelurahan_kode text primary key references kelurahan(kode),
  status        text not null,                   -- 'Normal' | 'Waspada' | 'Siaga' | 'Awas'
  skor          smallint not null,
  hujan_24j_mm  numeric,
  kategori_hujan text,
  jendela_mulai timestamptz,
  jendela_selesai timestamptz,
  evaluated_at  timestamptz not null default now()
);

-- 3.7 Operasional
create table rate_limit (
  ip_hash     text not null,
  bucket      text not null,             -- 'chat' | 'rencana' | 'laporan'
  window_start timestamptz not null,
  count       integer not null default 1,
  primary key (ip_hash, bucket, window_start)
);

create table ai_log (
  id          bigint generated always as identity primary key,
  fitur       text not null,             -- 'chat' | 'rencana' | 'penjelasan' | 'vision' | 'embed'
  provider    text not null,
  model       text not null,
  status      text not null,             -- 'ok' | 'fallback' | 'error'
  latency_ms  integer,
  error_code  text,
  created_at  timestamptz not null default now()
);
```

### Fungsi RPC

```sql
-- Similarity search untuk RAG
create or replace function match_chunks(query_embedding vector(768), match_count int default 5, min_similarity float default 0.55)
returns table (id bigint, dokumen_id smallint, konten text, halaman int, judul_bagian text, similarity float)
language sql stable as $$
  select c.id, c.dokumen_id, c.konten, c.halaman, c.judul_bagian,
         1 - (c.embedding <=> query_embedding) as similarity
  from dokumen_chunk c
  where 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Fallback keyword search jika embedding gagal
create or replace function search_chunks_fts(q text, match_count int default 5)
returns table (id bigint, dokumen_id smallint, konten text, halaman int, judul_bagian text, rank real)
language sql stable as $$
  select id, dokumen_id, konten, halaman, judul_bagian, ts_rank(fts, websearch_to_tsquery('indonesian', q)) as rank
  from dokumen_chunk
  where fts @@ websearch_to_tsquery('indonesian', q)
  order by rank desc
  limit match_count;
$$;
```

> [!tip] Cek konfigurasi FTS
> Pastikan konfigurasi `indonesian` tersedia di Postgres Supabase (`select cfgname from pg_ts_config;`). Jika tidak ada, pakai `'simple'`.

## 4. Keamanan Data (RLS)

- **Aktifkan RLS di semua tabel.** Semua akses dilakukan **server-side** dengan `SUPABASE_SERVICE_ROLE_KEY` di route handler. Browser **tidak** query Supabase langsung, kecuali untuk mengunggah foto lewat signed upload URL.
- Bucket Storage `laporan`: public read (foto ditampilkan di peta), write hanya lewat **signed upload URL** yang dibuat server.
- `ip_hash = sha256(ip + IP_SALT)`. IP mentah tidak disimpan.
- Profil keluarga di rencana siaga **tidak berisi nama atau identitas**, hanya komposisi (jumlah dewasa/anak/lansia, kebutuhan khusus, hewan peliharaan, dll.).

## 5. Seeding

Script di `scripts/` (dijalankan lokal dengan `tsx`, memakai service role key):

| Script | Input | Output |
|---|---|---|
| `seed-kecamatan.ts` | `data/districts.csv` (44 baris: nama, kota, kode, adm4, lat, lng, pesisir_rob) | tabel `kecamatan` |
| `seed-banjir.ts` | `data/flood_events.csv`, `data/flood_prone_subdistricts.csv` | tabel terkait + hitung `kerawanan_dasar` |
| `seed-kelurahan.ts` | Dataset kode wilayah (prefix `31.`) + panggil BMKG per adm4 (≤ 50/menit) untuk lat/lng | `kelurahan` (±267 baris) + flag `rawan` dari `kelurahan_rawan` |
| `seed-posko.ts` | `data/shelters.csv`, `data/emergency_contacts.csv` | `posko_evakuasi`, `kontak_darurat` |
| `seed-iklim.ts` | Open-Meteo archive per kota, 2016–2025 | `iklim_tahunan` |
| `ingest-dokumen.ts` | `data/guidelines/*.pdf` atau `.md` + `data/guidelines/index.json` (metadata) | `dokumen`, `dokumen_chunk` + embedding |
| `seed-demo.ts` | `data/demo/laporan/*.jpg` + JSON | 6–10 laporan `is_demo=true` |

Semua CSV ada di repo (`data/`) supaya juri bisa memeriksa asal data. Ini menambah nilai dokumentasi dan kualitas kode.

### Format CSV contoh

`data/flood_events.csv`
```csv
kecamatan_slug,kelurahan,tanggal,tinggi_max_cm,jumlah_rt,keterangan,sumber_url
jatinegara,Kampung Melayu,2025-03-03,250,,Luapan Kali Ciliwung,https://tirto.id/...
```

## 6. Target Volume Data Minimum (agar demo meyakinkan)

- 44 kecamatan dengan centroid dan adm4 valid (**wajib**)
- ≥ 40 baris riwayat banjir dari ≥ 15 kecamatan, 2020–2026
- ≥ 2 posko/titik aman per kecamatan untuk 15 kecamatan paling rawan; kecamatan lain minimal kantor kecamatan
- ≥ 5 dokumen pedoman, ≥ 150 chunk
- 6–10 laporan demo tersebar di kecamatan rawan


## 7. Logika Peringatan Dini

Dihitung per **kelurahan** dari prakiraan BMKG (3-jam-an) untuk **24 jam ke depan**. Fungsi murni `evaluasiPeringatan()` di `src/lib/peringatan/evaluate.ts`.

```
kerawanan_kel = min(100, kecamatan.kerawanan_dasar + (kelurahan.rawan ? 15 : 0))

hujan_24j_mm  = Σ tp (mm) slot dalam 24 jam ke depan  (slot tanpa tp → pakai estimasi dari deskripsi:
                Hujan Ringan 5 · Hujan Sedang 15 · Hujan Lebat 40 · Hujan Petir 40 per slot)
faktor        = kategoriHujan(hujan_24j_mm).faktor          (tabel kategori BMKG yang sama dengan skor risiko)
jika ada slot berdeskripsi "Hujan Lebat" atau "Petir" → faktor = max(faktor, 70)

skor_kel      = round(0.55 × kerawanan_kel + 0.45 × faktor)

status:
  faktor < 20                    → Normal   (tanpa hujan berarti, tidak ada peringatan meski wilayah rawan)
  faktor ≥ 20 dan skor_kel < 50  → Waspada  (banner info ringan, tanpa push)
  faktor ≥ 20 dan 50 ≤ skor < 75 → Siaga    (banner + push)
  faktor ≥ 20 dan skor ≥ 75      → Awas     (banner merah + push)

jendela       = slot pertama s.d. slot terakhir dengan deskripsi hujan sedang/lebat/petir atau tp ≥ 2 mm
```

> [!warning] Cek respons BMKG
> Nama field (`tp`, `weather_desc`, `local_datetime`) dan teks deskripsi ("Hujan Lebat", "Hujan Petir") diverifikasi terhadap fixture asli saat Task 3. Sesuaikan mapping jika berbeda.

**Dedupe push:** kirim jika `status ∈ {Siaga, Awas}` **dan** (`last_sent_at` null **atau** > 6 jam lalu **atau** status naik dari `last_status`).

**Cron `/api/cron/peringatan`** (tiap jam, GitHub Actions):
1. Ambil daftar `kelurahan_kode` unik dari `push_subscription` **∪** 10 kelurahan paling rawan (agar banner punya data meski belum ada subscriber).
2. Untuk tiap kelurahan: `getCuacaBmkg(kode)` (cache 3 jam), lalu `evaluasiPeringatan`, lalu upsert `peringatan_status`.
3. Kirim push sesuai dedupe (`web-push`, VAPID). Respons 404/410 → hapus subscription.
4. Log ringkasan (jumlah dievaluasi, dikirim, dihapus).

Batas BMKG ±60 request/menit per IP: proses dengan konkurensi 5 dan jeda, maksimal ±50 kelurahan per run (cukup untuk lomba). Banner untuk kelurahan yang belum pernah dievaluasi: evaluasi on-demand di `/api/peringatan/[kode]` (dengan cache).
