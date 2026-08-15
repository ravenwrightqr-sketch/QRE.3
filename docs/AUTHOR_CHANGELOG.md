# QRE Author Changelog

This is the permanent experimental memory for the QRE Author.

Historical entries remain below, but the latest **CURRENT TRUTH** section overrides stale implementation claims.

## Working Rules

- Trace the full influence graph before changing author/cognition/compiler behavior.
- One canonical change at a time.
- Run the real Ollama runtime after meaningful changes.
- Inspect raw output, validated output, and production-path output.
- Learn general mechanisms, not phrase blacklists.
- Never weaken quality gates to make tests green.
- After 2–4 meaningful experiments, update this file and the architecture index.

---

## CURRENT TRUTH — 2026-08-15

### One brain / one path / one acceptance harness

The author architecture is now intentionally consolidated:

```text
PRODUCTION
experienceService
→ microBeatMouth / cinematicAuthor adapters
→ authorBrainUniversal

ACCEPTANCE
author-acceptance-suite
→ authorBrainUniversal
```

Both paths enter the **same Master Author**.

### Master Author

`apps/api/src/services/authorBrainUniversal.ts`

This is the only Goal-1 creative author authority.

It must remain a living intelligence core: expand it when a general creative law is discovered; never reintroduce domain-specific or benchmark-specific author branches.

### Production adapters

`apps/api/src/services/microBeatMouth.ts`

- projection/runtime adapter only
- no independent author
- no fixed creative beat count

`apps/api/src/services/cinematicAuthor.ts`

- rendering adapter only
- no independent author
- no critique/repair author loop
- no fixed creative beat count

### Canonical acceptance harness

`apps/api/author-acceptance-suite.ts`

Cases currently preserved:

```text
COCO
COCO-RETURN
MARIA
HORROR
RAVE
```

Run with:

```powershell
pnpm author:fast -- COCO
```

The harness calls `authorBrainUniversal` directly. There is no test-only author bridge and no test-only creative prompt enrichment.

### Deleted author junk

Removed:

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/authorBrainMomentum.ts
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
apps/api/src/services/authorFastCore.ts
apps/api/src/services/creativeRelationOps.ts
```

### Deleted test junk

Removed the accumulated one-off API author benchmark scripts.

The single replacement is:

```text
apps/api/author-acceptance-suite.ts
```

### Upstream cognition remains authoritative

Keep and evolve:

```text
packages/engine/src/cognition/universalMind.ts
packages/engine/src/cognition/worldModel.ts
packages/engine/src/cognition/significanceEngine.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/mindState.ts
```

These provide world understanding, significance, creative candidate search, planning, and learning. They are upstream cognition, not competing mouths.

### Cut policy

`apps/api/src/services/authorCutPolicy.ts` is the intended single semantic cut evaluator.

The next implementation task is to converge Universal Author validation on this service and eliminate remaining duplicate cut-validation logic.

### Core creative laws

```text
identity is baseline
truth ≠ attention
source state ≠ plot instruction
emotion ≠ automatic story arc
creative interpretation ≠ invented event
questions belong in hidden cognition
provider/service is usually stage context
subject/world gravity
compressed impact > word-count fetish
one cut = one attention moment
next cut must earn itself
recurrence requires evidence
sparse world → smaller invented-world surface
```

### Test integrity invariant

> **The test must not influence the production path, and the production path must not use a different author from the test.**

A benchmark is an observer. The Master Author is the authority.

### Next engineering target

Converge every semantic cut-validation call onto `authorCutPolicy.ts`, then run the same acceptance matrix through both the direct harness and the actual production compile path.

---

## HISTORICAL ENTRIES

Older experiments are retained as evidence of discovered creative laws. They are not implementation authority.

Key durable findings include:

- QRE is splicing film, not writing a conventional paragraph.
- Two-word cuts can be powerful when they carry high implied context.
- Shortness itself is not the objective.
- A fact can be true without earning an attention cut.
- Emotional states are evidence, not automatic plot structure.
- Generic transformation arcs are a common failure mode.
- Service providers are usually stage context rather than protagonists.
- Questions belong in hidden cognition unless they are supplied source language.
- Sparse inputs should produce tighter creative implication rather than fabricated backstory.
- Returning chapters must change meaning rather than replay earlier chapters.
- `Lawyer informed.` and `Pink bows everywhere.` are reference behaviors for compressed implication, not literal templates.

See:

`docs/QRE_AUTHOR_GOAL.md`
`docs/AUTHOR_ARCHITECTURE_INDEX.md`
`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`
