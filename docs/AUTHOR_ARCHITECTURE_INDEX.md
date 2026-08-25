# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** CANONICAL / PRODUCTION INTEGRATION BASELINE  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24  
**Rule:** Read this before changing Author, cognition, memory, learning, analytics, sequence, contracts, diagnostics, or runtime-to-Author wiring.

## 1. MASTER RULE

```text
ONE MASTER AUTHOR
ONE PRODUCTION AUTHOR PATH
ONE CANONICAL CUT POLICY
ONE SHARED SEMANTIC BOUNDARY
ONE REALITY GRAPH
ONE LATENT MOVIE SEARCH
ONE MOVIE DIFFERENTIATION GATE
ONE EXPERIENCE STATE
ONE DURABLE MEMORY PLANE
ONE GOVERNED ANALYTICS / LEARNING PLANE
ONE BEHAVIORAL PROFILE
ONE CLOSED ADAPTATION LOOP
ONE CANONICAL AUTHOR READOUT
```

No duplicate author brains. No benchmark-defined production behavior. No stale compatibility author left reachable by accident. Do not solve a semantic failure by creating a second owner.

## 2. CANONICAL INTELLIGENCE STACK

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
LATENT MOVIE CANDIDATE SEARCH
        ↓
MOVIE DIFFERENTIATION / DUPLICATE PRUNING
        ↓
UNIVERSAL COGNITION
        ↓
TRAJECTORY SEARCH / VIEWER MOMENTUM / TEMPO
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

The user does not configure the system's storytelling behavior. The system infers bounded preferences from observed behavior and adapts future experience selection without changing source truth.

## 3. REALITY GRAPH

Canonical contract:

`packages/contracts/src/experience/realityGraph.ts`

Builder:

`apps/api/src/services/authorRealityGraph.ts`

RealityGraph owns:

```text
evidence
events
entities
source provenance
relationships
contrasts
recurrence signals
sensory signals
unresolved tensions
```

Reality is immutable. A lens changes interpretation, never facts. Chronology must be earned by evidence; list order is not a clock.

## 4. MEMORY + EXPERIENCE STATE

Durable world memory and short-horizon Author state are separate but connected planes.

Canonical experience-state contract:

`packages/contracts/src/experience/authorExperienceState.ts`

Canonical state compiler:

`apps/api/src/services/authorExperienceState.ts`

Memory bridge:

`apps/api/src/services/authorExperienceMemory.ts`

State carries what the current/previous experience established, changed, revisited, left unresolved, opened for later, consumed, or retired.

Future threads have lifecycle semantics:

```text
opened
  ↓
live future
  ↓
experienced / reached
  ↓
retired future
  ↓
historical evidence
```

A future thread is not a permanent recommendation. When the user actually lives it, the future becomes history.

## 5. BEHAVIORAL LEARNING

Canonical behavioral profile:

`apps/api/src/services/authorBehaviorProfile.ts`

The profile is derived from governed learning signals and contains bounded preference dimensions such as:

```text
compressionPreference
explanationAversion
callbackAffinity
surprisePreference
accelerationPreference
revisitAffinity
confidence
```

The profile is preference-only. It must never alter RealityGraph truth, source evidence, ownership, provenance, or factual claims.

The user should never have to learn QRE's control language. QRE learns from behavior.

## 6. ANALYTICS → LEARNING BOUNDARY

Canonical analytics semantic classification lives in:

`packages/contracts/src/analytics.ts`  
`packages/engine/src/cognition/cognitiveAnalytics.ts`

Every analytics event is classified into one governed class:

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

Unknown event types default conservatively to `NON_LEARNING`.

Analytics storage remains an observation plane. Author learns from governed derived signals, not arbitrary raw events.

## 7. LATENT MOVIE SEARCH

Canonical contract:

`packages/contracts/src/experience/latentMovie.ts`

Production implementation:

`apps/api/src/services/authorUniversalMovieSearch.ts`

A movie is a deterministic search result over immutable reality.

```text
RealityGraph
  ↓
competing trajectory hypotheses
  ↓
differentiation
  ↓
chosen movie
  ↓
Author beat plan
```

Candidate quality includes grounding, specificity, semantic movement, tension development, callback potential, payoff linkage, compression, repetition risk, and truth risk.

## 8. MOVIE DIFFERENTIATION

Canonical invariant:

```text
lens label difference ≠ movie difference
```

Two candidates may reuse evidence. They must differ in actual trajectory / relation / interpretation structure to count as separate movies.

## 9. MASTER AUTHOR

`apps/api/src/services/authorBrainUniversal.ts`

This is the only production Author authority.

It owns:

```text
sequence discovery
viewer-state movement
creative implication
relationship compression
sequence selection
tempo / attention decisions
cut realization inputs
sequence diagnostics
```

It does not own upstream world truth, durable memory persistence, analytics storage, or runtime delivery.

## 10. CANONICAL AUTHOR READOUT

Production diagnostic boundary:

`apps/api/src/services/authorReadout.ts`

Acceptance:

`apps/api/author-readout-acceptance.ts`

The readout is an **observer of canonical decisions**, not an additional author. It assembles one traceable envelope containing:

```text
identity / round
source truth summary
learned behavior profile
competing movie candidates
selected movie
experience state / tempo / lookahead
Mouth output
final scenes
explicit gates
invariants
```

The readout must distinguish:

```text
SOURCE TRUTH
DERIVED INTERPRETATION
LEARNED PREFERENCE
MODEL REALIZATION
```

It must never rewrite any of them.

Compact summary output is intended for production diagnostics and acceptance tests. The diagnostic surface may expose internal reasoning metadata to developers/operators; that metadata must never leak into viewer-facing experience text.

## 11. PRODUCTION EXPERIENCE PATH

```text
experience route
   ↓
experienceService
   ↓
engine cognition / UniversalMind
   ↓
world + memory + learning + creative context
   ↓
Author Experience State
   ↓
latent movie search / differentiation
   ↓
Universal Author
   ↓
microBeatMouth / canonical mouth
   ↓
truth / cut gates
   ↓
experience scenes
   ↓
cinematic runtime / player
```

`microBeatMouth.ts` is a projection adapter only. It must not become a second Author.

## 12. CANONICAL MOUTH

The Mouth receives an already-selected sequence. Its job is realization, not story invention.

The target is:

```text
source evidence
+
chosen movie / beat job
+
character relationship
+
carry-forward meaning
+
learned preference context
↓
short specific viewer-facing realization
```

The Mouth must not expose planner language, diagnostics, graph terminology, invented physical actions, unsupported chronology, or source-keyword collage.

## 13. ATTENTION / CUT / TRUTH BOUNDARIES

Attention Editor:

`apps/api/src/services/authorAttentionEditor.ts`

Cut policy:

`apps/api/src/services/authorCutPolicy.ts`

Truth gate:

`apps/api/src/services/authorBeatTruthGate.ts`

These are evaluators, not replacement Authors.

A sequence is not accepted merely because the lines are grammatical. It must have semantic movement, grounding, usable realization, carry-forward momentum, and an earned endpoint.

## 14. ACCEPTANCE SURFACE

Production-facing acceptance suites now cover:

```text
apps/api/author-experience-state-acceptance.ts
apps/api/author-learning-closed-loop-acceptance.ts
apps/api/author-behavior-profile-acceptance.ts
apps/api/author-universal-movie-search-acceptance.ts
apps/api/author-readout-acceptance.ts
apps/api/author-acceptance-suite.ts
```

Minimum gates after Author changes:

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build

git diff --check

pnpm exec tsx apps/api/author-experience-state-acceptance.ts
pnpm exec tsx apps/api/author-learning-closed-loop-acceptance.ts
pnpm exec tsx apps/api/author-behavior-profile-acceptance.ts
pnpm exec tsx apps/api/author-universal-movie-search-acceptance.ts
pnpm exec tsx apps/api/author-readout-acceptance.ts
```

The acceptance harness observes canonical production behavior. It must never become an alternate creative authority.

## 15. RUNTIME + ANALYTICS BOUNDARY

Reference:

`docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md`

The boundary is:

```text
RUNTIME
  scan / access / moments / flow / geo / cinematic / delivery / session

ANALYTICS
  event emission / registry semantics / repository persistence / dashboards

LEARNING
  governed semantic signals / preference inference / adaptation context

AUTHOR
  reality interpretation / movie selection / tempo / realization

MEMORY
  durable world facts + relationships + provenance
```

Runtime emits observations. Analytics persists and classifies them. Learning derives bounded adaptation signals. Author consumes those signals. Memory records durable world changes. No layer becomes another layer by convenience.

## 16. CHANGE LAW

Before adding a new `author*` service ask:

```text
Does this own a new semantic authority?
```

If not, extend the canonical owner.

Before adding a new diagnostic ask:

```text
Is this observing an existing decision, or creating a new decision?
```

If it creates a new decision, it does not belong in the readout.

## 17. GOLDEN PRODUCT LOOP

The finished product should behave like this:

```text
scan
  ↓
experience
  ↓
attention
  ↓
share / replay / abandon / select / interact
  ↓
observation
  ↓
learning
  ↓
changed state
  ↓
next experience
```

The readout exists to make every arrow in that loop inspectable without making the user learn the system.
