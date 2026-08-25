# QRE AUTHOR WIRING MAP

**Status:** CANONICAL AUTHOR WIRING REFERENCE  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24

This document describes the live semantic Author path. Current architecture references override historical documents.

## 1. Required connected Author path

```text
experience input
  ↓
source truth / provenance
  ↓
RealityGraph
  ↓
durable memory + Author Experience State
  ↓
governed learning signals
  ↓
behavioral profile
  ↓
latent-movie candidates
  ↓
movie differentiation
  ↓
trajectory / Magnet / tempo selection
  ↓
SequencePlay / Beat Graph
  ↓
one-beat Mouth realization
  ↓
attention / cut / truth gates
  ↓
final experience scenes
  ↓
cinematic runtime
  ↓
analytics observation
  ↓
learning + state/memory update
  ↺
```

## 2. Canonical owners

| Responsibility | Canonical owner | Rule |
|---|---|---|
| Master Author | `apps/api/src/services/authorBrainUniversal.ts` | one production Author |
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` | source-truth / provenance boundary |
| Cognition | `apps/api/src/services/authorCognition.ts` + `packages/engine/src/cognition/universalMind.ts` | grounded interpretation |
| Movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` | competing grounded trajectories |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` | prevents duplicate movies |
| Experience State | `apps/api/src/services/authorExperienceState.ts` | short-horizon continuity |
| Memory bridge | `apps/api/src/services/authorExperienceMemory.ts` | durable memory integration |
| Behavior profile | `apps/api/src/services/authorBehaviorProfile.ts` | learned preference only |
| Sequence semantics | `packages/contracts/src/sequencePlay.ts` | canonical sequence representation |
| Magnet semantics | `packages/contracts/src/viewerMomentum.ts` | attention / momentum representation |
| Mouth / model transport | `apps/api/src/services/microBeatMouth.ts` + `localModelRuntime.ts` | realization only |
| Attention evaluator | `apps/api/src/services/authorAttentionEditor.ts` | editor, not Author |
| Truth / cut acceptance | `apps/api/src/services/authorBeatTruthGate.ts` + `authorCutPolicy.ts` | final semantic gate |
| Analytics semantics | `packages/engine/src/cognition/cognitiveAnalytics.ts` | event classification / learning boundary |
| Analytics persistence | `apps/api/src/repositories/analyticsRepository.ts` | direct durable analytics writes |
| Acceptance | focused Author acceptance suites | observe canonical path |

## 3. Truth boundary

`RealityGraph` may represent:

```text
relationships
recurrence
contradiction
chronology when evidenced
provenance
sensory signals
```

It may not rewrite source truth.

Creative lenses may change framing and interpretation. They may not silently create concrete facts in reality-locked mode.

## 4. Sequence invariant

A beat is a perceivable change in the viewer's mental model.

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

## 5. Analytics / learning boundary

Runtime observations use the Engine Event Spine:

```text
runtime event
  → Engine Event Spine
  → analytics adapter
  → AnalyticsEventType / registry
  → AnalyticsRepository
  → semantic learning classifier
  → Author learning context
```

Canonical learning classes:

```text
FACTUAL_WORLD
BEHAVIORAL_SIGNAL
CREATIVE_PREFERENCE
FRICTION_SIGNAL
MEMORY_SIGNAL
BUSINESS_SIGNAL
RUNTIME_HEALTH
NON_LEARNING
```

Important semantics:

```text
FLOW_COMPLETE       = completion
SESSION_END         ≠ completion
EXPERIENCE_REPLAY   = replay
MEDIA_REPLAY        = replay
FLOW_ABANDON        = friction
```

Unknown events default to `NON_LEARNING`.

## 6. Learning / memory invariant

```text
analytics = observation
learning  = governed interpretation of behavior
memory    = durable world truth / relationships
state     = current narrative continuity
profile   = bounded user preference
```

These must not collapse into one undifferentiated “memory” object.

A behavioral profile may influence Author choices but cannot alter RealityGraph evidence.

A future thread may be opened, carried, consumed, and retired. It must not remain a permanent ghost.

## 7. Acceptance invariants

```text
one Master Author
one RealityGraph representation
one cognition path
one movie differentiation boundary
one Experience State
one behavioral profile
one analytics learning boundary
one mouth
one truth/cut boundary

no invented concrete fact in reality-locked mode
no planning vocabulary in viewer text
no paragraph-like text cuts
no silent fallback Author
no domain-specific Author branch
```

## 8. Current production gates

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build
git diff --check

pnpm exec tsx apps/api/author-experience-state-acceptance.ts
pnpm exec tsx apps/api/author-learning-closed-loop-acceptance.ts
pnpm exec tsx apps/api/author-behavior-profile-acceptance.ts
pnpm exec tsx apps/api/author-universal-movie-search-acceptance.ts
```

The acceptance suites currently prove state persistence, learning classification, behavioral profile inference, and universal movie search independently. The next major proof is cross-round measurable Author adaptation.

## 9. Runtime boundary

Author terminates at approved experience scenes.

```text
Master Author
  ↓
experience moments / cinematic scenes
  ↓
QRE runtime
```

Runtime helpers are not cognition modules and not additional Author brains.

## 10. Change protocol

For every architectural change:

```text
identify semantic owner
→ close the first broken boundary
→ build contracts
→ build engine
→ build API
→ run focused acceptance
→ run broader acceptance
→ document the generalized law
```

A green compiler is not proof of correct semantic wiring. Runtime import boundaries, persistence boundaries, and closed-loop behavior must be acceptance-tested.
