# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** ACTIVE / CLEAN / GUARDED  
**Branch:** `elite-universal-rebuild-v10`  
**Rule:** Read this and `docs/QRE_FULL_REPO_INFLUENCE_MAP.md` before changing author, cognition, compiler, sequence, contracts, or diagnostics.

## 1. MASTER RULE

```text
ONE MASTER AUTHOR
ONE PRODUCTION AUTHOR PATH
ONE CANONICAL CUT POLICY
ONE ACCEPTANCE HARNESS
ONE SHARED SEMANTIC BOUNDARY
ONE AUTOMATIC ARCHITECTURE GUARD
ONE MAGNET CIRCLE
```

No duplicate author brains. No benchmark-defined production behavior. No stale compatibility author left reachable by accident.

The architecture guard is `scripts/verify-author-architecture.mjs` and is mandatory before builds/acceptance in CI.

## 2. CANONICAL INTELLIGENCE STACK

```text
INPUT / PROMPT / MEDIA / RUNTIME
        ↓
SOURCE TRUTH / PROVENANCE
        ↓
WORLD / ENTITY / RELATIONSHIP MODEL
        ↓
MEMORY + PRESENCE + ANALYTICS
        ↓
UNIVERSAL COGNITION
        ↓
SIGNIFICANCE + CREATIVE SEARCH
        ↓
VIEWER MOMENTUM / MAGNET CIRCLE
        ↓
SEQUENCE PLAY
        ↓
UNIVERSAL AUTHOR BRAIN
        ↓
CANONICAL CUT POLICY
        ↓
MOUTH / EXPERIENCE MOMENTS
        ↓
CINEMATIC RUNTIME
        ↓
LEARNING / MEMORY
```

The Magnet Circle is the universal sequence primitive:

```text
novelty
→ uncertainty
→ information value
→ attention
→ tension
→ information seeking
→ narrative engagement
→ discovery / reframe / payoff
→ new uncertainty
↺
```

Style is downstream realization. The magnet is the invariant.

## 3. MASTER AUTHOR

`apps/api/src/services/authorBrainUniversal.ts`

This is the **only Goal-1 author authority**.

It owns:

```text
sequence discovery
viewer-state movement
creative implication
relationship compression
sequence selection
cut realization input
magnet-aware sequence diagnostics
```

It does not own upstream world modeling, memory persistence, or runtime projection.

It is explicitly a **living intelligence core**: expand and tune it when a general law is discovered; do not add domain-specific hacks.

## 4. PRODUCTION PATH

```text
apps/api/src/routes/experience.ts
        ↓
apps/api/src/services/experienceService.ts
        ↓
@qre/engine compileCognitiveExperience()
        ↓
packages/engine/src/cognition/universalMind.ts
        ↓
world + memory + significance + creative candidates + planning + learning
        ↓
apps/api/src/services/microBeatMouth.ts
        ↓
apps/api/src/services/authorBrainUniversal.ts
        ↓
experience moments / cinematic scenes
```

`microBeatMouth.ts` is a **projection adapter only**. It must never become a second author.

`cinematicAuthor.ts` is also an adapter only and calls the Universal Author directly. It has no independent critique/repair author loop.

## 5. ACCEPTANCE PATH

The acceptance test uses the exact same Master Author directly:

```text
apps/api/author-acceptance-suite.ts
        ↓
apps/api/src/services/authorBrainUniversal.ts
```

Run:

```powershell
pnpm author:fast -- COCO
pnpm author:fast -- COCO-RETURN
pnpm author:fast -- MARIA
pnpm author:fast -- HORROR
pnpm author:fast -- RAVE
```

The harness is an observer. It does not define production rules and must never gain a separate creative bridge.

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

These are upstream intelligence layers. Do not duplicate their responsibilities inside the author.

## 7. CANONICAL CUT POLICY

`apps/api/src/services/authorCutPolicy.ts`

This is the intended **single semantic cut evaluator**.

It measures:

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

Do not create another independent validator. Migrate the Universal Author and adapters toward this policy until only one evaluator owns semantic acceptance.

## 8. CREATIVE SEARCH

Creative search belongs upstream of final realization. It should produce **semantic possibilities**, not domain phrase libraries.

Preferred reusable operations include:

```text
contrast
recurrence
status shift
relationship change
detail hierarchy
implication
withholding
reframe
callback
consequence
escalation
compression
attitude shift
```

A candidate is a hypothesis. It is not source truth.

Recurrence requires actual history, trajectory, or repeated evidence.

## 9. CANONICAL CONTRACTS

Keep and evolve these shared boundaries:

```text
packages/contracts/src/sequencePlay.ts
packages/contracts/src/viewerMomentum.ts
packages/contracts/src/subjectTruth.ts
packages/contracts/src/world.ts
packages/contracts/src/realityModel.ts
packages/contracts/src/cognition.ts
packages/contracts/src/experience/authoring.ts
```

`ViewerMomentum` now contains `MagnetCircle`. Do not create a parallel magnet/attention contract.

Do not create another sequence/momentum version without a demonstrated capability gap and explicit replacement/deletion plan.

## 10. CLEANUP COMPLETED

Removed the legacy API author-test pile and legacy author brains.

The only author acceptance harness is:

`apps/api/author-acceptance-suite.ts`

The deleted experimental bridges included:

```text
authorFastCore.ts
creativeRelationOps.ts
```

The deleted legacy author authorities included:

```text
authorBrain.ts
authorBrainMomentum.ts
authorBrainMomentumV2.ts
authorBrainMomentumV3.ts
```

## 11. REMAINING ADAPTERS

```text
apps/api/src/services/microBeatMouth.ts
apps/api/src/services/cinematicAuthor.ts
```

These are projection/render adapters. They may not introduce independent creative selection, beat counts, critique loops, or hidden fallback authors.

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
magnet strength > beat count
remove a cut → if the information-seeking trajectory weakens, it mattered
creative style is downstream realization, not the universal objective
```

## 13. DRIFT GUARD

`scripts/verify-author-architecture.mjs` enforces the following automatically:

```text
canonical Master Author exists
canonical acceptance harness exists
legacy author files remain deleted
legacy author tests remain deleted
author:fast points to the canonical acceptance harness
acceptance imports the Master Author directly
production imports do not reference deleted author paths
```

The guard runs before the repository build and in CI.

If any of these conditions drift, **the build stops**.

## 14. TEST DISCIPLINE

Every author experiment follows:

```text
ONE HYPOTHESIS
↓
TRACE THE LIVE PATH
↓
ONE CANONICAL CHANGE
↓
RUN THE CANONICAL ACCEPTANCE HARNESS
↓
RUN THE REAL PRODUCTION PATH
↓
CLASSIFY FAILURE
↓
GENERALIZE THE LESSON
↓
DOCUMENT
↓
DELETE STALE PATHS
```

A green benchmark is not success if production uses a different brain.

## 15. REPO HYGIENE

QRE should get simpler as intelligence increases.

Never accumulate:

```text
duplicate authors
duplicate mouths
duplicate validators
benchmark-specific production code
version piles
stale "canonical" notes
unreferenced contracts
```

Full audit:

`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`

Master Goal:

`docs/QRE_AUTHOR_GOAL.md`

Magnet Circle:

`docs/QRE_MAGNET_CIRCLE.md`
