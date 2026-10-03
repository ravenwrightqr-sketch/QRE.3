# QRE DOCUMENTATION INDEX

**Status:** canonical documentation entry point
**Branch:** `fuck-you-bitch-is-awake`
**Updated:** 2026-10-03

This directory is intentionally small. Current architecture must have one obvious source of truth. Old competing Author plans, audits, movie-search architecture notes, and duplicate canonical references are removed rather than left available to create drift.

## Current canonical references

| Document | Purpose |
|---|---|
| `AUTHOR_CURRENT.md` | Current Author doctrine, live architecture, proven behavior, hard boundaries |
| `AUTHOR_ROADMAP.md` | Ordered finish plan: Identity -> treatment preservation/AUTO -> Playout/media |
| `PLAYOUT_AND_MEDIA_PLAN.md` | Author-to-presentation boundary, reveal splitting, TEXT/IMAGE/VIDEO composition |
| `author-validation-20261003.md` | Captured cross-domain validation evidence for the current checkpoint |
| `RUNTIME_AND_ANALYTICS_CURRENT_STATE.md` | Runtime / analytics boundary outside Author |
| `LAUNCH_READINESS.md` | Deployment / launch readiness |
| `SUPABASE_SETUP.md` | Supabase / Prisma setup |

## Historical evidence

`AUTHOR_CHANGELOG.md` is history only. It is not current architecture truth.

`author-cognition-writing-audit-20261001.md` is retained as dated diagnostic evidence only. It must not override `AUTHOR_CURRENT.md` or `AUTHOR_ROADMAP.md`.

## Precedence

When documents disagree:

1. Executed source and deterministic regressions win.
2. `AUTHOR_CURRENT.md` defines current Author doctrine and boundaries.
3. `AUTHOR_ROADMAP.md` defines intended next work.
4. `PLAYOUT_AND_MEDIA_PLAN.md` defines the presentation/media handoff.
5. Dated validation/audit files are evidence, not architecture authority.
6. Historical changelog entries never override current docs.

## Documentation law

- Do not create another "canonical", "master", "beast", "next world", or competing Author architecture document.
- Update `AUTHOR_CURRENT.md` in the same change that alters Author architecture.
- Update `AUTHOR_ROADMAP.md` when priorities or remaining work change.
- Update `PLAYOUT_AND_MEDIA_PLAN.md` when the Author/presentation boundary changes.
- Add dated validation records only when they contain executed evidence.
- Delete superseded doctrine once its useful information has been absorbed into the canonical documents.
- Product examples may illustrate behavior but must not become hardcoded prompt law.

## Current checkpoint

The current Playout checkpoint keeps Author semantics separate from presentation and adds deterministic TEXT reveal splitting plus Playout-owned `durationMs`. Remaining presentation work is IMAGE/VIDEO composition, frontend Playout rendering, and item-level analytics.
