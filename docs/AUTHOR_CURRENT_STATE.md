# QRE AUTHOR · CURRENT STATE

**Status:** CANONICAL CURRENT-STATE REFERENCE  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24

## 1. Product law

> **NO GAPS IN THE PIPELINE. THE USER NEVER HAS TO LEARN THE SYSTEM; THE SYSTEM LEARNS THE USER.**

QRE is not a fact-to-caption generator. Source material is evidence. The Author must produce an accumulating experience in which later cuts change the meaning, pressure, status, or consequence of earlier material.

```text
truth → meaning → consequence → recontextualization → payoff → renewed possibility
```

## 2. Live production loop

```text
SOURCE TRUTH
  ↓
REALITY GRAPH
  ↓
WORLD MEMORY + AUTHOR EXPERIENCE STATE
  ↓
GOVERNED LEARNING SIGNALS
  ↓
BEHAVIOR PROFILE
  ↓
LATENT MOVIE SEARCH / DIFFERENTIATION
  ↓
BEAT PLAN / TRAJECTORY / TEMPO
  ↓
MOUTH REALIZATION
  ↓
ATTENTION + CUT + TRUTH GATES
  ↓
FINAL EXPERIENCE
  ↓
RUNTIME / PLAYER
  ↓
ANALYTICS
  ↓
LEARNING + MEMORY UPDATE
  ↺
```

## 3. Canonical state planes

### Reality
Immutable supplied evidence, provenance, entities, relations, chronology only when earned, recurrence, tensions, and sensory signals.

### Experience State
Short-horizon interpretation state: established material, semantic turns, tension, setup, unresolved questions, continuation, lookahead, future threads, and retired futures.

### Durable Memory
Long-lived world facts and relationships with provenance. It is not rewritten merely because a creative lens changed.

### Behavioral Profile
Learned preference context, currently bounded to:

```text
compressionPreference
explanationAversion
callbackAffinity
surprisePreference
accelerationPreference
revisitAffinity
confidence
```

Preference state can influence strategy, tempo, movie choice, and realization. It cannot modify source truth.

## 4. Future-thread lifecycle

```text
opened
  ↓
live future
  ↓
reached / experienced
  ↓
retired future
  ↓
historical memory
```

A future thread must not become a permanent ghost recommendation.

## 5. Analytics / learning law

Every analytics event belongs to a semantic class:

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

Canonical interpretation includes:

```text
FLOW_COMPLETE       = completion
SESSION_END         ≠ completion
EXPERIENCE_REPLAY   = replay
MEDIA_REPLAY        = replay
FLOW_ABANDON        = friction
AI_CREATIVE_ACCEPTED / REJECTED / VARIATION_SELECTED
                    = creative learning evidence
```

The learning layer is conservative: analytics can be stored without becoming a preference signal.

## 6. Author laws

### Reality law

Reality is immutable. Creative lenses do not create facts.

### Accumulation law

```text
Beat N establishes/change something
      ↓
Beat N+1 inherits it
      ↓
Beat N+1 changes its meaning / pressure / status / consequence
```

### Mouth law

Mouth receives an approved sequence and realizes it. It does not become a second planner or author.

### Attention law

A question mark alone is not momentum. Next-beat pull must arise from a real unresolved relationship, setup, status change, consequence, object, callback, or meaning change.

### Truth-gate law

Attention never overrides truth. A compelling unsupported line is still rejected.

## 7. Canonical owners

| Concern | Owner |
|---|---|
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` |
| Cognition | `apps/api/src/services/authorCognition.ts` + `packages/engine/src/cognition/universalMind.ts` |
| Movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` |
| Master Author | `apps/api/src/services/authorBrainUniversal.ts` |
| Experience state | `apps/api/src/services/authorExperienceState.ts` |
| Memory bridge | `apps/api/src/services/authorExperienceMemory.ts` |
| Behavior profile | `apps/api/src/services/authorBehaviorProfile.ts` |
| Mouth adapter | `apps/api/src/services/microBeatMouth.ts` |
| Attention editor | `apps/api/src/services/authorAttentionEditor.ts` |
| Truth / cut | `apps/api/src/services/authorBeatTruthGate.ts` + `authorCutPolicy.ts` |
| Analytics semantics | `packages/engine/src/cognition/cognitiveAnalytics.ts` |
| Analytics persistence | `apps/api/src/repositories/analyticsRepository.ts` |

## 8. Current proven gates

The current branch has passing acceptance for:

```text
AUTHOR EXPERIENCE STATE
  tempo / continuation / future lifecycle / memory persistence

AUTHOR LEARNING CLOSED LOOP
  creative acceptance / rejection / engagement / friction / learning signals

AUTHOR BEHAVIOR PROFILE
  bounded preference inference + confidence

AUTHOR UNIVERSAL MOVIE SEARCH
  six-case trajectory/differentiation suite
```

The current acceptance surface is the evidence of behavior. Documentation must never outrun it.

## 9. Current gap

The next unproven behavior is **cross-round adaptation**:

```text
Round 1 behavior
  ↓
persisted learned profile + state
  ↓
Round 2 recovery
  ↓
actual Author decision changes
  ↓
measurable improvement / differentiation
```

We need to prove that the learned profile changes real trajectory/tempo/Mouth outcomes rather than merely appearing in diagnostics.

## 10. Golden test philosophy

The final test is not “the model wrote good prose.”

It is:

```text
Is reality preserved?
Did the sequence accumulate?
Did the user want the next cut?
Did the ending earn itself?
Did the system remember what mattered?
Did the next experience change because it learned?
Did the change remain coherent?
```

See `docs/QRE_PRODUCTION_TODO.md` for the active roadmap.
