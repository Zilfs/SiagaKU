# Pedoman Kesiapsiagaan (Bahan RAG)

Folder ini berisi dokumen PDF resmi yang digunakan sebagai basis pengetahuan (knowledge base)
untuk fitur **Tanya SiagaKU** (Chatbot RAG).

Dokumen ini akan diproses oleh tim AI (Bagus) menggunakan `pgvector` dan Gemini Embedding
untuk memberikan jawaban yang akurat berdasarkan pedoman resmi.

## Daftar Dokumen

| File | Judul Dokumen | Penerbit | Tahun | Sumber |
|---|---|---|---|---|
| `01_bpbd_dki_panduan_kesiapsiagaan_banjir.pdf` | Panduan Kesiapsiagaan Menghadapi Banjir Bagi Masyarakat | BPBD DKI Jakarta | 2021 | [Link](https://ppid.jakarta.go.id/assets/pdf/buku-saku-panduan-kesiapsiagaan-menghadapi-banjir-bagi-masyarakat.pdf) |
| `02_bnpb_buku_saku_bencana.pdf` | Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana | BNPB | 2019 | [Link](https://bnpb.go.id/storage/app/media/uploads/24/buku-data-bencana/6-buku-saku-cetakan-4-2019.pdf) |
| `03_kemendikbud_bnpb_spab.pdf` | Buku Saku Satuan Pendidikan Aman Bencana (SPAB) | Kemendikbudristek & BNPB | 2020 | [Link](https://spab.kemendikdasmen.go.id/web/files/FINAL_Buku_SPAB_Versi-2_Bahasa_20DES.pdf) |
| `04_bnpb_pedoman_latihan_kesiapsiagaan.pdf` | Buku Pedoman Latihan Kesiapsiagaan Bencana Nasional | BNPB | 2017 | [Link](https://unmerbaya.ac.id/file/content/2024/04/buku_panduan_siaga_usr_w21_unmer.pdf) |
| `05_bnpb_pedoman_kesiapsiagaan_keluarga.pdf` | Panduan Kesiapsiagaan Bencana untuk Keluarga | BNPB | 2019 | [Link](https://ppid.bpsdmd.jatengprov.go.id/assets/upload/informasi/informasi_serta_merta_1640654240.pdf) |

Ukuran total kelima file ± 67 MB. Nama file sengaja diberi prefix `01`–`05` agar urutan
*ingest* deterministik.

> **Catatan sumber `04`:** URL di tabel masih mengarah ke salinan di `unmerbaya.ac.id`,
> bukan situs resmi BNPB. Syaki (W4) sedang mengecek ulang. Kalau URL resmi ditemukan,
> ganti link di tabel ini **dan** `url` entri `04` di `index.json` agar sitasi tetap benar.

## Metadata ingest (`index.json`)

Setiap PDF wajib terdaftar di `index.json` supaya judul, penerbit, tahun dan URL asli
tersimpan di tabel `documents` dan bisa dipakai sebagai sitasi yang bisa diklik:

```json
[
  {
    "file": "01_bpbd_dki_panduan_kesiapsiagaan_banjir.pdf",
    "title": "Panduan Kesiapsiagaan Menghadapi Banjir Bagi Masyarakat",
    "publisher": "BPBD DKI Jakarta",
    "year": 2021,
    "url": "https://sumber-asli.example"
  }
]
```

`file` harus sama persis dengan nama file PDF di folder ini. `url` harus URL asli dokumen;
jangan mengarang URL.

## Cara ingest

Butuh `GEMINI_API_KEY`, `GEMINI_EMBED_MODEL`, `NEXT_PUBLIC_SUPABASE_URL` dan
`SUPABASE_SERVICE_ROLE_KEY` di `.env.local`, lalu jalankan:

```bash
npm run rag:ingest
```

Target rencana: minimal 5 dokumen dan 150 chunk. Ingest aman diulang: chunk lama per
dokumen diganti. Kode ingest ada di `scripts/ingest-documents.ts` dan membaca
`data/guidelines/`.

## Cakupan Materi
Dokumen-dokumen di atas mencakup:
- Langkah-langkah sebelum, saat, dan sesudah banjir.
- Daftar barang penting dalam Tas Siaga Bencana (TSB).
- Panduan evakuasi untuk keluarga, sekolah, dan kelompok rentan.
- Cara penanganan darurat dan pertolongan pertama.
- Mitigasi bencana struktural dan non-struktural.

## Petunjuk Penggunaan
- **Tim AI:** Gunakan file-file ini untuk proses *chunking* dan *embedding*.
- **Integrator:** Jangan hapus file ini karena juri akan memverifikasi sumber data yang digunakan AI.
