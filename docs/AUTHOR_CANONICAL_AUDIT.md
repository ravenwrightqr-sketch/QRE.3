# QRE AUTHOR CANONICAL AUDIT

**Status:** CANONICAL AUDIT BASELINE  
**Branch:** `supplied-media-sequence-convergence`  
**Purpose:** Freeze semantic ownership before further Author feature work.

## Master law

There is one production semantic path:

```text
SOURCE INPUT
  ↓
REALITY GRAPH
  ↓
CANONICAL COGNITION
  ↓
MOVIE SEARCH + VIEWER-STATE RERANK
  ↓
SELECTED MOVIE
  ↓
CANONICAL AUTHOR
  ↓
MOUTH
  ↓
BEAM
  ↓
ATTENTION / ARC GATES
  ↓
FINAL SCENES
```

Cognition decides the movie. Canonical Author orchestrates the approved movie. Mouth realizes approved beats. Gates evaluate; they do not become replacement Authors.

## Confirmed canonical owners

| Responsibility | Owner |
|---|---|
| Master Author | `apps/api/src/services/authorBrainCanonical.ts` |
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` |
| Reality envelope | `apps/api/src/services/authorRealityEnvelope.ts` |
| Cognition / movie authority | `apps/api/src/services/authorCognition.ts` |
| Deterministic movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` |
| Viewer-state rerank | `apps/api/src/services/authorViewerState.ts` |
| Latent story thesis | `apps/api/src/services/authorLatentStoryThesis.ts` |
| Character / lens frame | `apps/api/src/services/authorCharacterLensEngine.ts` |
| Experience state | `apps/api/src/services/authorExperienceState.ts` |
| Memory continuity | `apps/api/src/services/authorMemoryContinuity.ts` |
| Experience memory | `apps/api/src/services/authorExperienceMemory.ts` |
| Behavior profile | `apps/api/src/services/authorBehaviorProfile.ts` |
| Mouth boundary | `apps/api/src/services/authorMouthCandidateSearchCanonical.ts` |
| Mouth implementation currently behind boundary | `apps/api/src/services/authorMouthCandidateSearch.ts` |
| Mouth interpretation | `apps/api/src/services/authorMouthInterpretation.ts` |
| Mouth quality adaptation | `apps/api/src/services/authorMouthQualityAdapter.ts` |
| Mouth sequence beam | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` |
| Attention editor | `apps/api/src/services/authorAttentionEditor.ts` |
| Sequence arc gate | `apps/api/src/services/authorSequenceArcGate.ts` |
| Model transport | `apps/api/src/services/localModelRuntime.ts` |
| Provider | `apps/api/src/services/aiProvider.ts` |
| API Author adapter | `apps/api/src/services/experienceService.ts` |

## Contract ownership

The canonical concrete Author/Cognition/RealityGraph/LatentMovie definitions live under `packages/contracts/src/experience/`.

The following `cogauthor` files are compatibility surfaces, not competing definitions:

```text
packages/contracts/src/cogauthor/authorBrain.ts
packages/contracts/src/cogauthor/cognition.ts
packages/contracts/src/cogauthor/latentMovie.ts
packages/contracts/src/cogauthor/realityGraph.ts
```

`packages/contracts/src/cogauthor/mouth.ts` remains the shared COGAUTHOR Mouth contract surface.

This arrangement means there is one concrete definition for Cognition and RealityGraph while preserving compatibility imports.

## Engine Cognition boundary

`packages/engine/src/cognition/` contains a substantial older cognition/creative stack, including `universalMind.ts`, `experiencePlanner.ts`, `worldModel.ts`, narrative writers, creative composition, critics, revision, and related state.

That stack is **not the Author semantic owner** merely because it exists or is exported. The production Author path is owned by `apps/api/src/services/authorBrainCanonical.ts` and `authorCognition.ts`.

Before removing the engine cognition surface, run the repository audit and prove that no production consumer depends on `compileCognitiveExperience` or `universalMind`.

## Historical tooling

Versioned migration scripts, probes, acceptance programs, and patch files are validation/history. They do not count as production semantic owners.

They remain until their consumers and maintenance value are proven to be gone. Do not delete historical tooling merely because its filename looks old.

## Known transition seams

### Mouth

The Mouth is currently a migration seam: the canonical boundary is `authorMouthCandidateSearchCanonical.ts`, while portions of the older implementation remain in `authorMouthCandidateSearch.ts`.

Do not delete the implementation until its remaining consumers and tested behavior have been replaced.

### Creative interpretation

`authorCreativeInterpretation.ts` and `authorLatentStoryThesis.ts` now expose and select multiple sequence-backed interpretations, but the current candidate generator still produces semantically overlapping interpretations for simple relationship examples.

The next creative task is to improve differentiation in Cognition, not add another Mouth scorer.

## Required audit command

From the repository root:

```powershell
node scripts/author-canonical-audit.mjs
```

The audit is read-only. It reports:

- canonical owner presence;
- relative reachability from `authorBrainCanonical.ts`;
- legacy/orphan review signals;
- core contract owner and compatibility-shim status;
- engine cognition consumers;
- historical Author tooling;
- empty/temp artifacts.

A warning is not permission to delete. Deletion requires an explicit consumer proof and a passing broader acceptance.

## Required validation after cleanup changes

```powershell
pnpm --filter @qre/api build
git diff --check
pnpm exec tsx apps/api/author-acceptance.ts
```

Then run the focused acceptance for the changed semantic owner.

## Definition of done

The cleanup phase is complete when:

```text
ONE Author owner
ONE Cognition owner
ONE RealityGraph owner
ONE movie authority
ONE Mouth boundary
ONE Beam
ONE attention/arc boundary
ONE concrete contract definition per semantic object
NO production path reaches retired creative brains
NO unexplained duplicate semantic owners
```

Only after that should the team resume aggressive creative tuning and lens development.
