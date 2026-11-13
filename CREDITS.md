# Kredit

SiagaKU dibangun dengan pustaka dan alat sumber terbuka berikut:

- [Next.js](https://nextjs.org) dan [React](https://react.dev) - kerangka aplikasi web
- [Tailwind CSS](https://tailwindcss.com) - gaya
- [shadcn/ui](https://ui.shadcn.com) - komponen UI
- [Base UI](https://base-ui.com) (@base-ui/react) - primitif komponen tanpa gaya
- [lucide-react](https://lucide.dev) - ikon
- [class-variance-authority](https://cva.style) dan tw-animate-css - varian kelas dan animasi
- cn (paket npm `cn`) - pembantu penggabung nama kelas dari shadcn
- Font Geist (via next/font, Vercel, lisensi SIL OFL) - tipografi bawaan scaffold
- [zod](https://zod.dev) - validasi data dan env
- [Supabase](https://supabase.com) (@supabase/supabase-js) - klien basis data Postgres dan penyimpanan
- server-only (Vercel) - menjaga modul sisi server tidak masuk ke bundel browser
- [Vercel AI SDK](https://ai-sdk.dev) (`ai`) - panggilan model AI, streaming, structured output
- [@ai-sdk/google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai), [@ai-sdk/groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq), dan [@ai-sdk/openai-compatible](https://ai-sdk.dev/providers/openai-compatible-providers) - provider AI dan fallback
- [Vitest](https://vitest.dev) dan @vitejs/plugin-react - pengujian
- [Prettier](https://prettier.io) - pemformat kode
- [tsx](https://tsx.is) - menjalankan skrip TypeScript
- [ESLint](https://eslint.org) dan [TypeScript](https://www.typescriptlang.org) - lint dan pengecekan tipe

AI coding assistant: Claude Code (Anthropic) — digunakan untuk scaffolding dan implementasi.
