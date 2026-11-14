---
title: SiagaKU — API Spec
project: "[[SiagaKU]]"
type: tech-spec
status: draft
created: 2026-11-13
tags: [siagaku, api]
---

# API Spec (Next.js Route Handlers)

Terkait: [[03 Arsitektur Sistem]] · [[05 Desain AI]] · [[06 Data & Database]]

**Konvensi**
- Base: `/api`. JSON UTF-8. Semua input divalidasi zod. Error dikembalikan dengan format seragam:
```json
{ "error": { "code": "RATE_LIMITED", "message": "Terlalu banyak permintaan, coba lagi dalam 5 menit." } }
```
| HTTP | code |
|---|---|
| 400 | `INVALID_INPUT` |
| 401 | `UNAUTHORIZED` (token cron salah atau tidak ada) |
| 404 | `NOT_FOUND` |
| 429 | `RATE_LIMITED` |
| 502 | `UPSTREAM_FAILED` (data eksternal/AI gagal total) |
| 500 | `INTERNAL` |

- Respons AI menyertakan `meta: { provider, model, fallback: boolean, cached: boolean }`, berguna untuk debug dan demo.

---

## GET `/api/kecamatan`
Daftar kecamatan + level risiko ringkas (untuk peta dan pencarian).
```json
{
  "data": [
    { "id": 12, "slug": "jatinegara", "nama": "Jatinegara", "kota": "Jakarta Timur",
      "lat": -6.23, "lng": 106.87, "skor": 68, "level": "Tinggi", "pesisir_rob": false }
  ],
  "updated_at": "2026-11-14T07:00:00Z"
}
```
Skor dihitung server-side (dengan cache). Revalidate 15 menit.

## GET `/api/risiko/{id}`
Detail risiko satu kecamatan.
```json
{
  "kecamatan": { "id": 12, "slug": "jatinegara", "nama": "Jatinegara", "kota": "Jakarta Timur", "pesisir_rob": false },
  "skor": 68, "level": "Tinggi",
  "komponen": { "kerawanan_dasar": 80, "faktor_hujan": 70, "hujan_max_mm": 62.4, "kategori_hujan": "Lebat" },
  "cuaca_bmkg": { "sumber": "BMKG", "diperbarui": "...", "stale": false,
                  "slot": [ { "waktu_lokal": "2026-11-14 13:00", "suhu": 31, "kelembapan": 70, "cuaca": "Hujan Ringan", "ikon": "https://..." } ] },
  "riwayat": [ { "tanggal": "2025-03-03", "kelurahan": "Kampung Melayu", "tinggi_max_cm": 250, "sumber_url": "..." } ],
  "titik_aman": [ { "id": 31, "nama": "...", "jenis": "posko_resmi", "terverifikasi": true, "lat": -6.22, "lng": 106.86 } ],
  "iklim": { "kota": "Jakarta Timur", "series": [ { "tahun": 2016, "hari_hujan_lebat": 9 } ], "narasi": "..." }
}
```

## GET `/api/risiko/{id}/penjelasan`
```json
{ "penjelasan": "...", "tindakan_utama": "...", "meta": { "provider": "gemini", "model": "...", "fallback": false, "cached": true } }
```
Jika semua provider gagal: `200` dengan teks template dan `meta.provider = "template"`.

## POST `/api/rencana`
Rate limit: 5/10 menit per IP.
Request:
```json
{
  "kecamatan_id": 12,
  "hunian": { "jenis": "rumah_1_lantai", "lantai": 1 },
  "anggota": { "dewasa": 2, "anak": 0, "balita_bayi": 1, "lansia": 1, "ibu_hamil": 0,
               "disabilitas": [ { "jenis": "pengguna_kursi_roda" } ], "obat_rutin": 1, "hewan": ["kucing"] },
  "kondisi": { "kendaraan": "motor", "jarak_sungai": "dekat", "pernah_banjir": true }
}
```
Enum:
- `hunian.jenis`: `rumah_1_lantai | rumah_bertingkat | kos | apartemen`
- `disabilitas[].jenis`: `pengguna_kursi_roda | tunanetra | tunarungu | intelektual | lainnya`
- `kondisi.kendaraan`: `tidak_ada | motor | mobil | keduanya`
- `kondisi.jarak_sungai`: `dekat | sedang | jauh | tidak_tahu`

Batas: setiap angka 0–10, kecuali `hunian.lantai` 0–60 (apartemen Jakarta bisa di atas lantai 10); total anggota 1–15.

Response `201`:
```json
{ "slug": "k8f2ma9xq1", "url": "/rencana/k8f2ma9xq1", "meta": { "provider": "gemini", "fallback": false } }
```

## GET `/api/rencana/{slug}`
```json
{ "slug": "...", "created_at": "...", "kecamatan": {...}, "profil": {...},
  "rencana": { /* RencanaSiaga */ }, "titik_aman": [ ... ], "kontak_darurat": [ { "nama": "Jakarta Siaga", "nomor": "112" } ] }
```
(Halaman `/rencana/[slug]` sebaiknya query DB langsung dari RSC; endpoint ini untuk kebutuhan klien/eval.)

## POST `/api/chat`
Rate limit: 20 pesan/10 menit per IP. Streaming (AI SDK UI message stream).
Request:
```json
{
  "messages": [ { "role": "user", "content": "Apa yang harus disiapkan untuk bayi saat banjir?" } ],
  "kecamatan_id": 12
}
```
- `messages` maksimal 10 item, setiap `content` ≤ 1.000 karakter.
- Stream mengirim, berurutan: (1) data `{ type: "darurat", aktif: true }` bila terdeteksi; (2) data `{ type: "sources", items: [...] }`; (3) teks jawaban; (4) data `{ type: "meta", provider, model, fallback, cached }`.

## POST `/api/laporan/upload-url`
Rate limit: 5/jam per IP.
Request: `{ "content_type": "image/jpeg", "size": 734002 }` (maks 1,5 MB; jpeg/png/webp).
Response: `{ "path": "2026/11/14/uuid.jpg", "signedUrl": "...", "token": "..." }`

## POST `/api/laporan`
Request:
```json
{ "path": "2026/11/14/uuid.jpg", "lat": -6.225, "lng": 106.867, "deskripsi": "Air setinggi lutut di depan gang" }
```
Proses: validasi path milik bucket & baru dibuat → tentukan `kecamatan_id` dari koordinat (kecamatan dengan centroid terdekat, atau point-in-polygon jika GeoJSON ada) → simpan `ai_status='menunggu'` → panggil vision (sinkron, timeout 20 s) → update.
Response `201`:
```json
{ "id": "uuid", "ai_status": "selesai",
  "ai_hasil": { "apakah_banjir": true, "keparahan": 2, "estimasi_tinggi_air": "± 40 cm", "ringkasan": "...", "confidence": 0.82 } }
```

## GET `/api/laporan?jam=72`
Laporan `ai_status='selesai' AND apakah_banjir` dalam N jam terakhir **+ semua `is_demo`**.
```json
{ "data": [ { "id": "...", "lat": -6.2, "lng": 106.8, "foto_url": "...", "keparahan": 2, "ringkasan": "...", "is_demo": true, "created_at": "..." } ] }
```

## GET `/api/kelurahan?q=ceg`
Autocomplete kelurahan (trigram). `[{ "kode": "...", "nama": "Ceger", "kecamatan": "Cipayung", "kota": "Jakarta Timur" }]` (maks 10).

## GET `/api/peringatan/{kode}`
Status peringatan satu kelurahan (untuk banner & halaman `/peringatan`). Pakai `peringatan_status` jika `evaluated_at` < 1 jam; jika tidak, evaluasi on-demand.
```json
{ "kelurahan": { "kode": "...", "nama": "Ceger", "kecamatan_slug": "cipayung" },
  "status": "Siaga", "skor": 62, "hujan_24j_mm": 38.5, "kategori_hujan": "Sedang",
  "jendela": { "mulai": "2026-11-18T15:00:00+07:00", "selesai": "2026-11-18T18:00:00+07:00" },
  "evaluated_at": "...", "sumber": "BMKG" }
```

## POST `/api/push/subscribe`
Request: `{ "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } }, "kelurahan_kode": "..." }`
Upsert by `endpoint` (ganti kelurahan jika sudah ada). Rate limit 10/jam per IP. Response `201 { "ok": true }`.

## POST `/api/push/unsubscribe`
Request: `{ "endpoint": "..." }` → hapus. `200 { "ok": true }`.

## POST `/api/push/test`
Request: `{ "endpoint": "..." }` (harus terdaftar). Kirim notifikasi contoh: judul "🔔 Notifikasi uji SiagaKU", isi "Peringatan banjir untuk {kelurahan} sudah aktif. Contoh: ⚠️ Potensi banjir, hujan lebat diperkirakan 15.00–18.00 WIB." Rate limit 3/10 menit per IP.

## POST `/api/cron/peringatan`
Header `Authorization: Bearer ${CRON_SECRET}` (tanpa itu 401). Menjalankan alur di [[06 Data & Database#7. Logika Peringatan Dini]]. Response: `{ "dievaluasi": 23, "dikirim": 4, "dihapus": 1, "durasi_ms": 18342 }`.

## GET `/api/health`
```json
{ "ok": true, "db": "ok", "providers": { "gemini": "ok", "groq": "ok", "alt": "skip" }, "time": "..." }
```
- Tanpa parameter: hanya cek DB (murah). `?deep=1` dengan header `Authorization: Bearer ${CRON_SECRET}`: ping setiap provider dengan prompt 1 token.
- Dipanggil Vercel Cron harian (keep-alive Supabase).
