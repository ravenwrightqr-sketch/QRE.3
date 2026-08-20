# QRE AUTHOR WIRING MAP

**STATUS:** CURRENT / CANONICAL
**AUDIT SNAPSHOT:** `audit/mouth-production-sync`

## Canonical live path

```text
SOURCE TRUTH
  → authorRealityGraph.ts
  → authorCognition.ts
  → authorLatentMovieSearch.ts
  → authorMovieDifferentiation.ts
  → authorBrainUniversal.ts
  → authorMeaningSpine.ts
  → authorMouthRealizationSlot.ts
  → authorRealizationStrategyLattice.ts  [promotion target]
  → authorMouthCandidateSearch.ts
  → authorMouthLanguageGate.ts
  → authorMouthAttentionGate.ts
  → authorMouthQualityAdapter.ts
  → authorMouthSequenceBeamSearch.ts
  → authorAttentionEditor.ts
  → authorBeatTruthGate.ts / authorCutPolicy.ts
  → authorSequenceArcGate.ts
  → final scenes
```

## Canonical owners

| Responsibility | Owner | Consumer / status |
|---|---|---|
| RealityGraph compilation | `authorRealityGraph.ts` | cognition / Master Author |
| Cognition | `authorCognition.ts` | Master Author |
| Latent movie search | `authorLatentMovieSearch.ts` | cognition / Master Author |
| Movie differentiation | `authorMovieDifferentiation.ts` | movie selection |
| Master Author | `authorBrainUniversal.ts` | acceptance / runtime |
| Meaning Spine | `authorMeaningSpine.ts` | realization slots |
| Realization Slots | `authorMouthRealizationSlot.ts` | Mouth realization boundary |
| Realization strategy selection | `authorRealizationStrategyLattice.ts` | current capability; **not yet called by canonical Mouth path** |
| Candidate generation + semantic scoring | `authorMouthCandidateSearch.ts` | current canonical Mouth candidate owner; contains a direct generation loop that should be consolidated behind one generation API |
| Reality/language gate | `authorMouthLanguageGate.ts` | quality adapter |
| Attention cut gate | `authorMouthAttentionGate.ts` | quality adapter |
| Candidate quality adaptation | `authorMouthQualityAdapter.ts` | Mouth beam |
| Grounded fallback | `authorMouthGroundedFallback.ts` | quality adapter / safety rail |
| Mouth sequence beam | `authorMouthSequenceBeamSearch.ts` | Master Author |
| Attention editing | `authorAttentionEditor.ts` | Master Author |
| Truth gate | `authorBeatTruthGate.ts` | Master Author |
| Cut policy | `authorCutPolicy.ts` | Master Author |
| Sequence arc | `authorSequenceArcGate.ts` | Master Author |
| Model transport | `localModelRuntime.ts` | canonical Mouth generation only |

## Current architecture finding

The canonical Master Author currently performs its own per-beat model-generation / parse / repair / selection loop instead of delegating the complete Mouth-generation responsibility to one canonical Mouth API. `authorMouthCandidateSearch.ts` also contains generation functionality.

This is an ownership duplication to remove before Approach B is promoted. The target is one Mouth generation owner with:

```text
approved realization job
→ strategy selection
→ bounded model generation
→ normalization / repair
→ language + truth gates
→ candidate pools
```

The Master Author should orchestrate that result, not reimplement the Mouth generation loop.

## Trajectory status

`authorTrajectorySearch.ts` exists as a pure capability with its own structural acceptance. It is **NOT YET CONNECTED to the production Master Author** and therefore is not a live pipeline stage.

The isolated acceptance has exposed an endpoint-terminal defect (`payoff -> payoff`). Resolve that before promotion.

## Enterprise Mouth status

`authorEnterpriseMouth.ts` is an acceptance-oriented alternate orchestration over canonical Mouth helpers. `authorBrainUniversal.ts` does not import it.

Therefore:

```text
Enterprise Mouth = NON-CANONICAL / UNDER MIGRATION AUDIT
```

Useful capabilities from the cluster—strategy selection, cumulative meaning, safety, grounded surprise, bounded model budgets, and cross-domain fixtures—must be migrated into canonical owners only when they improve the live path. Duplicate orchestration must then be retired.

## Contract rule

All semantic concepts crossing service boundaries must originate in `@qre/contracts`.

Canonical Author/Mouth semantic contracts live under:

```text
packages/contracts/src/cogauthor/
```

Broader shared strategy/lens/safety/model-tier contracts currently live in `packages/contracts/src/authoringIntelligence.ts`; do not duplicate them while consumer ownership is being audited.

## Acceptance rule

Production acceptance must exercise `authorBrainUniversal.ts`.

Helper-level acceptance may diagnose a component, but it cannot be called production green unless the canonical Master Author consumes that component.

## Failure interpretation

```text
compile passes
    ≠
production works

helper passes
    ≠
Master Author works

fallback passes
    ≠
Mouth is excellent

production acceptance passes
    =
actual viewer-facing path survived authoritative gates
```
