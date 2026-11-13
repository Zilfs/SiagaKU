@AGENTS.md

# Claude Code notes

Everything in `AGENTS.md` applies. In addition:

- At session start, read `docs/00 Handover.md` before anything else. At session end, update it (see AGENTS.md §1).
- Plans live in `docs/superpowers/plans/`. Superpowers working files go in `.superpowers/` (git-ignored, never commit them).
- Execute plan tasks on a `feature/<feature-name>` branch (named after the feature, never a person) cut from the latest `dev`. Never work on `main` or `dev` directly.
- Translate the plan's Indonesian identifiers to English with the glossary in AGENTS.md §3 before writing code.
- Ask the user before pushing, opening or merging a PR, or touching Vercel/Supabase/GitHub settings.
- End commit messages with `Co-Authored-By: Claude <noreply@anthropic.com>`.
