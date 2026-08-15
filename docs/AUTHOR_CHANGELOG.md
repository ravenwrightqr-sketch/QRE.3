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

### The architecture is NOT yet fully converged

A full-repository influence audit found that the Fast Author laboratory and the actual production authoring path are different:

```text
FAST LAB
author-fast-suite
→ authorFastCore
→ authorBrainUniversal
→ SequencePlay / ViewerMomentum
→ validated cuts

PRODUCTION
experience route
→ experienceService
→ engine universalMind / compileCognitiveExperience
→ microBeatMouth
→ OLD authorBrain
→ experience scene projection
```

Therefore:

> **Goal 1 is not finished until both paths use the same canonical author intelligence.**

The previous claim that `apps/api/src/services/authorBrain.ts` was the shared canonical author is historical and is no longer current truth.

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

### Canonical cut-policy target

`apps/api/src/services/authorCutPolicy.ts` already contains richer semantic evaluation than the Universal Author's local validation logic.

The architecture should converge to one semantic cut policy rather than maintain multiple independent validators.

### Production adapters

```text
apps/api/src/services/microBeatMouth.ts
apps/api/src/services/cinematicAuthor.ts
```

These may remain as runtime/render adapters, but they must not remain independent author authorities.

`microBeatMouth.ts` currently calls old `authorBrain.ts`.  
`cinematicAuthor.ts` currently calls old `authorBrain.ts` and can run a separate critique/repair loop.

These are explicit migration targets.

### Benchmark rule

The following are observers/benchmarks, not production creative authorities:

```text
apps/api/author-fast-suite.ts
apps/api/author-beat-presence-suite.ts
apps/api/author-beat-presence-master-suite.ts
apps/api/author-ceiling-benchmark.ts
apps/api/author-ceiling-test.ts
apps/api/author-creative-superstar-suite.ts
apps/api/author-mouth-quality-suite.ts
apps/api/author-universal-ceiling-suite.ts
apps/api/creative-learning-readout.ts
apps/api/local-author-test.ts
apps/api/one-pass-test.ts
```

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

Multiple complete cognition/author systems coexist in the repository. The full influence map is now maintained at:

`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`

Key conflicts discovered:

```text
old authorBrain reachable in production
Universal Author active in fast lab
AuthorCognition heuristic modes
AuthorCutPolicy semantic mouth policy
UniversalMind full cognition stack
CreativePolicy / creativeWriter candidate stack
CinematicAuthor critique/repair author
MicroBeatMouth beat-count/projection adapter
```

### Engineering decision

Do not continue adding creative behavior until the production author seam is converged or explicitly isolated.

The next engineering order is:

1. Route production authoring through the canonical Universal Author.
2. Unify semantic cut evaluation around `authorCutPolicy` or one replacement.
3. Keep UniversalMind/significance/memory as upstream cognition.
4. Remove beat-count logic from creative authority.
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
