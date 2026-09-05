# QRE AUTHOR · CURRENT STATE

**Status:** CANONICAL CURRENT-STATE REFERENCE  
**Branch:** `build/universal-author-local`
**Updated:** `2026-09-05`
**Purpose:** Single fast reference for the live Universal Author path.

## 1. LIVE PIPELINE

```text
SOURCE INPUT
   ↓
REALITY GRAPH / PROVENANCE
   ↓
CANONICAL COGNITION
   ├── character/frame read
   ├── Universal Movie Search
   └── viewer-state movie rerank
   ↓
SELECTED MOVIE
   ↓
CANONICAL AUTHOR
   ├── beat projection
   ├── Mouth candidate generation
   ├── Mouth interpretation / quality checks
   ├── sequence beam selection
   ├── attention editing
   └── arc diagnostics
   ↓
FINAL SCENES
   ↓
RUNTIME / PLAYER
   ↓
ANALYTICS
   ↓
GOVERNED LEARNING
   ↺
```

## 2. CANONICAL OWNERS

| Concern | Owner |
|---|---|
| Reality / provenance | `apps/api/src/services/authorRealityGraph.ts` |
| Cognition | `apps/api/src/services/authorCognition.ts` |
| Movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` |
| Viewer-state rerank | `apps/api/src/services/authorViewerState.ts` |
| Master orchestration | `apps/api/src/services/authorBrainCanonical.ts` |
| Canonical Mouth boundary | `apps/api/src/services/authorMouthCandidateSearchCanonical.ts` |
| Mouth interpretation / safety | `apps/api/src/services/authorMouthInterpretation.ts` |
| Mouth sequence selection | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` |
| Sequence arc diagnostics | `apps/api/src/services/authorSequenceArcGate.ts` |
| Experience state | `apps/api/src/services/authorExperienceState.ts` |
| Behavior profile | `apps/api/src/services/authorBehaviorProfile.ts` |

There is **one movie authority**: Cognition searches and selects. Canonical Author consumes that result and must not launch a second movie search.
There is **one Mouth authority**: `authorMouthCandidateSearchCanonical.ts` owns candidate realization. No compatibility Mouth implementation exists.

## 3. MOVIE LAW

A movie is a structured hypothesis over immutable supplied reality.

```text
RealityGraph
 → competing trajectories
 → viewer-state scoring
 → selectedMovie
```

Source order is **soft evidence**, not chronology. It may influence a sequence when supplied material naturally reads as progression, but a stronger semantic trajectory may override it.

## 4. MOUTH LAW

Mouth is language realization, not story invention.

The target is:

```text
approved beat
+
semantic obligation
+
whole supplied context
↓
specific viewer-facing cut
```

Lexical overlap is evidence, not authority.

```text
semantic compression
status / register
implication
irony
understatement
callback
recontextualization
normalcy-under-pressure
```

are legitimate realization mechanisms when grounded.

Hard boundaries remain:

```text
unsupported concrete world claim → reject
unsupported characterization → reject
planner / diagnostic residue → reject
```

Examples of desired behavior:

```text
talked til close → We stayed.
feeling good → Fabulous.
mud bath was free → Complimentary.
```

An expressive line must not silently add a property to reality merely because that property sounds genre-appropriate.

## 5. GENRE LAW

A lens changes interpretation, not reality.

Horror does not mean “make everything strange.” A stronger horror cut may be:

```text
extraordinary supplied circumstance
+
ordinary social behavior
+
underreaction / restraint
=
tension
```

Comedy may contain straight facts. Romance may be restrained. Sentiment may be quiet. Absurdity may come from status or juxtaposition. The lens is a pressure on interpretation, not an event generator.

## 6. VIEWER-STATE LAW

Viewer-state scoring evaluates:

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

Source-order continuity is deliberately a minor factor. It gives natural supplied sequences gravitational pull without converting list order into chronology.

## 7. MEMORY / STATE / LEARNING

```text
memory = durable world truth
state = current experience continuity
profile = bounded user preference
analytics = observation
learning = governed adaptation
```

None may mutate source truth.

## 8. ACCEPTANCE

Compilation is necessary but not sufficient.

After Author changes, validate:

```powershell
pnpm --filter @qre/api build
git diff --check

pnpm exec tsx apps/api/author-acceptance.ts
```

Then run the broader Author-specific acceptance surfaces that are relevant to the change.

## 9. DEFINITION OF DONE

The system is successful when it reliably does this:

```text
supplied reality
   ↓
find the strongest movie hidden inside it
   ↓
keep the sequence alive across cuts
   ↓
let language become concise / strange / funny / ominous / elegant as earned
   ↓
never fabricate the world
   ↓
learn from actual interaction
```

**The goal is not better prose. The goal is a system that finds a movie worth watching inside real supplied material and can do it again.**
