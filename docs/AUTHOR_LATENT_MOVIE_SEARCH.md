# QRE AUTHOR — LATENT MOVIE SEARCH

**Status:** ACTIVE / CANONICAL  
**Branch:** `supplied-media-sequence-convergence`  
**Updated:** 2026-08-28  
**Purpose:** Define the deterministic movie-search layer used by Canonical Cognition.

> **Reality is immutable. A movie is a hypothesis about how supplied reality can play. A lens label is not a movie.**

## 1. AUTHORITY

The movie authority is owned by Cognition:

```text
apps/api/src/services/authorCognition.ts
```

Cognition calls:

```text
apps/api/src/services/authorUniversalMovieSearch.ts
    ↓
searchUniversalMovieCandidates()
    ↓
apps/api/src/services/authorViewerState.ts
    ↓
rerankByViewerState()
    ↓
selectedMovie
```

Canonical Author consumes `selectedMovie`. It does not perform a second movie search.

## 2. SEARCH MODEL

The movie search operates over immutable `RealityGraph` evidence.

```text
RealityGraph
    ↓
competing trajectory hypotheses
    ↓
semantic / material path expansion
    ↓
trajectory scoring
    ↓
differentiation / diversity
    ↓
candidate movies
```

Supported semantic mechanisms include:

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

A candidate is a hypothesis, never a fact.

## 3. SOURCE ORDER

Supplied order is useful evidence of presentation continuity, especially for memories and naturally sequential material.

It is **not** proof of chronology.

The search therefore uses:

```text
source-order gravity
```

rather than a chronology rule.

Forward / nearby supplied progression receives a modest preference. Stronger semantic relationships may still override it.

## 4. MATERIAL-FIRST PATHS

When explicit graph relations are sparse, the search can construct a presentation sequence from supplied events.

```text
supplied event A
   ↓
supplied event B
   ↓
supplied event C
   ↓
...
   ↓
payoff from accumulated supplied material
```

This is a presentation hypothesis only.

It must not invent chronology, causation, dialogue, physical actions, or bridge events.

Material continuation is scored using:

```text
specificity
freshness
source-order affinity
centrality
terminality
recurrence
unresolved tension
lookahead
callback opportunity
rhythm
camping risk
```

The system permits meaningful short repetition while penalizing semantic camping.

## 5. RELATION PATHS

Relation-derived trajectories remain available for worlds with strong semantic structure.

Each trajectory step records:

```text
operation
eventIds
viewerChange
nextQuestion
```

`nextQuestion` is private cognitive metadata and never viewer-facing prose.

## 6. VIEWER-STATE RERANK

Candidate trajectories are scored before language realization.

`authorViewerState.ts` measures:

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

Source-order continuity is deliberately a small contributor. It improves naturally sequential supplied sequences without turning input order into a hard rail.

## 7. MOVIE DIFFERENTIATION

```text
lens label difference ≠ movie difference
```

Candidates may share evidence. They must differ materially in trajectory structure, relation mechanism, payoff structure, or other meaning-bearing path properties to count as distinct movies.

Duplicate pruning must not punish legitimate evidence reuse merely because the same source facts are relevant to multiple interpretations.

## 8. TRUTH LAW

The search may alter:

```text
sequence presentation
framing
juxtaposition
emphasis
withholding
recontextualization
semantic interpretation
```

It may not create:

```text
people
places
dates
dialogue
physical actions
outcomes
unsupported relationships
unsupported chronology
```

Weak evidence creates uncertainty. Unsupported facts create truth risk. These are different semantic states.

## 9. EXAMPLES OF CORRECT BEHAVIOR

A sequential living memory may naturally resolve toward:

```text
walk
→ squirrels
→ trees
→ mud
→ bath
→ feeling good
→ looking good
```

A horror memory may preserve:

```text
met at coffee shop
→ Friday the 13th
→ knew it
→ talked until close
→ just us in our world
→ knives flew past us
→ nevermore
```

The lens may affect interpretation, but the search does not need to inject horror tropes. An extraordinary supplied fact may become more powerful when surrounding behavior remains ordinary.

## 10. LLM ROLE

The LLM is downstream from movie selection for primary production realization.

Current production boundary:

```text
search substrate = deterministic
movie selection = Cognition
language realization = Mouth / local model
```

Future model-assisted hypothesis expansion must still validate candidates against the same graph and truth contract.

## 11. DEFINITION OF DONE

Latent Movie Search is successful when:

```text
one RealityGraph
→ multiple grounded trajectory hypotheses
→ materially different movies
→ source-order gravity without chronology fraud
→ viewer-state reranking
→ one selected movie
→ clean handoff to Mouth
```

The movie layer's job is not to write beautiful prose.

Its job is to discover the **path that makes the supplied reality worth watching**.
