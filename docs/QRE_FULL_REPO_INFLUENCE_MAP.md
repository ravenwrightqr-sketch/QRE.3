# QRE FULL REPO INFLUENCE MAP

**Status:** CANONICAL / CURRENT
**Branch:** `elite-universal-rebuild-v10`
**Date:** 2026-08-15

## 1. HARD RULE

Before changing QRE author/cognition/compiler behavior:

```text
TRACE INFLUENCE GRAPH
→ IDENTIFY ONE PRODUCTION PATH
→ IDENTIFY ONE MASTER BRAIN
→ IDENTIFY CONTRACT OWNERS
→ IDENTIFY VALIDATORS / EDITORS
→ IDENTIFY LEARNING INPUTS
→ DELETE STALE AUTHOR PATHS
→ CHANGE ONLY CANONICAL PATH
→ TEST CANONICAL PATH
→ DOCUMENT THE LESSON
```

A file is not authoritative merely because it exists.

## 2. CURRENT CANONICAL PATH

```text
INPUT / PROMPT / MEDIA / RUNTIME
        ↓
SOURCE TRUTH / PROVENANCE
        ↓
WORLD + ENTITY + RELATIONSHIPS
        ↓
MEMORY + PRESENCE + ANALYTICS
        ↓
UNIVERSAL COGNITION
        ↓
SIGNIFICANCE + CREATIVE CANDIDATES
        ↓
VIEWER MOMENTUM / SEQUENCE PLAY
        ↓
MASTER UNIVERSAL AUTHOR
        ↓
CANONICAL CUT POLICY
        ↓
MOUTH / EXPERIENCE MOMENTS
        ↓
CINEMATIC RUNTIME
        ↓
LEARNING / MEMORY
```

## 3. MASTER AUTHOR

`apps/api/src/services/authorBrainUniversal.ts`

This is the **only Goal-1 creative author authority**.

It must own sequence discovery and creative realization from the canonical semantic input.

It must not:

```text
model world truth
persist memory
author provider roles
force beat counts
run a second author
repair itself with another hidden author
```

## 4. PRODUCTION AUTHOR PATH

```text
routes/experience.ts
→ services/experienceService.ts
→ @qre/engine compileCognitiveExperience()
→ universalMind
→ AuthorBrainTruth
→ microBeatMouth
→ authorBrainUniversal
→ moments / cinematicScenes
```

`microBeatMouth.ts` and `cinematicAuthor.ts` are adapters/renderers only.

They must not select a competing movie.

## 5. CANONICAL ACCEPTANCE PATH

```text
apps/api/author-acceptance-suite.ts
→ authorBrainUniversal
```

`apps/api/package.json` exposes:

```text
author:fast → author-acceptance-suite.ts
```

The acceptance suite is an observer. It does not add production behavior.

Cases currently preserved:

```text
COCO
COCO-RETURN
MARIA
HORROR
RAVE
```

## 6. UPSTREAM COGNITION

Keep and evolve:

```text
packages/engine/src/cognition/universalMind.ts
packages/engine/src/cognition/worldModel.ts
packages/engine/src/cognition/significanceEngine.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/mindState.ts
```

These are upstream understanding/search layers, not competing mouths.

## 7. CANONICAL CUT POLICY

`apps/api/src/services/authorCutPolicy.ts`

This owns semantic acceptance criteria such as:

```text
groundedness
novelty
implication
explanation
question leakage
invention risk
repetition
compression
impact density
```

Do not create another independent validator.

The next convergence step is to make the Master Author and adapters call this policy instead of carrying duplicate local gates.

## 8. PRODUCTION ADAPTERS

### `apps/api/src/services/microBeatMouth.ts`

KEEP.

Purpose:

```text
Master Author output
→ ExperienceBeat projection
→ runtime metadata
```

It may not determine creative sequence length.

### `apps/api/src/services/cinematicAuthor.ts`

KEEP.

Purpose:

```text
Master Author output
→ cinematic rendering hints
```

It no longer runs an independent critique/repair author.

## 9. DELETED AUTHOR JUNK

Removed from the live API surface:

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/authorBrainMomentum.ts
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
apps/api/src/services/authorFastCore.ts
apps/api/src/services/creativeRelationOps.ts
```

These must not be recreated under another version/name without a demonstrated capability gap and explicit architectural review.

## 10. DELETED TEST JUNK

Removed:

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

Replacement:

```text
apps/api/author-acceptance-suite.ts
```

## 11. REALITY / SEQUENCE BOUNDARY

Reality answers:

```text
What exists?
What happened?
Who is involved?
What is explicitly known?
What happened before?
```

Sequence answers:

```text
What does the viewer know?
What do they expect?
What is unresolved?
What changed the mental model?
What do they want now?
Why does the next cut deserve to exist?
```

Truth is not automatically an attention beat.

## 12. CREATIVE LAWS

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

## 13. TEST INTEGRITY

The test must never modify the production path.

The canonical acceptance harness calls the same Master Author used by production.

No test-only author bridge.
No test-only creative prompt enrichment.
No separate test-only sequence validator.
No test-only fallback writer.

A failing acceptance test therefore means the Master Author or its canonical semantic inputs failed.

## 14. ENGINEERING LOOP

```text
ONE HYPOTHESIS
↓
TRACE LIVE PATH
↓
ONE CANONICAL CHANGE
↓
RUN ACCEPTANCE HARNESS
↓
RUN REAL PRODUCTION PATH
↓
CLASSIFY FAILURE
↓
GENERALIZE THE LAW
↓
DOCUMENT
↓
DELETE STALE PATHS
```

QRE must become simpler as intelligence increases.

## 15. NO NEW JUNK

Do not add:

```text
AuthorV2
AuthorV3
AuthorFastCore2
another mouth
another sequence contract
another benchmark suite
another phrase factory
another hidden repair author
```

unless a demonstrated capability gap requires it and the replacement/deletion plan is documented first.
