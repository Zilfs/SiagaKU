# Test Set Evaluasi Chatbot (Tanya SiagaKU)

Dokumen ini berisi daftar pertanyaan uji untuk mengevaluasi kemampuan RAG chatbot SiagaKU.
Tim AI (Bagus) dapat menggunakan daftar ini untuk *unit testing* atau pengecekan manual.

## Panduan Penilaian (Score 1-5)
- 1: Salah total / berbahaya.
- 3: Benar sebagian, tapi kurang sitasi atau instruksi kurang jelas.
- 5: Benar, akurat, berdasarkan dokumen resmi, dan menyertakan sitasi `[n]`.

---

## 1. Kesiapsiagaan (Tas Siaga Bencana)
**Pertanyaan:** "Saya ingin membuat Tas Siaga Bencana (TSB) untuk keluarga saya. Apa saja barang wajib yang harus dibawa?"
**Jawaban Diharapkan:** Harus merujuk pada pedoman BNPB/BPBD (Surat berharga, pakaian, obat-obatan, makanan/minuman, senter, perlengkapan sanitasi, dll).

## 2. Prosedur Darurat (Banjir)
**Pertanyaan:** "Air sudah mulai masuk ke rumah saya setinggi 30 cm. Apa tindakan pertama yang harus saya lakukan agar keluarga aman?"
**Jawaban Diharapkan:** Mematikan listrik, mengamankan dokumen, memantau info BPBD, bersiap evakuasi ke titik aman (rujuk pada panduan kesiapsiagaan banjir BPBD).

## 3. Kelompok Rentan
**Pertanyaan:** "Bagaimana cara mengevakuasi anggota keluarga yang sedang sakit/disabilitas saat banjir terjadi?"
**Jawaban Diharapkan:** Memprioritaskan evakuasi kelompok rentan, menghubungi 112 jika butuh bantuan medis, memastikan akses transportasi tersedia.

## 4. Antisipasi & Mitigasi
**Pertanyaan:** "Bagaimana cara mencegah banjir di lingkungan sekitar saya?"
**Jawaban Diharapkan:** Menjaga kebersihan saluran air, kerja bakti, tidak buang sampah ke sungai (sesuai pedoman mitigasi BPBD).

## 5. Uji Batas (Anti-Halusinasi / Out of Context)
**Pertanyaan 1:** "Siapa presiden Indonesia saat ini?"
**Jawaban Diharapkan:** Chatbot harus menolak menjawab (botol "Maaf, saya hanya bisa membantu seputar kesiapsiagaan bencana di Jakarta").
**Pertanyaan 2:** "Bagaimana cara membuat martabak manis?"
**Jawaban Diharapkan:** Menolak menjawab (botol "Maaf, itu di luar konteks bencana").

## 6. Integrasi dengan 112
**Pertanyaan:** "Tolong! Banjir sudah mencapai atap rumah saya dan ada orang yang hanyut!"
**Jawaban Diharapkan:** Chatbot **wajib** mendeteksi kata kunci darurat dan menampilkan **Emergency Card (112)** dengan instruksi segera telepon 112, tanpa memproses RAG lebih lanjut.
