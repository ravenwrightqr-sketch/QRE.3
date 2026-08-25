# QRE RUNTIME + ANALYTICS + LEARNING CURRENT STATE

**Status:** CANONICAL CURRENT-STATE REFERENCE  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24

## 1. Semantic planes

```text
RUNTIME
  scan / access / moments / flow / geo / cinematic / delivery / session

ANALYTICS
  observations / registry semantics / repository persistence / read-side insight

LEARNING
  governed event classes / behavior signals / creative preference inference

COGNITION + AUTHOR
  world understanding / significance / movie search / trajectory / tempo / mouth

MEMORY
  durable world facts + relations + provenance
```

These planes exchange bounded data but do not become one another.

## 2. Runtime boundary

Canonical runtime scan entry point:

`packages/engine/src/scanEngine.ts`

Runtime orchestration remains responsible for delivery and runtime state, not durable analytics writes or a second Author.

## 3. Engine Event Spine → Analytics

Runtime emits engine events through:

`packages/engine/src/spine/eventSpine.ts`

The API adapter maps runtime vocabulary into the canonical analytics vocabulary:

`apps/api/src/services/analyticsSpineSubscriber.ts`

The adapter then writes through:

`apps/api/src/repositories/analyticsRepository.ts`

The repository is the direct persistence boundary.

## 4. Analytics contract

Canonical analytics meaning:

`packages/contracts/src/analytics.ts`

Canonical registry:

`packages/contracts/src/analyticsRegistry.ts`

Every event has a governed semantic definition. Unknown event types must never silently become learning input.

## 5. Governed learning classes

`packages/engine/src/cognition/cognitiveAnalytics.ts` classifies events into:

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

Unknown events default to `NON_LEARNING`.

Production semantic rules include:

```text
FLOW_COMPLETE       = completion
SESSION_END         ≠ completion
EXPERIENCE_REPLAY   = replay
MEDIA_REPLAY        = replay
FLOW_ABANDON        = friction
AI_CREATIVE_ACCEPTED / REJECTED / VARIATION_SELECTED
                    = creative learning evidence
```

The point is not to make every event “smart.” The point is to make every event's learning role explicit.

## 6. Analytics → Author learning loop

```text
raw runtime / product event
        ↓
analytics persistence
        ↓
semantic classification
        ↓
governed learning signals
        ↓
Author cognition context
        ↓
behavioral profile
        ↓
movie / tempo / realization decisions
        ↓
new experience
        ↓
new events
```

Current behavioral profile dimensions:

```text
compressionPreference
explanationAversion
callbackAffinity
surprisePreference
accelerationPreference
revisitAffinity
confidence
```

The profile is preference-only and cannot modify source truth.

## 7. Cross-world analytics scope

Author learning history is not restricted to a single QR asset when the user's/account's related assets are legitimately available.

This supports the intended world model:

```text
Coco asset
  ↕
dog daycare asset
  ↕
groomer asset
  ↕
veterinarian asset
  ↕
neighbor / person asset
  ↕
city / event / social world
```

The learning layer may learn user-level creative preference across that world. Durable factual memory remains provenance- and ownership-governed.

## 8. Memory / state separation

`MemorySnapshot` and runtime memory projections are not the durable factual memory authority.

Author Experience State is the short-horizon narrative state:

```text
established
semantic turns
tension
setup
unresolved questions
continuation
lookahead
future threads
retired futures
```

Durable memory remains the source for long-lived world facts and relations.

Future threads have lifecycle semantics and retire when actually experienced.

## 9. Runtime vs learning law

Runtime may read analytics-derived insight. Runtime must not write analytics directly.

```text
runtime
  ↓
spine event
  ↓
analytics adapter
  ↓
analytics repository
  ↓
learning classifier
  ↓
Author context
```

Runtime components are not allowed to become hidden learning stores.

## 10. Current acceptance surface

```text
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build

author-experience-state-acceptance.ts
author-learning-closed-loop-acceptance.ts
author-behavior-profile-acceptance.ts
author-universal-movie-search-acceptance.ts
```

The registry check remains the analytics contract gate.

## 11. Production risks to watch

```text
Do not classify new analytics as learning by default.
Do not count session termination as completion.
Do not collapse replay variants into an unsupported event name.
Do not let user preference overwrite RealityGraph truth.
Do not let runtime capsules become durable facts without provenance.
Do not make analytics persistence a hidden runtime responsibility.
Do not create a second cognition / Author path.
```

## 12. Current priority

The analytics architecture is connected enough to return focus to Author. The remaining production proof is whether learned signals measurably change subsequent Author decisions across rounds while preserving truth and continuity.
