# AGENTS.md

Guide for anyone (human or AI agent) working in this repo.

SiagaKU is a flood-preparedness web app for DKI Jakarta residents, built for the IT RUSH 2026 web development competition. It is a Next.js 16 monolith on Vercel with Supabase (Postgres + pgvector) and an AI router (Gemini → Groq → alternative).

## 1. Read the docs first

All product and technical docs live in `docs/` (written in Indonesian). Read in this order:

1. `docs/00 Handover.md`: current status, decisions, open risks, next steps. **Always read this first.**
2. `docs/13 Implementation Plan.md`: the implementation plan (17 tasks, global constraints, interfaces, tests). It is plain Markdown and needs no special tooling. Each task lists its files, interfaces, tests and steps.
3. The spec docs the task points to:

| Doc | Use it for |
|---|---|
| `01 Design Doc`, `02 PRD` | Scope, features F1–F8, priorities (the spec has the final say) |
| `03 Arsitektur Sistem` | Architecture, env variables, request flows |
| `04 Fitur & Alur Pengguna` | User flows, empty/loading/error states |
| `05 Desain AI` | Prompts, zod schemas, RAG, fallbacks, eval |
| `06 Data & Database` | DB schema, seeding, early-warning logic |
| `07 API Spec` | Request/response shapes, error format |
| `08 UI-UX` | Visual identity, wireframes, PWA |
| `09 Timeline & Pembagian Tugas` | Daily plan, owners (PIC) |
| `10 Deliverables Lomba`, `11 Risiko & Mitigasi`, `12 Referensi & Sumber Data` | Competition deliverables, risks, data sources |
| `14 Struktur Kode` | Feature-based code structure, dependency rules, plan path → new path mapping (see §8) |

`docs/` is synced from the project owner's (Rhein) Obsidian vault. To change a doc, open a PR and tell Rhein so the vault stays in sync.

### Handover

Update `docs/00 Handover.md` at the end of any work session that changes project state: what is done, new decisions, open problems, and the next steps in order. Keep its existing structure. Commit it with `docs: update handover`.

## 2. Team ownership

| Workstream | Owner | Plan tasks |
|---|---|---|
| W1 Frontend & UX | Ukon | T8, T10 UI, T11 UI, T14 UI/PWA, T15 UI, T16 |
| W2 Backend & Data Platform | Rhein (integrator, reviews & merges) | T1, T2, T3, T6, T7, T12, T14 backend, T17 smoke |
| W3 AI | Bagus | T5, T9, T10 backend, T11 generate, T13, T14 push API |
| W4 Data, Content & Docs | Syaki | T4 data, T9 guideline PDFs, T13 questions, T17 README, proposal, video |

## 3. Language rules

**English** for everything engineering-facing:
- class, type, interface, function, method, variable, constant and enum names
- file and folder names (except page routes, see below)
- API route paths, DB tables/columns, JSON keys, zod schema fields, env vars
- code comments, test names, branch names, commit messages, PR titles and descriptions

**Indonesian** only for user-facing content:
- UI copy, labels, error messages shown to users, AI prompt instructions and AI output
- page route segments under `src/app/(site)/` (they are URLs judges and users see): `/wilayah/[slug]`, `/peta`, `/rencana`, `/tanya`, `/peringatan`, `/lapor`, `/laporan`, `/tentang`
- the docs in `docs/`

The plan and spec use Indonesian identifiers (e.g. `hitungSkorRisiko`, table `kecamatan`, field `titik_aman_ids`). Translate them to English with the glossary below while keeping the meaning, shape and tests. Indonesian display values (e.g. level `Sangat Tinggi`) stay as labels mapped from English enum values.

| Indonesian | English |
|---|---|
| kecamatan / kelurahan / kota / wilayah | district / subdistrict / city / area |
| risiko, skor, level | risk, score, level |
| kerawanan (dasar) | (base) vulnerability |
| hujan, cuaca, prakiraan | rainfall, weather, forecast |
| banjir, riwayat banjir, rob, pesisir | flood, flood history, tidal flood, coastal |
| titik aman, posko | safe point, shelter |
| darurat, kontak darurat | emergency, emergency contact |
| rencana siaga | preparedness plan |
| penjelasan, tindakan utama | explanation, main action |
| peringatan dini | early warning |
| laporan / lapor | report |
| tanya | ask |
| pedoman, sumber | guideline, source |
| anggota (keluarga), disabilitas, hewan | (household) member, disability, pet |
| jarak, terdekat, hitung | distance, nearest, calculate |
| iklim | climate |
| Rendah / Sedang / Tinggi / Sangat Tinggi | `low` / `moderate` / `high` / `very_high` |
| Normal / Waspada / Siaga / Awas | `normal` / `advisory` / `watch` / `warning` |

Examples: `hitungSkorRisiko` → `calculateRiskScore`, `kecamatanTerdekat` → `findNearestDistrict`, `src/lib/rencana/` → `src/lib/plan/`, table `riwayat_banjir` → `flood_events`, `/api/risiko/[id]` → `/api/risk/[id]`. If a term is missing here, add it to this table in the same PR.

## 4. Commit messages: Conventional Commits

Format: `<type>(<optional scope>): <imperative summary in English, lowercase, no period>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Breaking change: `feat(api)!: ...` or a `BREAKING CHANGE:` footer.

```
feat(chat): stream answers with source citations
fix(risk): treat null rainfall as missing data
test(plan): cover unknown safe point ids
docs: update handover
```

Commits written with an AI coding assistant end with a trailer, e.g. `Co-Authored-By: Claude <noreply@anthropic.com>`. The competition requires declaring AI assistance, and this keeps it traceable.

## 5. Branching and pull requests

```
main  ← production (Vercel). Only receives PRs from dev.
dev   ← integration. Only receives PRs from feature/fix branches.
feature/<feature-name>, fix/<bug-name>  ← always branched from dev (kebab-case English, e.g. feature/chat-bot)
```

1. **Start a feature** from the latest `dev`:
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b feature/chat-bot
   ```
2. **Before every work session on the branch**, and again right before opening the PR, pull the latest `dev` into it:
   ```bash
   git checkout feature/chat-bot
   git pull origin dev        # merge; resolve conflicts, run checks, commit
   ```
3. **Push** the branch: `git push -u origin feature/chat-bot`
4. **Open a PR to `dev`** when the feature is done (`gh pr create --base dev`). The PR title follows Conventional Commits. The PR needs:
   - green CI (lint, typecheck, test)
   - a review and a manual try by one other team member (the definition of done in `docs/09`)
5. **Release**: Rhein opens a PR `dev` → `main` after integration checks pass on a Vercel preview.

Rules:
- One feature per branch. The branch name is the **feature name, never a person's name**: `feature/chat-bot`, `feature/risk-map`, `fix/null-rainfall` (not `feature/bagus`).
- Never commit directly to `main` or `dev`.
- **Never `git push --force` and never rebase or rewrite pushed history.** The competition rules forbid manipulating commit history. Sync with `git pull origin dev` (merge), not rebase.
- Deleting a branch after merge is allowed, but **AI agents must ask a human (the PR author or Rhein) and get confirmation first**, every time. This covers `gh pr merge --delete-branch`, `git push --delete` and `git branch -D` on shared branches.
- Before changing code, AI agents check that the current branch matches the work. If the work does not belong on the current branch (e.g. a different feature, or the branch is `dev`/`main` or already merged) and a new branch seems needed, **ask a human to confirm the branch name and its base before creating it**. This keeps features off the wrong branch.

## 6. Engineering constraints (from the plan)

- Next.js 16 App Router, TypeScript `strict: true`, Node ≥ 20.
- Supabase is accessed **server-side only** (service role, `import 'server-only'`). RLS is on for every table. The browser only uploads through signed URLs.
- AI model ids **always come from env**. The provider order is gemini → groq → alt. Switch providers on 429/5xx/timeout/invalid output; never switch on a safety block. Every AI feature has a non-AI fallback.
- Safe points and emergency contacts come **only from the DB**. The only phone number AI output may contain is `112`.
- No login. No name, address or phone fields in any form.
- API error format: `{ "error": { "code": "...", "message": "..." } }` with code `INVALID_INPUT|NOT_FOUND|RATE_LIMITED|UPSTREAM_FAILED|INTERNAL`.
- Never commit secrets. Only `.env.example` is tracked.
- Every new library, asset or AI coding assistant gets an entry in `CREDITS.md` in the same PR.
- Write tests first for logic (Vitest, in `tests/`, mirroring `src/`).

## 7. Commands

```bash
npm run dev        # local dev server
npm run lint
npm run typecheck  # next typegen && tsc --noEmit
npm test           # vitest run
npm run build
npm run format     # prettier --write .
```

Run `lint`, `typecheck` and `test` before pushing. CI runs the same checks.

## 8. Architecture: feature-based

Full details, examples and the plan path mapping: `docs/14 Struktur Kode.md`.

```
src/
├── app/          # routes only: thin pages and route handlers
├── components/   # shared UI (ui/ = shadcn, layout/, map/, risk-badge.tsx)
├── lib/          # shared core: env, db, data (cache, bmkg, open-meteo), risk scoring, ai router, http, rate-limit, geo
└── features/     # one module per feature: risk, plan, chat, early-warning, report
    └── <feature>/
        ├── components/   # feature UI
        ├── server/       # server-only services (DB, AI, external APIs); first line `import 'server-only';`
        ├── schemas.ts    # zod
        ├── types.ts
        └── *.ts          # pure logic, usable on client and server
```

Rules:
1. Dependencies flow one way: `app → features → components/lib`. A feature never imports another feature. `lib/` and `components/` never import `features/`. When two features need the same code, move it to `lib/` or `components/` in the same PR.
2. `app/` stays thin. Pages call `features/<f>/server/*` and render components. Route handlers validate input (zod), apply the rate limit, call a service and return a `Response`. There are no DB queries or AI prompts in `app/`.
3. Components never touch the DB or AI directly. Client components call route handlers with `fetch` (or `useChat` for chat).
4. No barrel `index.ts` files. Import file paths directly, so server code does not leak into client bundles.
5. Create only the folders a feature needs.
6. Files are kebab-case (`risk-badge.tsx`); React components are exported in PascalCase (`RiskBadge`). Tests mirror `src/` (`tests/lib/…`, `tests/features/<f>/…`).
7. **The plan's file map is superseded.** Translate each plan path with the table in `docs/14 Struktur Kode.md` §6.
