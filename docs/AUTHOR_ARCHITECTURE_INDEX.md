# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** ACTIVE / CLEAN / GUARDED / LATENT-MOVIE SEARCH + DIFFERENTIATION ONLINE  
**Branch:** `qre/latent-movie-search-v1`  
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
ONE REALITY GRAPH
ONE LATENT MOVIE SEARCH
ONE MOVIE DIFFERENTIATION GATE
```

No duplicate author brains. No benchmark-defined production behavior. No stale compatibility author left reachable by accident.

## 2. CANONICAL INTELLIGENCE STACK

```text
INPUT / PROMPT / MEDIA / RUNTIME
        ↓
SOURCE TRUTH / PROVENANCE
        ↓
REALITY GRAPH
        ↓
LATENT MOVIE CANDIDATE SEARCH
        ↓
MOVIE DIFFERENTIATION / DUPLICATE PRUNING
        ↓
UNIVERSAL COGNITION
        ↓
TRAJECTORY SEARCH / VIEWER MOMENTUM
        ↓
CANONICAL CUT POLICY
        ↓
UNIVERSAL AUTHOR BRAIN
        ↓
MOUTH / EXPERIENCE MOMENTS
        ↓
CINEMATIC RUNTIME
        ↓
LEARNING / MEMORY
```

The Magnet Circle remains the universal sequence primitive:

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

RealityGraph does **not** own creative truth. Derived candidate hypotheses are explicitly marked as derived.

Chronology is earned. Comma/list order is never treated as temporal order.

## 4. LATENT MOVIE SEARCH

Canonical contract:

`packages/contracts/src/experience/latentMovie.ts`

Implementation:

`apps/api/src/services/authorLatentMovieSearch.ts`

Detailed reference:

`docs/AUTHOR_LATENT_MOVIE_SEARCH.md`

This is the missing layer between reality and story selection.

```text
REALITY GRAPH
      ↓
COMPETING MOVIE HYPOTHESES
      ↓
DIFFERENTIATION GATE
      ↓
COGNITION
```

The search is domain-neutral. Initial lenses are:

```text
comedy
romance
horror
sentimental
absurd
neutral
```

A candidate is never source truth. It carries explicit evidence, trajectory steps, truth risk, and multi-dimensional quality signals.

## 5. MOVIE DIFFERENTIATION GATE

Implementation:

`apps/api/src/services/authorMovieDifferentiation.ts`

The first candidate search revealed a critical failure mode: different lens labels could produce the same evidence, same relationships, same trajectory, and same payoff. That is not real creative search.

Canonical invariant:

```text
lens label difference ≠ movie difference
```

The gate compares:

```text
34% anchor/evidence difference
20% relationship difference
30% trajectory difference
12% payoff difference
 4% lens-label difference
```

It greedily balances candidate quality against diversity and exposes `distinctiveness` for diagnostics.

Weak graph relations are uncertainty. They are not automatically truth-risk or invention. Unsupported events are what raise truth risk.

## 6. MASTER AUTHOR

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

## 7. PRODUCTION PATH

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

## 8. ACCEPTANCE PATH

The acceptance test uses the exact same Master Author directly:

```text
apps/api/author-acceptance-suite.ts
        ↓
RealityGraph
        ↓
Latent Movie Search
        ↓
Movie Differentiation
        ↓
apps/api/src/services/authorBrainUniversal.ts
```

Run:

```powershell
pnpm author:wiring
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build
pnpm exec tsx apps/api/author-acceptance-suite.ts "Coco, returned, happy, fun, bows, balls, ties, male"
```

The harness is an observer. It does not define production rules and must never gain a separate creative bridge.

## 9. UPSTREAM COGNITION

Keep and evolve:

```text
packages/engine/src/cognition/universalMind.ts
packages/engine/src/cognition/worldModel.ts
packages/engine/src/cognition/significanceEngine.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/mindState.ts
apps/api/src/services/authorCognition.ts
apps/api/src/services/authorLatentMovieSearch.ts
apps/api/src/services/authorMovieDifferentiation.ts
```

Cognition now consumes RealityGraph relationships and runs the canonical latent-movie search before final beat discovery.

## 10. CANONICAL CUT POLICY

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

Do not create another independent validator.

## 11. CHANGE RULES

Before adding a new service named `author*`, ask:

```text
Does this own a new semantic authority?
```

If yes, stop. Extend the existing canonical owner instead.

The current canonical ownership is:

```text
RealityGraph              → authorRealityGraph.ts
Latent Movie Search       → authorLatentMovieSearch.ts
Movie Differentiation     → authorMovieDifferentiation.ts
Cognition                 → authorCognition.ts
Master Author             → authorBrainUniversal.ts
Mouth                     → localModelRuntime.ts / canonical mouth path
Cut Policy                → authorCutPolicy.ts
Acceptance                → author-acceptance-suite.ts
```

The architecture guard exists to make accidental divergence fail loudly.

## 12. NEXT WORLD

The next major intelligence layer is **trajectory-level search**.

It should search complete viewer-state paths rather than selecting isolated beats:

```text
candidate movie
      ↓
expand possible next cuts
      ↓
score viewer-state change
      ↓
measure information gain / uncertainty / tension
      ↓
penalize repetition / explanation / invention
      ↓
prune
      ↓
continue
      ↓
BEST COMPLETE TRAJECTORY
      ↓
MOUTH
```

Do not skip movie differentiation and jump directly from lens labels to trajectory search. Otherwise QRE will optimize duplicate movies.
