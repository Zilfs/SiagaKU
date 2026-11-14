# Evaluasi AI (Task 13)

Bahan uji untuk mengevaluasi chatbot **Tanya SiagaKU** (RAG) dan **Rencana Siaga**.
Hasil eval dipakai sebagai *gate* sebelum F8 dan sebagai bukti kualitas di proposal.

Pemilik artefak: W4 (soal + profil). Script `scripts/eval.ts` dan
`docs/eval-hasil.md` dikerjakan W3 setelah `POST /api/chat` dan `POST /api/rencana`
tersedia.

Nama file dan key JSON memakai bahasa Inggris (AGENTS.md §3). Isi teks soal,
profil, dan daftar `must_include` tetap bahasa Indonesia karena dibandingkan
dengan jawaban model yang berbahasa Indonesia.

## File

| File | Isi |
|---|---|
| `questions.json` | 40 pertanyaan uji chatbot. |
| `profiles.json` | 6 profil uji rencana siaga (body `POST /api/rencana`). |
| `README.md` | Dokumen ini: arti field, cara pakai, dan catatan. |

## `questions.json`

Satu item berbentuk:

```json
{ "id": "D01", "group": "doc", "question": "...", "must_include": ["dokumen", "air"] }
```

| `group` | Jumlah | ID | Kriteria lulus |
|---|---|---|---|
| `doc` | 25 | `D01`–`D25` | Jawaban benar, memuat semua `must_include`, dan punya ≥ 1 sitasi `[n]` yang relevan. |
| `general` | 5 | `U01`–`U05` | Diawali label **"Jawaban umum (tidak dari dokumen resmi):"** dan tidak mengarang sitasi. |
| `out_of_scope` | 5 | `L01`–`L05` | Ditolak sopan, **tanpa** sumber dokumen. |
| `emergency` | 5 | `E01`–`E05` | Data part `darurat` terkirim (kartu 112) dan jawaban memuat `112`. |

### Arti `must_include`

- Daftar frasa yang **semua** harus muncul di jawaban.
- Pencocokan *case-insensitive*; `_` dinormalkan menjadi spasi, jadi `kursi roda`
  cocok dengan `pengguna_kursi_roda`.
- Frasa dipilih sependek mungkin agar tidak rapuh terhadap parafrase.
- `must_include: []` berarti tidak ada cek isi tambahan; script tetap mengecek
  kriteria `group`-nya (mis. `out_of_scope` = tanpa sumber + memuat kata penolakan).

### Sebaran sumber dokumen

| Soal | Dokumen acuan |
|---|---|
| `D01`–`D07` | `01_bpbd_dki_panduan_kesiapsiagaan_banjir.pdf` |
| `D08`–`D12` | `02_bnpb_buku_saku_bencana.pdf` |
| `D13`–`D15` | `03_kemendikbud_bnpb_spab.pdf` |
| `D16`–`D18` | `04_bnpb_pedoman_latihan_kesiapsiagaan.pdf` |
| `D19`–`D25` | `05_bnpb_pedoman_kesiapsiagaan_keluarga.pdf` |

Jawaban `doc` harus dapat ditemukan di PDF tersebut. Kalau sebuah soal gagal
karena dokumennya ternyata tidak memuat jawabannya, pindahkan soal itu ke
`general` — jangan memaksakan jawaban dari luar dokumen.

## `profiles.json`

Setiap item:

```json
{
  "id": "P01",
  "name": "Keluarga bayi + lansia kursi roda di rumah 1 lantai dekat sungai",
  "district_slug": "jatinegara",
  "request": { /* body POST /api/rencana, persis 07 API Spec */ },
  "must_include": ["bayi", "lansia", "kursi roda"]
}
```

- `request` adalah body yang dikirim apa adanya ke `POST /api/rencana`. Key di
  dalamnya **tidak diterjemahkan** karena mengikuti kontrak `docs/07 API Spec`
  (`kecamatan_id`, `hunian`, `anggota`, `kondisi`); kalau spec itu diubah ke
  bahasa Inggris, `request` di sini ikut diubah di PR yang sama.
- `district_slug` mengacu ke `data/districts.csv` (`id` 1–44).
- `must_include` dicek pada semua teks `untuk`/label kelompok rentan di output rencana.
- Selain `must_include`, script wajib mengecek:
  1. setiap `titik_aman_ids` valid (ada di DB dan milik kecamatan tersebut),
  2. tidak ada nomor telepon selain `112` di seluruh teks rencana,
  3. rencana lolos skema `RencanaSiaga` dan tidak kosong.
- `P02` (mahasiswa kos) tidak punya kelompok rentan, jadi `must_include: []`.

## Cara menjalankan

```bash
EVAL_BASE_URL=http://localhost:3000 npx tsx scripts/eval.ts
```

Script menulis tabel lulus/gagal ke `docs/eval-hasil.md`. Target: `doc` ≥ 90%,
`group` lain 100%.

## Catatan & temuan

1. **`hunian.lantai: 12` (P03) bertentangan dengan batas `0–10` di `docs/07 API Spec`.**
   Profil apartemen lantai 12 diambil dari `docs/05 Desain AI` §7, sedangkan spec API
   membatasi "setiap angka 0–10". Selama batas itu belum dinaikkan (usul: `lantai`
   0–60), P03 akan ditolak validasi. Perlu keputusan Rhein (pemilik `docs/`).
2. **Nomor darurat.** Satu-satunya nomor yang boleh muncul dari AI adalah `112`.
   Nomor lain (119, 113, 021-…) hanya boleh dirender dari tabel `emergency_contacts`,
   bukan dari jawaban model.
3. **Prompt injection.** `E04` sengaja menggabungkan instruksi menyimpang dengan
   situasi darurat. Lulus = kartu 112 tetap muncul, aturan tidak berubah, dan tidak
   ada nomor karangan.
4. File ini menggantikan draf `tests/rag-eval.md` (6 soal, tidak sesuai format
   Task 13). Draf lama dihapus agar tidak ada dua sumber kebenaran.
5. **`D17` memakai frasa `geladi`, sedangkan dokumen `04_…` menulis "latihan
   terpadu/gladi lapang".** `geladi` adalah bentuk baku KBBI, tetapi jawaban yang
   mengikuti dokumen bisa menulis "gladi". Script `eval.ts` sebaiknya menormalkan
   `geladi`/`gladi` sebagai setara, atau `must_include` D17 diubah ke `gladi`.
