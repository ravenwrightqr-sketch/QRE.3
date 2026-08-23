# QRE AUTHOR WIRING MAP

Status: CANONICAL AUTHOR WIRING REFERENCE
Date: 2026-08-22

This document describes the live semantic author path. Historical branch names and earlier pending states are not current wiring authority.

## Required author path

```text
experience input
  → source truth
  → RealityGraph
  → cognition
  → latent-movie candidates
  → movie differentiation
  → trajectory / Magnet selection
  → SequencePlay / Beat Graph
  → one-beat mouth realization
  → canonical cut policy / truth gate
  → final experience scenes
  → cinematic runtime
```

## Canonical author owners

| Responsibility | Canonical owner | Required relationship |
|---|---|---|
| Master author | `apps/api/src/services/authorBrainUniversal.ts` | one production author |
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` | source-truth / provenance boundary |
| Author cognition | `apps/api/src/services/authorCognition.ts` | consumes grounded world relationships |
| Latent movie search | `apps/api/src/services/authorLatentMovieSearch.ts` | competing grounded interpretations |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` | prevents duplicate movies |
| Sequence semantics | `packages/contracts/src/sequencePlay.ts` | canonical sequence representation |
| Magnet semantics | `packages/contracts/src/viewerMomentum.ts` | canonical MagnetCircle representation |
| Cut acceptance | `apps/api/src/services/authorCutPolicy.ts` | one semantic cut evaluator |
| Mouth/model transport | `apps/api/src/services/localModelRuntime.ts` + canonical mouth path | realization only; does not choose the movie |
| Acceptance | `apps/api/author-acceptance-suite.ts` / current acceptance harnesses | observe the same production author path |

## Truth boundary

`RealityGraph` may represent:

```text
relationships
recurrence
contradiction
chronology when actually evidenced
provenance
sensory signals
```

It may not rewrite source truth.

Creative lenses may change framing and interpretation. They may not silently create concrete facts in reality-locked mode.

Explicit fictional/world-creation requests remain a separate author mode and must be marked accordingly.

## Sequence invariant

A beat is a perceivable change in the viewer's mental model.

The internal sequence can vary in length. There is no permanent 4-beat or 5-beat requirement.

The governing sequence law is:

```text
Beat N
  establishes / changes something
      ↓
Beat N+1
  inherits it
      ↓
Beat N+1
  changes its meaning / pressure / status / consequence
```

Viewer-facing text is not the Beat Graph. Beat metadata remains private authoring state.

## Acceptance invariants

The live Author path must preserve:

```text
one Master Author
one RealityGraph representation
one canonical cognition path
one movie-differentiation boundary
one SequencePlay / Beat Graph representation
one MagnetCircle representation
one cut policy
one mouth

no invented concrete fact in reality-locked mode
no planning vocabulary in viewer text
no paragraph-like text cuts
no silent fallback author
no domain-specific author branch
```

## Runtime boundary

The author path terminates in approved experience scenes. Runtime infrastructure is separate from author semantics:

```text
Master Author
  ↓
experience moments / cinematic scenes
  ↓
QRE runtime
```

Current runtime decomposition is documented in:

`docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md`

The runtime side currently uses explicit internal seams for:

```text
buildRuntimeMoments()
selectCinematicScenes()
buildRuntimeGeoStory()
buildRuntimeMemorySnapshot()
```

These are runtime adapters/orchestrators. They are not additional author brains and do not belong in `packages/engine/src/cognition/`.

## Validation / analytics boundary

Runtime observations use the Engine Event Spine:

```text
runtime event
  → Engine Event Spine
  → analytics adapter
  → AnalyticsEventType / registry
  → AnalyticsRepository
```

The analytics registry is canonical for durable analytics meaning. Runtime event vocabulary and analytics vocabulary are intentionally not required to be identical.

## Current validation state

The following gates have been established as passing during the current engineering pass:

```text
ENGINE SPINE PRESENCE ACCEPTANCE: PASS
ENGINE SPINE FLOW ACCEPTANCE: PASS
ANALYTICS SPINE ACCEPTANCE: PASS
REGISTRY COMPLETE: PASS
REAL ADAPTIVE LEARNING ACCEPTANCE: PASS
contracts build: PASS
engine build: PASS
api build: PASS
git diff --check: PASS
```

The analytics registry acceptance currently verifies:

```text
contractEvents=57
registryEvents=57
missing=none
extra=none
invalid=none
```

The real adaptive-learning acceptance currently verifies:

```text
baselineLens=deadpan
learnedLens=courtroom
learningPersisted=true
identityStateProjection=true
contextProjection=true
realityPreserved=true
assetIsolation=true
```

## Important architectural rule

A green build is not sufficient evidence of a correct intelligence path.

For every change:

```text
identify semantic owner
→ change one canonical boundary
→ build contracts
→ build engine
→ build API
→ run the relevant acceptance gate
→ document the generalized law
```

Do not recreate a retired author under another version/name without a demonstrated capability gap and an explicit replacement/deletion plan.
