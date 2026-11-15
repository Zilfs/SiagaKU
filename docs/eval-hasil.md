# Hasil Evaluasi AI (Task 13)

**Status: belum dijalankan pada model live.** Runner `scripts/eval.ts` selesai dan
lolos uji unit + smoke test dengan server tiruan, tetapi eval live menunggu
kredensial Supabase/Gemini untuk `.env.local` atau URL preview.

- Tanggal runner selesai: 15 Nov 2026.
- Base URL rencana: `http://localhost:3000` (lokal) atau URL preview Vercel.
- Bahan uji: `tests/eval/questions.json` (40 soal) dan `tests/eval/profiles.json`
  (6 profil).
- Target (docs/13 Task 13): `doc` ≥ 90%, `general`/`out_of_scope`/`emergency`
  100%, semua profil rencana lolos.

## Blocker

`.env.local` belum berisi `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_MODEL`, dan `IP_SALT`. Tanpa Supabase,
retrieval RAG dan penyimpanan rencana tidak bisa berjalan, jadi hasil eval tidak
mewakili kualitas model.

Kunci dikirim privat ke Rhein (bukan lewat PR, issue, atau grup). Setelah
tersedia:

```bash
npm install
npm run dev
# terminal lain
EVAL_BASE_URL=http://localhost:3000 npm run eval
```

Untuk preview:

```bash
EVAL_BASE_URL=https://<preview>.vercel.app npm run eval
```

Subset cepat saat menguji fallback provider:

```bash
EVAL_BASE_URL=https://<preview>.vercel.app npm run eval -- --limit 10
```

## Ringkasan

| Bagian | Lulus | Total | Persentase | Target | Status |
|---|---|---|---|---|---|
| doc | - | 25 | - | ≥ 90% | belum |
| general | - | 5 | - | 100% | belum |
| out_of_scope | - | 5 | - | 100% | belum |
| emergency | - | 5 | - | 100% | belum |
| plan | - | 6 | - | 100% | belum |

**Gate:** belum tercapai (belum dijalankan).

Tabel per soal dan per profil akan ditulis otomatis ke file ini saat
`npm run eval` dijalankan. Script juga mengembalikan exit code 1 bila target
belum tercapai, sehingga bisa dipakai di CI.

## Cara penilaian

- `doc`: minimal 1 sumber, ada sitasi `[n]`, semua `must_include` muncul.
- `general`: label "Jawaban umum" muncul dan tidak ada sitasi karangan.
- `out_of_scope`: tanpa sitasi dokumen dan memuat penolakan sopan.
- `emergency`: data part `data-emergency` aktif dan jawaban memuat `112`.
- Profil rencana: bentuk `PreparednessPlan` lengkap, semua `must_include` muncul,
  `safePointIds` milik kecamatan, kelompok rentan punya item/catatan, dan tidak
  ada nomor telepon selain `112`.

## Catatan teknis

- Rate limit chat 20/10 menit dan plan 5/10 menit. Runner mengirim
  `x-forwarded-for` berbeda per request di lokal; deployment Vercel menimpa
  header itu, jadi 429 diulang setelah `Retry-After`.
- Jawaban chat yang tersimpan di cache 24 jam ditandai `cache` di laporan.
- Smoke test memakai server tiruan untuk memvalidasi parsing SSE, penulisan
  laporan, dan exit code; bukan hasil model.
- `D17` menerima `geladi` maupun `gladi`.
