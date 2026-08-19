# QRE AUTHOR ARCHITECTURE INDEX

**STATUS:** CURRENT / CANONICAL
**BRANCH:** `author/enterprise-realization-engine`
**AUTHORITY:** This file defines the current semantic ownership map. Historical/idea documents do not override it.

## 1. MASTER RULE

> **ONE SEMANTIC AUTHORITY PER STAGE. NO GAPS. NO SHADOW AUTHORS.**

```text
SOURCE REALITY
    ↓
REALITY GRAPH
    ↓
COGNITION / CHARACTER READ
    ↓
LATENT MOVIE SEARCH
    ↓
MOVIE DIFFERENTIATION
    ↓
MASTER AUTHOR / BEAT DISCOVERY
    ↓
MEANING SPINE / REALIZATION SLOTS
    ↓
MOUTH CANDIDATES
    ↓
LANGUAGE + REALITY GATES
    ↓
SEQUENCE BEAM
    ↓
ATTENTION EDITOR
    ↓
TRUTH / CUT POLICY
    ↓
FINAL SCENES
    ↓
RUNTIME
```

Trajectory search is a supported semantic capability but is **not yet declared a canonical production stage** until its complete endpoint/consumer wiring is verified in the live Master Author.

## 2. CANONICAL OWNERS

| Concern | Canonical owner | Status |
|---|---|---|
| Source truth / evidence graph | `apps/api/src/services/authorRealityGraph.ts` | ACTIVE |
| Cognition / character read | `apps/api/src/services/authorCognition.ts` | ACTIVE |
| Latent movie search | `apps/api/src/services/authorLatentMovieSearch.ts` | ACTIVE |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` | ACTIVE |
| Master Author orchestration | `apps/api/src/services/authorBrainUniversal.ts` | ACTIVE |
| Meaning Spine | `apps/api/src/services/authorMeaningSpine.ts` | ACTIVE |
| Realization Slots | `apps/api/src/services/authorMouthRealizationSlot.ts` | ACTIVE |
| Mouth semantic contract | `packages/contracts/src/experience/mouth.ts` | ACTIVE CONTRACT / MIGRATION IN PROGRESS |
| Mouth candidate generation/scoring | `apps/api/src/services/authorMouthCandidateSearch.ts` | ACTIVE |
| Mouth sequence selection | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | ACTIVE |
| Mouth language gate | `apps/api/src/services/authorMouthLanguageGate.ts` | ACTIVE |
| Mouth attention gate | `apps/api/src/services/authorMouthAttentionGate.ts` | ACTIVE |
| Mouth quality adaptation | `apps/api/src/services/authorMouthQualityAdapter.ts` | ACTIVE / HARDENED |
| Grounded fallback | `apps/api/src/services/authorMouthGroundedFallback.ts` | ACTIVE / SAFETY RAIL |
| Attention Editor | `apps/api/src/services/authorAttentionEditor.ts` | ACTIVE |
| Truth / cut policy | `apps/api/src/services/authorBeatTruthGate.ts` + `apps/api/src/services/authorCutPolicy.ts` | ACTIVE |
| Sequence arc gate | `apps/api/src/services/authorSequenceArcGate.ts` | ACTIVE |
| Model transport | `apps/api/src/services/localModelRuntime.ts` | ACTIVE |
| Trajectory search | `apps/api/src/services/authorTrajectorySearch.ts` | CANDIDATE / NOT YET WIRED |

## 3. CONTRACT AUTHORITY

Canonical Author contracts live in `packages/contracts/src/experience/`.

Current verified authorities include:

```text
packages/contracts/src/experience/authorBrain.ts
packages/contracts/src/experience/realityGraph.ts
packages/contracts/src/experience/latentMovie.ts
packages/contracts/src/experience/cognition.ts
packages/contracts/src/experience/mouth.ts
```

No service may create a competing semantic contract for an existing concept.

Any type shared across Author services must either come from `@qre/contracts` or be demonstrably private to one implementation.

## 4. TRUTH BOUNDARY

Reality is immutable.

Allowed:

```text
fact → factual realization
fact + supported relation → interpretation
supplied contradiction → creative framing
supplied object → changed meaning
```

Not allowed in reality-locked mode:

```text
new person
new object
new location
new chronology
new concrete action
new body reaction
new dialogue
new sound
new outcome
```

Creative lenses change framing. They do not create reality.

## 5. MOUTH CONTRACT

The Mouth receives approved meaning and source evidence.

It does **not** decide:

```text
reality
movie
meaning
endpoint
sequence architecture
```

It proposes language, then QRE evaluates:

```text
truth
meaning execution
relation execution
attention
next-cut pull
novelty
compression
repetition
endpoint exactness
```

Fallback is an emergency safety rail, not the desired creative winner.

## 6. SEQUENCE LAW

One viewer-facing message normally performs one dominant cut.

A successful sequence must create movement:

```text
CUT
→ viewer state changes
→ something remains unresolved
→ next CUT becomes desirable
→ payoff lands
```

A list of facts chopped into separate lines is not a movie.

## 7. ENTERPRISE MOUTH STATUS

`apps/api/src/services/authorEnterpriseMouth.ts` currently implements a **separate acceptance-oriented orchestration path** around the same Mouth primitives.

It is **NOT** the canonical production Mouth path because `authorBrainUniversal.ts` does not consume it.

Enterprise-specific helpers are therefore classified as:

```text
USEFUL CAPABILITY → audit for migration into canonical owners
DUPLICATE ORCHESTRATION → retire
ACCEPTANCE DATA → retain only where it tests the canonical path
```

The old Enterprise architecture documents have been retired from current authority.

## 8. ADAPTER / RECOVERY RULE

Recovery and adapters may translate existing approved meaning into canonical shapes.

They may not invent an alternate story or bypass the canonical gates.

## 9. ACCEPTANCE RULE

A production acceptance must exercise `authorBrainUniversal.ts`.

A diagnostic may test a helper in isolation, but its result cannot be called production green unless the canonical Master Author consumes it.

## 10. FILE STATUS STANDARD

Every audited file is classified as exactly one of:

```text
CANONICAL
SUPPORT
ACCEPTANCE
STRATEGY / IDEATION
HISTORICAL
LEGACY
ORPHAN
```

Names containing `enterprise`, `monster`, `v2`, `v3`, `final`, or `fixed` do not confer authority.

## 11. DEFINITION OF DONE

The Author is production-ready when unfamiliar reality can travel through one coherent path:

```text
reality
→ interesting interpretation
→ differentiated movie
→ deliberate beat graph
→ strong momentum
→ excellent Mouth
→ truth-safe final scenes
```

The standard is not merely green tests. The standard is that the final viewer-facing sequence is excellent, grounded, complete, and repeatably produced across unrelated industries.