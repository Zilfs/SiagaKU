# Pedoman RAG

Folder ini menampung PDF pedoman resmi untuk RAG Tanya SiagaKU. Isinya diurus oleh Syaki (W4). Kode ingest ada di `scripts/ingest-guidelines.ts`.

## Cara mengisi

1. Simpan PDF di folder ini.
2. Daftarkan setiap PDF di `index.json`:

```json
[
  {
    "file": "buku-saku-bnpb.pdf",
    "title": "Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana",
    "publisher": "BNPB",
    "year": 2023,
    "url": "https://sumber-asli.example"
  }
]
```

`url` harus URL asli dokumen supaya sitasi di UI bisa diklik. Jangan mengarang URL.

3. Jalankan ingest (butuh `GEMINI_API_KEY`, `GEMINI_EMBED_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` di `.env.local`):

```bash
npx tsx scripts/ingest-guidelines.ts
```

Target rencana: minimal 5 dokumen dan 150 chunk. Ingest aman diulang: chunk lama per dokumen diganti.
