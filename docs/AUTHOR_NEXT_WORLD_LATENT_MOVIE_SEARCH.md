# QRE NEXT WORLD — LATENT MOVIE SEARCH IMPLEMENTATION NOTE

**Status:** ACTIVE / CURRENT NEXT STEP
**Date:** 2026-08-15
**Parent strategy:** `docs/AUTHOR_NEXT_WORLD.md`
**Detailed architecture:** `docs/AUTHOR_LATENT_MOVIE_SEARCH.md`

## WHAT CHANGED

QRE now has a deterministic Reality → Latent Movie Search layer.

Before this layer, the planner was too easily forced to choose a story directly from sparse facts. That produced labels such as:

```text
Discover the backstory.
Coco's feelings.
The unexpected.
Show transformation.
```

Those labels describe a planning intention but do not encode a movie.

## NOW

```text
FACTS
  ↓
REALITY GRAPH
  ↓
RELATIONS / CONTRASTS / RECURRENCE / SENSORY SIGNALS
  ↓
COMPETING LATENT MOVIES
  ↓
COGNITION
  ↓
TRAJECTORY
```

## CANONICAL FILES

```text
packages/contracts/src/experience/realityGraph.ts
packages/contracts/src/experience/latentMovie.ts
apps/api/src/services/authorRealityGraph.ts
apps/api/src/services/authorLatentMovieSearch.ts
apps/api/src/services/authorCognition.ts
apps/api/src/services/authorBrainUniversal.ts
apps/api/author-acceptance-suite.ts
```

## CURRENT CANDIDATE DIMENSIONS

Each candidate is scored on:

```text
novelty
specificity
information value
uncertainty
attention potential
consequence potential
callback potential
compression potential
repetition risk
truth risk
```

## NON-NEGOTIABLES

1. A candidate is a hypothesis, never a fact.
2. Candidate evidence must point to supplied graph events.
3. Creative lenses may change framing and meaning, not physical reality.
4. Comma/list order never establishes chronology.
5. Explicit clock evidence is required for temporal edges.
6. Domain-specific movie rules are forbidden.
7. The Mouth does not choose the movie.
8. The final scorer must judge trajectories, not isolated lines.

## NEXT ENGINEERING MOVE

Build trajectory-level search over the candidate set:

```text
CANDIDATE
   ↓
EXPAND NEXT MOVE
   ↓
UPDATE VIEWER STATE
   ↓
COMPUTE MAGNET
   ↓
MEASURE NEW INFORMATION
   ↓
PRUNE WEAK BRANCHES
   ↓
EXPAND AGAIN
   ↓
COMPLETE TRAJECTORY
   ↓
TRAJECTORY SCORE
```

The objective is not maximum beat count. The objective is a trajectory where removing a cut damages the information-seeking path.

## ACCEPTANCE TARGET

For:

```text
Coco, returned, happy, fun, bows, balls, ties, male
```

QRE should expose multiple grounded candidates before the model writes any viewer-facing line.

The important test is not whether the first candidate sounds good.

The important test is whether QRE can discover **several materially different movies from the same reality**, then choose one because its complete trajectory is stronger.
