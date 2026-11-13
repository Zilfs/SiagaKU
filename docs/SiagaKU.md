---
title: SiagaKU
type: project
status: active
created: 2026-11-13
deadline: 2026-11-20
event: IT RUSH 2026 — Lomba Web Development (HIMATIF UNIB)
subtema: Mitigasi Bencana dan Perubahan Iklim
stack: [Next.js 16, TypeScript, Supabase, pgvector, Gemini, Groq, Leaflet, Vercel]
tags: [project, siagaku, lomba, it-rush-2026]
---

# 🛟 SiagaKU

> **Siaga banjir Jakarta, dimulai dari rumahmu.**
> Web app yang membantu warga DKI Jakarta mengecek risiko banjir wilayahnya hari ini, membuat rencana siaga keluarga yang dipersonalisasi AI, dan bertanya ke chatbot yang menjawab dari pedoman resmi BNPB/BPBD.

## Status
| | |
|---|---|
| Fase | Desain disetujui · rencana implementasi siap · menunggu eksekusi |
| Feature freeze | **Kam 19 Nov 2026, 12.00 WIB** |
| Submit (target) | **Jum 20 Nov 2026, 20.00 WIB** (batas 23.59) |
| Penjurian | 28–29 Nov 2026 · Pengumuman 30 Nov |
| Website live | _belum_ |
| Repo | _belum_ |

## Fitur
| ID | Fitur | AI | Prioritas |
|---|---|---|---|
| F1 | Cek Risiko Wilayah (peta + detail 44 kecamatan) | Penjelasan risiko | Must |
| F2 | Rencana Siaga Personal | Structured output + grounding DB | Must |
| F3 | Tanya SiagaKU | RAG + sitasi | Must |
| F8 | **Peringatan Dini** per kelurahan (banner + Web Push, PWA ringan) | — (rule-based, BMKG × kerawanan) | Should |
| F4 | Lapor Banjir | Vision | Could |
| F5 | Konteks Iklim | — | Dipotong (kartu statis) |
| F6 | Tentang & Metodologi | — | Must |
| F7 | Darurat 112 | — (rule-based) | Must |

## Dokumen
1. [[00 Handover]] (mulai di sini jika membuka sesi baru)
2. [[01 Design Doc]]: intent, goals, pendekatan, keputusan
3. [[02 PRD]]: kebutuhan produk lengkap
4. [[03 Arsitektur Sistem]]: stack, folder, env, alur, cache, keamanan
5. [[04 Fitur & Alur Pengguna]]: sitemap, golden path, edge case
6. [[05 Desain AI]]: router fallback, prompt, schema, RAG, eval
7. [[06 Data & Database]]: sumber data, rumus skor, skema SQL, seeding
8. [[07 API Spec]]: endpoint & kontrak
9. [[08 UI-UX]]: prinsip, token, wireframe, microcopy
10. [[09 Timeline & Pembagian Tugas]]: rencana harian & workstream
11. [[10 Deliverables Lomba]]: berkas, naskah video, proposal, README, QA
12. [[11 Risiko & Mitigasi]]: risk register & pertanyaan terbuka
13. [[12 Referensi & Sumber Data]]: sumber terverifikasi & kandidat
14. [[13 Implementation Plan]]: 17 task TDD siap dieksekusi

## Keputusan Kunci
- Banjir **DKI Jakarta**, granularitas **kecamatan**, **tanpa login**
- **Pendekatan A:** monolit Next.js + Supabase (pgvector RAG)
- AI: **Gemini** utama → **Groq** fallback → provider alternatif (opsional)
- Skor risiko = rumus transparan (kerawanan historis + prakiraan hujan), **estimasi, bukan prediksi**
- Data keselamatan (titik aman, kontak) **dari database**, bukan dikarang AI
- **Peringatan dini** per kelurahan: banner + Web Push (PWA), cron GitHub Actions tiap jam, status Normal/Waspada/Siaga/Awas

## Tim
| Jalur | PIC |
|---|---|
| W1 Frontend & UX | |
| W2 Backend & Data Platform | |
| W3 AI | |
| W4 Data, Konten & Dokumentasi | |

## Log
- **2026-11-13:** Brainstorming: pilih subtema mitigasi bencana & iklim → ide SiagaKU → fokus banjir Jakarta → stack Next.js + Supabase + Gemini/Groq → Pendekatan A. Design doc, PRD, dan dokumentasi teknis dibuat. Rencana implementasi dibuat. Ditambah **F8 Peringatan Dini** (banner + Web Push/PWA, per kelurahan); F4 turun ke Could, F5 dipotong.
