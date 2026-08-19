# QRE AUTHOR WIRING MAP

**STATUS:** CURRENT / CANONICAL
**BRANCH:** `author/enterprise-realization-engine`

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
  → authorMouthCandidateSearch.ts
  → authorMouthLanguageGate.ts
  → authorMouthSequenceBeamSearch.ts
  → authorAttentionEditor.ts
  → authorBeatTruthGate.ts / authorCutPolicy.ts
  → final scenes
```

## Canonical owners

| Responsibility | Owner | Consumer |
|---|---|---|
| RealityGraph compilation | `authorRealityGraph.ts` | cognition / Master Author |
| Cognition | `authorCognition.ts` | Master Author |
| Latent movie search | `authorLatentMovieSearch.ts` | cognition / Master Author |
| Movie differentiation | `authorMovieDifferentiation.ts` | movie selection |
| Master Author | `authorBrainUniversal.ts` | acceptance / runtime |
| Meaning Spine | `authorMeaningSpine.ts` | realization slots |
| Realization Slots | `authorMouthRealizationSlot.ts` | Mouth candidates |
| Candidate generation + semantic scoring | `authorMouthCandidateSearch.ts` | Mouth quality / beam |
| Reality/language gate | `authorMouthLanguageGate.ts` | Mouth quality adapter |
| Candidate quality adaptation | `authorMouthQualityAdapter.ts` | Mouth beam |
| Grounded fallback | `authorMouthGroundedFallback.ts` | quality adapter |
| Mouth sequence beam | `authorMouthSequenceBeamSearch.ts` | Master Author |
| Attention editing | `authorAttentionEditor.ts` | Master Author |
| Truth gate | `authorBeatTruthGate.ts` | Master Author |
| Cut policy | `authorCutPolicy.ts` | Master Author |
| Model transport | `localModelRuntime.ts` | canonical Mouth candidate generation |

## Trajectory status

`authorTrajectorySearch.ts` exists as a pure capability with its own structural acceptance. It is **NOT YET CONNECTED to the production Master Author** and therefore is not listed as a live pipeline stage.

The isolated acceptance currently exposes an endpoint-terminal defect (`payoff -> payoff`). That defect must be resolved before trajectory search is promoted.

## Enterprise Mouth status

`authorEnterpriseMouth.ts` is an acceptance-oriented alternate orchestration over many canonical Mouth helpers. `authorBrainUniversal.ts` does not import it.

Therefore:

```text
Enterprise Mouth = NON-CANONICAL / UNDER MIGRATION AUDIT
```

Useful capabilities from its cluster—strategy selection, cumulative meaning, safety, grounded surprise, bounded model budgets—must be migrated into canonical owners only when they improve the live path. Duplicate orchestration must then be retired.

`docs/AUTHOR_ENTERPRISE_MASTER.md` is historical/diagnostic material until that migration is complete; it is not production authority.

## Contract rule

All semantic concepts crossing service boundaries must originate in `@qre/contracts`.

A local type is allowed only when it is genuinely implementation-private. Shared Author/Mouth semantics must not be redefined independently by individual services.

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

## Audit label standard

Every file we certify receives:

```text
FULLY READ
FILE:
ROLE:
OWNS:
DOES NOT OWN:
UPSTREAM:
DOWNSTREAM:
CONTRACT:
CANONICAL:
STATUS:
```

No filename grants architectural authority.