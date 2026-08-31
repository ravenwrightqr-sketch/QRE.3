# QRE AUTHOR AUDIT — TEST READOUT

**Status:** Working engineering readout
**Branch:** `supplied-media-sequence-convergence`
**Purpose:** Record what the live Author acceptance run proves before the next code change.

## 1. Result

The canonical Author path is operational:

```text
RealityGraph
  -> Cognition
  -> selected movie
  -> approved beats
  -> one batched Mouth request
  -> candidate authorization
  -> deterministic Beam
  -> attention / arc gates
  -> renderable scenes
```

The supplied acceptance run passed build, creative interpretation acceptance, canonical Author completeness, attention, arc, provenance, and one-request Mouth realization.

## 2. What the live output proves

### Canonical movie authority is connected

The test exposes the selected movie and its trajectory before Mouth realization.

Example:

```text
movieId=movie-2-none
trajectoryLength=5
semanticTurn=What began unexpectedly acquired a reason to continue.
```

The same supplied reality with the `fierce` lens produced:

```text
movieId=movie-2-fierce
trajectoryLength=5
semanticTurn=What began unexpectedly acquired a reason to continue.
```

The lens changed the movie identifier but **did not materially change the movie trajectory**.

That is the clearest current failure for creative competition.

## 3. Primary creative defect

QRE is currently capable of discovering a good interpretation, but the production Cognition path still effectively chooses one dominant trajectory and then asks Mouth to realize it.

The test shows:

```text
NONE:
met someone
kept talking
didn't expect it
felt easy
wanted to talk again

FIERCE:
met someone
kept talking
didn't expect it
felt easy
wanted to talk again
```

The semantic thesis is useful, but the creative competition is not yet producing multiple materially different movies from the same reality.

## 4. Existing implementation that should be used

`apps/api/src/services/authorMovieDifferentiation.ts` already provides the correct primitive:

```text
movieCandidateDiversity()
selectDistinctMovieCandidates()
hasMaterialMovieDifference()
```

Its law is that a new movie must differ in evidence, relationships, trajectory operators, and/or payoff mechanism—not merely in lens label.

Do not create another movie brain for this.

## 5. Existing implementation that is already wired correctly

`apps/api/src/services/authorCreativeInterpretation.ts` is already consumed by:

`apps/api/src/services/authorLatentStoryThesis.ts`

Therefore the sequence-backed creative-interpretation work is not orphaned.

The acceptance result:

```text
semanticTurn=What began unexpectedly acquired a reason to continue.
beforeEventIds=event-2
afterEventIds=event-3
```

proves that the new interpretation layer is reachable.

It should remain a Cognition-side semantic interpretation layer, not become a second Author.

## 6. Mouth result

The Mouth infrastructure is healthy enough to defer further architecture changes.

The run demonstrates:

- one model request for the sequence;
- multiple candidate variants per beat;
- hard rejection of unsupported concrete imagery;
- accepted grounded semantic realizations;
- deterministic Beam selection;
- complete source provenance;
- accepted attention and arc checks.

The actual lines are still weaker than the target, but that is now a downstream quality problem rather than an architectural reachability problem.

## 7. Important Mouth observation

The Mouth was given a very abstract internal state such as:

```text
The meaning now includes What began unexpectedly acquired a reason to continue.
```

That representation is suitable as diagnostics, but it is not a rich realization substrate.

The Mouth does better when the beat carries the real source event labels and the semantic relationship separately.

Therefore the next Mouth improvement should be:

```text
selected beat
  + source event evidence
  + canonical semantic interpretation
  + previous realized lines
  -> realization
```

not:

```text
planner sentence
  -> rewrite planner sentence
```

## 8. Current ownership decision

The production ownership remains:

```text
RealityGraph                 = source truth
Author Cognition             = movie discovery / choice
Universal Movie Search       = candidate trajectory discovery
Movie Differentiation        = materially different candidate selection
Viewer State                 = candidate reranking
Canonical Author             = orchestration
Mouth                        = language realization
Beam                         = sequence expression selection
Attention / Arc              = evaluation
Engine                       = runtime / delivery
```

Contracts remain shared semantic data shapes, not runtime brains.

## 9. Next engineering move

Do this in exactly this order:

```text
1. Wire selectDistinctMovieCandidates() into authorCognition.ts
   after candidate enrichment and before final viewer-state selection.

2. Add/extend deterministic acceptance proving that two candidates from
   the same RealityGraph differ materially in trajectory / payoff rather
   than merely in lens name.

3. Run the same supplied reality through NONE and FIERCE again.
   The movie trajectory should be allowed to diverge when the source
   graph contains materially different viable paths.

4. Only after movie competition passes, return to Mouth sentence quality.
```

The useful logic in `authorCreativeSearch.ts::buildMovieAlternatives()` should be treated as a historical/disconnected seed. Do not create a second `CreativeSearchOption` authority merely to keep it alive. Fold any useful novelty/grounding/dominance ideas into the existing `LatentMovieCandidate` + differentiation path.

## 10. Stop conditions

Do not proceed to another Mouth scoring experiment while either of these remains true:

```text
A different lens produces the same movie trajectory with only a different ID.

Multiple movie candidates exist internally but the production path cannot
prove that at least two are materially different.
```

## 11. Definition of the next pass

The next successful test should look conceptually like:

```text
same RealityGraph
      |
      +-- movie A: relationship / continuation / payoff X
      |
      +-- movie B: contrast / recontextualization / payoff Y
      |
      +-- movie C: recurrence / change / payoff Z
      |
      +-- differentiation gate
      |
      +-- viewer-state rerank
      |
      +-- selected movie
```

Then:

```text
selected movie
  -> semantic thesis
  -> approved beats
  -> source-rich Mouth
  -> Beam
  -> final sequence
```

This is the point where QRE moves from **"one good movie, well realized"** toward **"many possible movies, then choose the best one."**
