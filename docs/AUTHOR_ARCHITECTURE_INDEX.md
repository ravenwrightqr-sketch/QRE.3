# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** CANONICAL / CURRENT PRODUCTION ARCHITECTURE  
**Branch:** `supplied-media-sequence-convergence`  
**Updated:** 2026-08-28  
**Rule:** This file overrides stale Author architecture descriptions elsewhere.

## 1. MASTER LAW

```text
ONE CANONICAL AUTHOR
ONE COGNITION OWNER
ONE REALITY GRAPH
ONE MOVIE AUTHORITY
ONE EXPERIENCE STATE
ONE MOUTH
ONE BEAM
ONE ATTENTION / ARC GATE
ONE RUNTIME BOUNDARY
ONE LEARNING LOOP
```

The system may contain many evaluators and adapters, but no second component may silently become a competing semantic authority.

## 2. CANONICAL AUTHOR STACK

```text
SOURCE INPUT
    ↓
SOURCE TRUTH / PROVENANCE
    ↓
REALITY GRAPH
    ↓
CANONICAL COGNITION
    ├── character / frame interpretation
    ├── Universal Movie Search
    └── viewer-state movie rerank
    ↓
SELECTED MOVIE
    ↓
CANONICAL AUTHOR
    ├── beat projection
    ├── Mouth candidate generation
    ├── Mouth sequence selection
    ├── attention editing
    └── sequence arc diagnostics
    ↓
FINAL VIEWER-FACING SCENES
    ↓
RUNTIME / PLAYER
    ↓
ANALYTICS OBSERVATION
    ↓
GOVERNED LEARNING
    ↺
```

### Critical ownership law

```text
Cognition decides WHAT MOVIE.
Canonical Author orchestrates HOW THAT MOVIE BECOMES AN EXPERIENCE.
Mouth decides HOW THE APPROVED BEAT SOUNDS.
Gates decide whether the realization remains safe and useful.
```

Canonical Author must **consume** Cognition's selected movie. It must not independently execute a second movie search.

## 3. REALITY GRAPH

Owner:

`apps/api/src/services/authorRealityGraph.ts`

The graph represents supplied reality and its supported relationships:

```text
events
entities
provenance
relations
recurrence
sensory signals
unresolved tensions
```

Reality is immutable.

A lens changes interpretation, never facts.

Source order is evidence of presentation continuity, not proof of chronology.

## 4. MOVIE AUTHORITY

Movie generation lives under Cognition:

`apps/api/src/services/authorCognition.ts`

The deterministic movie search is:

`apps/api/src/services/authorUniversalMovieSearch.ts`

Viewer-state reranking is:

`apps/api/src/services/authorViewerState.ts`

Canonical chain:

```text
RealityGraph
   ↓
searchUniversalMovieCandidates()
   ↓
rerankByViewerState()
   ↓
selectedMovie
```

The movie is a hypothesis over supplied reality, never source truth.

## 5. MOVIE SEARCH LAW

A movie must be a trajectory, not a label.

```text
supplied evidence
      ↓
competing paths
      ↓
semantic movement
      ↓
viewer-state consequences
      ↓
payoff
```

The search may use:

```text
contrast
recontextualization
change
recurrence
convergence
causation
before / after
membership
involvement
material presentation continuity
```

Source order has **soft gravity**. It does not own the movie.

## 6. VIEWER-STATE LAW

`authorViewerState.ts` scores:

```text
attention
curiosity
contrast
interruption
accumulation
payoff
tempo
state shift
prediction error
source-order continuity
```

Source-order continuity is deliberately small. Its role is to make a naturally sequential supplied memory easier to preserve without preventing a stronger semantic jump.

## 7. MOUTH

Primary realization surface:

`apps/api/src/services/authorMouthCandidateSearch.ts`

Interpretation boundary:

`apps/api/src/services/authorMouthInterpretation.ts`

Quality adaptation:

`apps/api/src/services/authorMouthQualityAdapter.ts`

Sequence selection:

`apps/api/src/services/authorMouthSequenceBeamSearch.ts`

Attention gate:

`apps/api/src/services/authorMouthAttentionGate.ts`

Mouth receives an already-approved beat job.

It may perform:

```text
compression
attitude
status framing
implication
irony
understatement
callback
recontextualization
rhetorical timing
normalcy-under-pressure
```

It may not invent concrete reality.

### Linguistic law

```text
lexical overlap = evidence
semantic preservation = primary
unsupported concrete claim = hard block
unsupported characterization = hard block
```

This permits realizations such as:

```text
talked til close → We stayed.
feeling good → Fabulous.
mud bath was free → Complimentary.
```

while rejecting unsupported assertions such as:

```text
met at coffee shop → Coffee shop. Already strange.
```

The wording can be surprising. The world cannot be silently rewritten.

## 8. HORROR / GENRE LAW

Genre is a reading strategy, not a requirement to add genre tropes.

A horror realization may be strongest when:

```text
something extraordinary is supplied
        +
people / surroundings remain matter-of-fact
        +
normal language creates contrast
```

Do not force “strange,” “scary,” ominous adjectives, or theatrical behavior merely because the lens is horror.

Likewise, comedy does not require every cut to be a joke, romance does not require invented intimacy, and sentiment does not require emotional explanation.

## 9. GATES

Attention / arc gates are evaluators.

They may measure:

```text
cut independence
density
forward pull
attention change
semantic continuity
establishment
transition
escalation
payoff linkage
finality
```

They must not become replacement Authors.

A gate may reject unsafe language or diagnose a weak sequence; it must not create a new story.

## 10. EXPERIENCE STATE / LEARNING

Experience State carries short-horizon continuity.

Behavior Profile carries bounded preference.

Memory carries durable world truth.

Analytics carries observation.

Learning derives governed adaptation signals.

```text
memory ≠ state ≠ preference ≠ analytics
```

No preference may mutate RealityGraph truth.

## 11. PRODUCTION BOUNDARY

```text
AUTHOR
  reality
  → cognition
  → movie
  → beats
  → mouth
  → gates
  → scenes

RUNTIME
  scenes
  → scan / access / flow / geo / cinematic / delivery

ANALYTICS
  runtime observations
  → governed learning signals

LEARNING
  governed signals
  → bounded future preferences
```

Runtime helpers are not additional cognition modules.

## 12. CHANGE LAW

Before changing Author ask:

```text
What semantic authority owns this decision?
What evidence should prove the change?
Does the change preserve the single-owner architecture?
```

Do not repair a broken path by adding another Author.

## 13. GOLDEN PRODUCT LOOP

```text
SUPPLIED REALITY
    ↓
UNDERSTANDING
    ↓
MOVIE
    ↓
MOMENT-TO-MOMENT EXPERIENCE
    ↓
LANGUAGE
    ↓
PLAYER
    ↓
USER BEHAVIOR
    ↓
LEARNING
    ↓
BETTER FUTURE SELECTION
```

The target is not prettier prose.

The target is a system that repeatedly finds a movie inside supplied reality, realizes it with restraint and surprise, preserves truth, and learns from what actually worked.
