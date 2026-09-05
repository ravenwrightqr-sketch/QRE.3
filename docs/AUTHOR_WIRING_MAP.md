# QRE AUTHOR WIRING MAP

**Status:** CANONICAL  
**Branch:** `supplied-media-sequence-convergence`  
**Updated:** 2026-08-28

## 1. SINGLE PRODUCTION PATH

```text
experience input
   ↓
source truth / provenance
   ↓
RealityGraph
   ↓
Canonical Cognition
   ├── character / frame read
   ├── Universal Movie Search
   └── Viewer-State Rerank
   ↓
selectedMovie
   ↓
Canonical Author
   ├── beat projection
   ├── Mouth candidate generation
   ├── Mouth interpretation / quality
   ├── sequence beam
   ├── attention editing
   └── sequence arc diagnostics
   ↓
approved viewer-facing scenes
   ↓
Runtime / Player
   ↓
Analytics observation
   ↓
Governed learning
   ↺
```

## 2. CANONICAL OWNERS

| Responsibility | Owner | Rule |
|---|---|---|
| Canonical Author | `apps/api/src/services/authorBrainCanonical.ts` | orchestration only; consumes Cognition's movie |
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` | source truth / provenance |
| Cognition | `apps/api/src/services/authorCognition.ts` | understanding, frame, movie authority |
| Movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` | deterministic grounded trajectories |
| Viewer-state rerank | `apps/api/src/services/authorViewerState.ts` | viewer-dynamics score |
| Mouth generation | `apps/api/src/services/authorMouthCandidateSearchCanonical.ts` | viewer-facing language realization |
| Mouth interpretation | `apps/api/src/services/authorMouthInterpretation.ts` | semantic / linguistic safety boundary |
| Mouth beam | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | sequence selection among authorized candidates |
| Attention editor | `apps/api/src/services/authorAttentionEditor.ts` | attention shaping across the sequence |
| Sequence arc | `apps/api/src/services/authorSequenceArcGate.ts` | sequence-shape diagnostics |
| Experience State | `apps/api/src/services/authorExperienceState.ts` | short-horizon continuity |
| Behavior Profile | `apps/api/src/services/authorBehaviorProfile.ts` | bounded preference |

## 3. MOVIE AUTHORITY — IMPORTANT

There is exactly one production movie-selection chain:

```text
authorCognition.ts
   ↓
searchUniversalMovieCandidates()
   ↓
rerankByViewerState()
   ↓
selectedMovie
   ↓
authorBrainCanonical.ts
```

`authorBrainCanonical.ts` must **not** independently call `searchUniversalMovieCandidates()`.

This prevents two competing movie brains from disagreeing about the same RealityGraph.

## 4. REALITY BOUNDARY

RealityGraph is immutable source truth.

```text
facts / events / entities / provenance / relations
```

Derived information is never silently promoted back into reality.

Source order has soft gravitational value. It is not proof of chronology.

## 5. MOVIE SEARCH BOUNDARY

Universal Movie Search can create hypotheses using:

```text
relation structure
semantic transitions
contrast
recontextualization
change
recurrence
convergence
causation
before / after
material presentation continuity
```

The output is a candidate trajectory, never a fact.

Viewer-state reranking adds:

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

Source-order influence stays small enough that semantics can override it.

## 6. MOUTH BOUNDARY

Mouth receives approved beats.

The linguistic system distinguishes:

```text
lexical overlap
semantic compression
interpretive framing
unsupported characterization
unsupported concrete invention
```

This permits:

```text
talked til close → We stayed.
feeling good → Fabulous.
mud bath was free → Complimentary.
```

It blocks unsupported world additions such as an invented physical action or an unsupported property asserted about a supplied object/place/person.

### Genre restraint

Horror does not require strange language.

The strongest realization may be:

```text
extreme supplied circumstance
+
ordinary posture / language
+
underreaction
=
stronger tension
```

The same principle applies across other lenses: the lens changes reading, not reality.

## 7. BEAM BOUNDARY

The Mouth beam is a selector, not an author.

```text
candidate generation
   ↓
authorized candidates
   ↓
sequence continuity
   ↓
quality ranking
   ↓
one selected language path
```

Exact textual repetition is not a useful new cut, but semantic callbacks remain legal when wording and function change.

## 8. GATE BOUNDARY

Attention and arc layers evaluate the approved sequence.

They do not invent new beats.

Truth / invention remains upstream and explicit; attention quality cannot legitimize unsupported reality.

## 9. MEMORY / STATE / LEARNING

```text
memory    = durable world truth
state     = current experience continuity
profile   = bounded preference
analytics = observation
learning  = governed adaptation
```

These are separate semantic planes.

## 10. ACCEPTANCE INVARIANTS

```text
one canonical Author
one cognition owner
one movie authority
one RealityGraph
one Mouth
one beam
one attention / arc boundary
no legacy Author path
no planner language in viewer text
no invented concrete reality
```

## 11. CHANGE PROTOCOL

For every change:

```text
identify semantic owner
→ change the canonical owner
→ build
→ run focused acceptance
→ run broader acceptance
→ update the generalized architecture law
```

Never create a second semantic owner simply because the first implementation needs improvement.
