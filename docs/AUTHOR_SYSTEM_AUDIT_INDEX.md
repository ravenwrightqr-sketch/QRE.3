# QRE AUTHOR + COGNITION + ENGINE AUDIT INDEX

**Status:** WORKING AUDIT INDEX — not yet the final canonical architecture document
**Branch:** `supplied-media-sequence-convergence`
**Purpose:** Temporary map of production ownership, parallel/legacy surfaces, contracts, tests, and cleanup order before further Author tuning.

## 1. Executive verdict

The repository does **not** need all of the roughly 100 Author-related files as production runtime architecture.

The current system already has a coherent intended production spine:

```text
SOURCE REALITY
  ↓
REALITY GRAPH
  ↓
CANONICAL COGNITION
  ↓
MOVIE CANDIDATES
  ↓
VIEWER-STATE RERANK
  ↓
SELECTED MOVIE
  ↓
CANONICAL AUTHOR
  ↓
MOUTH CANDIDATES
  ↓
SEQUENCE BEAM
  ↓
ATTENTION / ARC GATES
  ↓
FINAL SCENES
  ↓
RUNTIME / PLAYER
  ↓
ANALYTICS
  ↓
GOVERNED LEARNING
```

The problem is not that the architecture is too small. The problem is that the repository still contains several generations of implementation around that spine.

The immediate objective is therefore **ownership convergence**, not another layer of intelligence.

## 2. Current canonical production owners

| Responsibility | Current owner | Disposition |
|---|---|---|
| Master orchestration | `apps/api/src/services/authorBrainCanonical.ts` | KEEP / canonical |
| Source reality / provenance | `apps/api/src/services/authorRealityGraph.ts` | KEEP / canonical |
| Cognitive interpretation + movie authority | `apps/api/src/services/authorCognition.ts` | KEEP / canonical |
| Universal movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` | KEEP / canonical |
| Viewer-state movie rerank | `apps/api/src/services/authorViewerState.ts` | KEEP / canonical |
| Latent story thesis | `apps/api/src/services/authorLatentStoryThesis.ts` | KEEP / support |
| Character / frame interpretation | `apps/api/src/services/authorCharacterLensEngine.ts` | KEEP / support |
| Experience state / continuity | `apps/api/src/services/authorExperienceState.ts` | KEEP / support |
| Author memory integration | `apps/api/src/services/authorExperienceMemory.ts` | KEEP / support |
| Memory continuity | `apps/api/src/services/authorMemoryContinuity.ts` | KEEP / support |
| Memory intelligence | `apps/api/src/services/authorMemoryIntelligence.ts` | KEEP / review after consumer audit |
| Behavior profile | `apps/api/src/services/authorBehaviorProfile.ts` | KEEP / bounded preference |
| Realization mode | `apps/api/src/services/authorRealizationMode.ts` | KEEP / support |
| Mouth interpretation | `apps/api/src/services/authorMouthInterpretation.ts` | KEEP / canonical boundary |
| Mouth candidate generation | `apps/api/src/services/authorMouthCandidateSearch.ts` | KEEP temporarily / legacy core being wrapped |
| Canonical Mouth adapter | `apps/api/src/services/authorMouthCandidateSearchCanonical.ts` | KEEP temporarily / migration seam |
| Sequence selection | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | KEEP / canonical |
| Attention editing | `apps/api/src/services/authorAttentionEditor.ts` | KEEP / canonical |
| Sequence arc diagnostics | `apps/api/src/services/authorSequenceArcGate.ts` | KEEP / canonical |
| Model transport | `apps/api/src/services/localModelRuntime.ts` | KEEP / infrastructure |
| AI provider | `apps/api/src/services/aiProvider.ts` | KEEP / infrastructure |
| Production API adapter | `apps/api/src/services/experienceService.ts` | KEEP / adapter; calls canonical Author once |
| Reality memory projection | `apps/api/src/services/memoryProjection.ts` | KEEP / persistence boundary |

## 3. High-confidence legacy / parallel surfaces

### A. Engine UniversalMind

`packages/engine/src/cognition/universalMind.ts` is a complete second cognition/creative pipeline. It imports its own world model, significance analysis, candidate generators, narrative writer, composition, voice generation, revision, critic, planner, and mind-state learning.

`packages/engine/src/cognition/index.ts` and `packages/engine/src/index.ts` still expose `compileCognitiveExperience`.

This is **not** the current Author production authority. Current production `experienceService.ts` calls `authorBrainCanonical` once. The engine UniversalMind path should therefore be treated as a **legacy/public compatibility surface pending consumer audit**.

Do not delete it blindly. First prove whether any runtime path still imports it. Once consumers are gone, deprecate/remove the public export rather than leaving a second creative brain reachable.

### B. Parallel latent movie search

`apps/api/src/services/authorLatentMovieSearch.ts` is another substantial movie-search implementation, with its own convergence/differentiation collaborators.

Current canonical Cognition instead owns `searchUniversalMovieCandidates()` through `authorUniversalMovieSearch.ts`.

Disposition: **REVIEW / likely historical parallel implementation**.

Audit consumers before deleting or folding useful logic into the canonical search.

### C. Disconnected creative competition

`apps/api/src/services/authorCreativeSearch.ts` defines:

- `buildMovieAlternatives()`
- `critiqueCreativeSelection()`
- `surpriseScore()`

The repository search found no current call site for `buildMovieAlternatives`.

This is **not automatically dead code**. It is a useful seed for the creative-competition behavior we want, but it currently is not part of the canonical movie-selection chain.

It must not be wired into `authorBrainCanonical.ts` downstream of Cognition. That would create a second movie authority.

Correct destination:

```text
RealityGraph
  ↓
Universal Movie Search
  ↓
materially different candidate movies
  ↓
differentiation / dominance pruning
  ↓
viewer-state rerank
  ↓
selectedMovie
```

The likely implementation is to fold the useful alternative/dominance logic into the existing Cognition/movie-search ownership rather than create a second movie service.

## 4. Mouth convergence problem

The current canonical Brain imports `deriveViewerStateCut` directly from:

`apps/api/src/services/authorMouthCandidateSearch.ts`

while candidate generation/scoring is imported through:

`apps/api/src/services/authorMouthCandidateSearchCanonical.ts`

The so-called canonical adapter itself imports generation/parsing/scoring from the legacy file.

Therefore the current state is **not yet a clean one-layer canonical Mouth**. It is a migration seam around an older implementation.

Target:

```text
APPROVED BEAT
  ↓
ONE MOUTH CANDIDATE / INTERPRETATION OWNER
  ↓
AUTHORIZED CANDIDATES
  ↓
BEAM
```

We should eliminate the split only after preserving its tested behavior.

## 5. Explicitly retired surfaces already identified by repository tooling

The existing Author audit script marks these as retired:

```text
authorEnterpriseAdversarialMatrix.ts
authorEnterpriseIntelligence.ts
authorEnterpriseMouth.ts
authorEnterpriseMouthAcceptanceMatrix.ts
authorEnterpriseMouthPolicy.ts
authorEnterpriseRuntime.ts
authorEnterpriseSafety.ts
authorMouthQualityAdapter.ts
authorMouthGroundedFallback.ts
authorMouthLanguageGate.ts
authorMouthAttentionGate.ts
authorMouthRepairPlanner.ts
authorCumulativeMeaning.ts
authorLatentMovieBeatAdapter.ts
```

Important: current architecture documentation still names `authorMouthQualityAdapter.ts` and `authorMouthAttentionGate.ts` as canonical. The audit script disagrees. This is a **documentation/tooling drift defect** that must be resolved before final cleanup.

Do not delete those two files from the repo solely from this index. First update the audit rule or architecture reference based on actual reachability and intended ownership.

## 6. Contract layer audit

Contracts are **not runtime brains**.

### Shared experience contracts

`packages/contracts/src/experience/*` contains shared shapes used across authoring, cognition, runtime, cinematic projection, memory, and delivery.

`packages/contracts/src/experience/moment.ts` explicitly defines the canonical experience atom and states that it is used by authoring, cognition, runtime, cinematic projection, memory, and delivery.

Therefore engine-related imports from `@qre/contracts` are not by themselves evidence of an engine cognition dependency.

### Author-specific contract subsurface

`packages/contracts/src/cogauthor/*` is explicitly labeled as the public COGAUTHOR contract surface.

It contains Author-oriented cognition, movie, reality graph, and mouth contracts.

This is a **contract namespace**, not a second runtime brain.

### Current contract duplication to review

Both of these contain cognition-oriented structures:

```text
packages/contracts/src/experience/cognition.ts
packages/contracts/src/cogauthor/cognition.ts
```

They should not be assumed identical. They need a type-usage audit before any consolidation.

The working hypothesis is:

```text
experience/*
  = shared experience/runtime data contracts

cogauthor/*
  = explicit Author/Cognition subsurface contracts
```

If both are active for the same semantic object, consolidate deliberately. If one serves engine compatibility, preserve it until the engine boundary is clean.

## 7. Engine boundary verdict

Current production API usage of `@qre/engine` observed in `experienceService.ts` is for runtime/presence support (`buildPresenceContext`), not for invoking the engine UniversalMind creative compiler.

That is compatible with the intended architecture:

```text
Author = semantic authoring authority
Engine = runtime / delivery machinery
```

The remaining risk is that the engine package still publicly exposes its old cognition compiler. Public export does not prove production reachability, but it does leave a parallel semantic path available.

Next action: consumer audit of `compileCognitiveExperience`, `universalMind`, `experiencePlanner`, and the engine cognition index.

## 8. Tests, probes, and tooling are not Author runtime complexity

The repository contains many:

```text
apps/api/author-*-acceptance.ts
apps/api/*-probe.ts
scripts/*author*.mjs
```

These should be counted as validation/tooling, not as additional production semantic owners.

They are still valuable. Their purpose is to prove the canonical path and prevent regression.

The current canonical acceptance entrypoint is:

```text
apps/api/author-acceptance.ts
```

and it calls `authorBrainCanonical` directly while checking completion, scene/sequence consistency, model-request count, and source provenance.

## 9. Working classification of the large Author surface

### KEEP — canonical / support

```text
authorBrainCanonical.ts
authorRealityGraph.ts
authorRealityEnvelope.ts
authorCognition.ts
authorUniversalMovieSearch.ts
authorViewerState.ts
authorLatentStoryThesis.ts
authorCharacterLensEngine.ts
authorExperienceState.ts
authorExperienceMemory.ts
authorMemoryContinuity.ts
authorBehaviorProfile.ts
authorRealizationMode.ts
authorMouthInterpretation.ts
authorMouthSequenceBeamSearch.ts
authorAttentionEditor.ts
authorSequenceArcGate.ts
localModelRuntime.ts
aiProvider.ts
```

### REVIEW — likely support but must prove current consumers

```text
authorMemoryIntelligence.ts
authorMeaningSpine.ts
authorCutPolicy.ts
authorBeatTruthGate.ts
authorBeatPlanRecovery.ts
authorRealizationStrategyLattice.ts
authorMouthCraft.ts
authorMouthCreativeLock.ts
authorMouthCritic.ts
authorMouthRealizationSlot.ts
authorMouthSequenceCritic.ts
authorWholeWorldSequenceScorer.ts
```

This category is intentionally conservative. A zero-consumer result is a review signal, not permission to delete.

### REVIEW — parallel / fold-or-retire candidates

```text
authorCreativeSearch.ts
authorLatentMovieSearch.ts
authorLatentMovieConvergence.ts
authorMovieDifferentiation.ts
authorLatentMovieBeatAdapter.ts
```

Useful algorithms may be absorbed into canonical owners. Do not create parallel authorities to keep them alive.

### RETIRED — per current audit tooling

Use the explicit list in section 5, but reconcile the two drifted Mouth entries first.

### TEST / PROBE / TOOLING

All acceptance, probe, and migration scripts are separate from production semantic runtime.

## 10. Immediate P0 cleanup

Do these before adding more creative machinery:

1. **Freeze the ownership map.** This index establishes the working target: Cognition owns movie choice; Canonical Author consumes it; Mouth realizes the approved beat; Beam selects expression.
2. **Run the full consumer audit** across every `author*.ts` service plus engine cognition exports. Record exact consumer counts and classify each file as KEEP / SUPPORT / REVIEW / RETIRED.
3. **Resolve Mouth documentation drift.** Decide whether `authorMouthQualityAdapter.ts` and `authorMouthAttentionGate.ts` are truly canonical, transitional, or retired. Update both docs and tooling together.
4. **Remove the live legacy Mouth dependency** from `authorBrainCanonical.ts` once an equivalent canonical source for `deriveViewerStateCut` exists.
5. **Audit engine UniversalMind reachability.** If nothing production calls it, keep it only as compatibility/history temporarily and remove the public cognition export in a separate controlled change.

## 11. Immediate P1 creative improvement

After P0 cleanup, wire the existing creative-competition idea into **Cognition**, not Mouth:

```text
RealityGraph
   ↓
searchUniversalMovieCandidates()
   ↓
competing materially different movies
   ↓
differentiation / dominance pruning
   ↓
viewer-state rerank
   ↓
selectedMovie
```

`buildMovieAlternatives()` is a candidate-selection utility, not a replacement Brain. Its useful parts are grounding, novelty, relation density, and dominated-candidate detection.

Prefer adapting it to `LatentMovieCandidate` or folding its logic into `authorMovieDifferentiation.ts` / `authorUniversalMovieSearch.ts` rather than introducing another `CreativeSearchOption` layer solely to preserve an orphaned abstraction.

## 12. Immediate P2: finish the Mouth

Once movie competition is genuinely upstream:

```text
selected movie
  ↓
approved beats
  ↓
full source evidence
  ↓
Mouth realization
  ↓
beam
  ↓
attention / arc
  ↓
final scenes
```

Then measure sentence quality on the actual output.

Do not solve weak lines by adding more architecture. The Author decision law says internal sophistication only counts when it survives into the mouth.

## 13. Definition of done for this audit phase

We are done with cleanup when:

```text
ONE semantic owner per decision
NO production path reaches UniversalMind cognition
NO canonical Brain imports legacy Mouth helpers
NO disconnected movie competition layer remains without an explicit status
CONTRACTS are clearly separated from runtime ownership
TESTS prove the canonical path
```

Only then continue aggressive creative tuning.

## 14. Current answer to “where do we go right now?”

**Right now: do not tune another Mouth score.**

The next engineering move is:

```text
P0: consumer/ownership audit
        ↓
P0: clean Mouth split + docs/tooling drift
        ↓
P0: prove engine cognition is not production-reachable
        ↓
P1: put buildMovieAlternatives-style competition upstream in Cognition
        ↓
P1: acceptance on materially different movies
        ↓
P2: return to Mouth sentence-quality tuning
```

The creative target remains:

```text
ordinary supplied reality
      ↓
QRE finds the strongest movie hiding inside it
      ↓
QRE chooses among genuinely different interpretations
      ↓
QRE knows what changed for the viewer
      ↓
Mouth finds the strongest expression
      ↓
truth stays intact
```

That is the path forward. Do not add another brain.
