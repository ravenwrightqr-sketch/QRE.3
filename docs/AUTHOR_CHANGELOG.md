# QRE Author Changelog

This file is the permanent experimental memory for the QRE author system.

**Important:** this file contains historical entries. The latest "Current Truth" section overrides older implementation claims.

## Working Rules

- Change one meaningful author behavior at a time whenever practical.
- Trace the full influence graph before changing author/cognition/compiler behavior.
- Run the real Ollama runtime after meaningful changes.
- Inspect actual sequences, raw output, validated output, and production-path output.
- Keep creative benchmarks focused on capabilities, not exact prose.
- Record why a rule exists and what subsystem owns it.
- Never weaken a benchmark merely to make it green.
- After 2–4 meaningful experiments, update the strategic documentation.

---

## CURRENT TRUTH — 2026-08-15

### Production author convergence: first step complete

The production micro-beat adapter now calls the canonical Universal Author directly:

```text
experienceService
→ microBeatMouth
→ authorBrainUniversal
```

The legacy `authorBrain.ts` is no longer the production author called by `microBeatMouth.ts`.

Production sequence length is now **earned**, not forced to 4 or 5 cuts. The adapter caps output at six cuts for runtime safety, while allowing two-cut sequences to be valid.

### Remaining production convergence

`cinematicAuthor.ts` still calls legacy `authorBrain.ts` and may run a separate critique/repair author loop.

`authorCutPolicy.ts` is richer than the Universal Author's duplicated local validator and should become the canonical semantic cut policy.

These are the next convergence targets.

### Canonical creative expansion surface

`apps/api/src/services/authorBrainUniversal.ts`

This is the current Goal-1 author surface for creative sequence intelligence.

It should consume upstream world truth, significance, memory, creative candidates, relation hypotheses, learning, and viewer momentum. It should not re-create those systems.

### Upstream cognition that should be preserved

`packages/engine/src/cognition/universalMind.ts` already owns major cognition:

```text
memory resolution
world model
sanitization
narrative-world collapse
significance
creative candidates
composition candidates
voice candidates
revision
critical selection
experience planning
mind-state learning
```

This is not junk. The convergence task is to make this upstream cognition feed one canonical Universal Author instead of maintaining a second author path.

### Canonical semantic boundary

Keep and evolve:

```text
packages/contracts/src/sequencePlay.ts
packages/contracts/src/viewerMomentum.ts
packages/contracts/src/subjectTruth.ts
packages/contracts/src/world.ts
packages/contracts/src/realityModel.ts
packages/contracts/src/authoring.ts
packages/contracts/src/cognition.ts
```

Do not create another sequence or viewer-state contract without a demonstrated capability gap.

### Sparse-world law

Less evidence means less invented-world surface area, not less creativity.

Creative interpretation, juxtaposition, compression, implication, and reframe are allowed. New people, relationships, dialogue, physical events, object placement, locations, dates, and outcomes require evidence.

### Sequence law

A fact can be true without being an attention cut.

The author must continually transform the viewer's mental model:

```text
known
→ expectation
→ gap
→ valid surprise / reframe / implication
→ new desire
→ payoff
```

No fixed beat count.

### Mouth law

The mouth is realization, not discovery.

Questions are hidden cognition unless supplied as source language.

Shortness is not the objective. Compressed impact is.

---

## 2026-08-15 — FULL REPO INFLUENCE AUDIT

### Critical discovery

Multiple complete cognition/author systems coexist in the repository. The full influence map is maintained at:

`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`

Key conflicts discovered:

```text
old authorBrain
Universal Author
AuthorCognition heuristic modes
AuthorCutPolicy
UniversalMind
CreativePolicy / creativeWriter
CinematicAuthor critique/repair
MicroBeatMouth projection adapter
```

The audit concluded that the repository needs **convergence**, not another parallel brain.

### Engineering order

1. Route production authoring through Universal Author. **DONE for microBeatMouth.**
2. Unify semantic cut evaluation around `authorCutPolicy` or one replacement.
3. Keep UniversalMind/significance/memory as upstream cognition.
4. Remove beat-count logic from creative authority. **DONE for microBeatMouth.**
5. Convert critique/repair into editing of the canonical sequence, not a second author.
6. Dependency-trace old brains.
7. Delete unused legacy brains/contracts.
8. Run COCO, MARIA, HORROR, RAVE through the same production author path.
9. Run COCO-RETURN as a memory-evolution test.

---

## Historical entries below are retained as evidence

Older entries may describe implementation states that have since been replaced. Do not use them as current architecture truth without checking the latest section above and the architecture index.

---

## 2026-08-15 — Character-First Rapid-Attention Author

Important discoveries retained:

- QRE is not writing a novel. It is splicing rapid attention cuts.
- Dramatic information density + next-cut pressure matters more than minimum word count.
- `The monster appeared. / Pink bows everywhere.` is a reusable behavior pattern, not a Coco phrase template.
- Character/world gravity matters. The subject temporarily becomes the star; the service is usually stage context.
- `Coco is a poodle` can be true baseline knowledge without being an attention cut.
- Mechanical `Coco Coco Coco` repetition is weak because identity is already established.
- Generic AI-cinematic wording is not a substitute for creative movement.
- Grounded reality must not be replaced by invented people, relationships, actions, outcomes, or provider behavior.

## 2026-08-15 — Fast Author Iteration Loop

The fast loop exists to accelerate experiments. It is not itself the production architecture.

## 2026-08-15 — Creative Competition + Sequence Safety

The author should compete among interpretations, attack the obvious answer, choose a champion angle, preserve truth, and build a sequence whose next cut earns its existence.
