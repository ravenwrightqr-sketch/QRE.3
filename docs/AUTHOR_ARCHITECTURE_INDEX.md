# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** CANONICAL / PRODUCTION INTEGRATION BASELINE  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24

Read this before changing Author, cognition, memory, learning, analytics, sequence, contracts, diagnostics, or runtime-to-Author wiring.

## 1. Master invariants

```text
ONE MASTER AUTHOR
ONE PRODUCTION AUTHOR PATH
ONE REALITY GRAPH
ONE LATENT MOVIE SEARCH
ONE MOVIE DIFFERENTIATION GATE
ONE EXPERIENCE STATE
ONE DURABLE MEMORY PLANE
ONE GOVERNED ANALYTICS / LEARNING PLANE
ONE BEHAVIORAL PROFILE
ONE CLOSED ADAPTATION LOOP
ONE CANONICAL MOUTH
ONE TRUTH / CUT BOUNDARY
```

Never solve a semantic problem by creating a competing semantic owner.

## 2. Connected intelligence loop

```text
INPUT / PROMPT / MEDIA / RUNTIME
        ↓
SOURCE TRUTH / PROVENANCE
        ↓
REALITY GRAPH
        ↓
MEMORY + EXPERIENCE STATE
        ↓
LEARNED BEHAVIOR PROFILE
        ↓
LATENT MOVIE SEARCH
        ↓
MOVIE DIFFERENTIATION
        ↓
UNIVERSAL COGNITION
        ↓
TRAJECTORY / VIEWER MOMENTUM / TEMPO
        ↓
UNIVERSAL AUTHOR BRAIN
        ↓
CANONICAL MOUTH
        ↓
TRUTH / CUT GATES
        ↓
CINEMATIC EXPERIENCE
        ↓
RUNTIME / PLAYER
        ↓
ANALYTICS OBSERVATION
        ↓
GOVERNED LEARNING SIGNALS
        ↓
MEMORY + EXPERIENCE STATE UPDATE
        ↺
```

The user does not have to learn QRE's creative controls. The system learns bounded preferences from behavior and adapts future choices without changing source truth.

## 3. Canonical owners

| Concern | Owner |
|---|---|
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` |
| Cognition | `apps/api/src/services/authorCognition.ts` + `packages/engine/src/cognition/universalMind.ts` |
| Universal movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` |
| Master Author | `apps/api/src/services/authorBrainUniversal.ts` |
| Experience state | `apps/api/src/services/authorExperienceState.ts` |
| Memory bridge | `apps/api/src/services/authorExperienceMemory.ts` |
| Behavioral profile | `apps/api/src/services/authorBehaviorProfile.ts` |
| Mouth adapter | `apps/api/src/services/microBeatMouth.ts` |
| Mouth model transport | `apps/api/src/services/localModelRuntime.ts` |
| Attention evaluator | `apps/api/src/services/authorAttentionEditor.ts` |
| Truth / cut policy | `apps/api/src/services/authorBeatTruthGate.ts` + `authorCutPolicy.ts` |
| Analytics classification | `packages/engine/src/cognition/cognitiveAnalytics.ts` |
| Analytics contract | `packages/contracts/src/analytics.ts` |
| Analytics persistence | `apps/api/src/repositories/analyticsRepository.ts` |

Adapters are projections. They must not become alternate Authors.

## 4. Reality and movie selection

Reality is immutable. A lens changes interpretation, never facts. Chronology is earned by evidence.

Movie search is deterministic over the immutable RealityGraph. Candidates may reuse evidence, but different lens labels alone are not different movies.

Important candidate dimensions include grounding, specificity, semantic movement, tension development, callback potential, payoff linkage, compression, repetition risk, and truth risk.

## 5. Memory and experience state

Canonical contract:

`packages/contracts/src/experience/authorExperienceState.ts`

State compiler:

`apps/api/src/services/authorExperienceState.ts`

Memory bridge:

`apps/api/src/services/authorExperienceMemory.ts`

Experience state records established meaning, revisits, unresolved material, continuation, lookahead, future threads, and retired futures.

Future lifecycle:

```text
opened → live future → experienced/reached → retired → history
```

A future thread is not a permanent recommendation.

## 6. Analytics and learning

Every analytics event has a governed semantic class:

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

Key semantics:

```text
FLOW_COMPLETE       = completion
SESSION_END         ≠ completion
EXPERIENCE_REPLAY   = replay
MEDIA_REPLAY        = replay
FLOW_ABANDON        = friction
AI_CREATIVE_ACCEPTED / REJECTED / VARIATION_SELECTED
                    = creative learning evidence
```

Analytics is an observation plane. Author consumes governed derived signals, not arbitrary raw events.

## 7. Behavioral learning

`apps/api/src/services/authorBehaviorProfile.ts` derives bounded preference dimensions:

```text
compressionPreference
explanationAversion
callbackAffinity
surprisePreference
accelerationPreference
revisitAffinity
confidence
```

Preference state is advisory only. It can change Author strategy and realization; it cannot change truth, provenance, ownership, or source evidence.

## 8. Production Author path

```text
experience route
  ↓
experienceService
  ↓
UniversalMind / cognition
  ↓
world + memory + learning context
  ↓
Experience State
  ↓
movie search / differentiation
  ↓
Universal Author
  ↓
MicroBeatMouth / canonical mouth
  ↓
truth / cut gates
  ↓
experience scenes
  ↓
cinematic runtime / player
```

The Mouth receives an approved sequence. It realizes meaning; it does not invent a new movie.

## 9. Acceptance surface

Current focused suites:

```text
apps/api/author-experience-state-acceptance.ts
apps/api/author-learning-closed-loop-acceptance.ts
apps/api/author-behavior-profile-acceptance.ts
apps/api/author-universal-movie-search-acceptance.ts
apps/api/author-acceptance-suite.ts
```

Minimum validation after Author changes:

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

## 10. Runtime boundary

Runtime emits observations. Analytics persists/classifies them. Learning derives bounded adaptation signals. Author consumes those signals. Memory records durable world changes.

Reference: `docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md`.

## 11. Current production milestone

The infrastructure is connected. The next proof is behavioral, not architectural:

```text
ROUND 1
→ create complete experience
→ persist state + learning

ROUND 2
→ recover state + learned profile
→ show measurable Author decision change
→ preserve reality
→ preserve continuity

ROUND 3+
→ prove adaptation remains coherent across repeated visits
```

See `docs/QRE_PRODUCTION_TODO.md`.
