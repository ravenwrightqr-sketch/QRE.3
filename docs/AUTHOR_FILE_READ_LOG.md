# QRE AUTHOR FILE READ LOG

**Purpose:** Make repository inspection explicit. A file is labeled **FULLY READ** only after its complete current contents were inspected. Directory listings, search hits, snippets, and partial fetches do not qualify.

## FULLY READ — CURRENT BRANCH

| Status | File | Role / scope |
|---|---|---|
| FULLY READ | `docs/AUTHOR_ARCHITECTURE_INDEX.md` | Canonical current ownership/pipeline authority |
| FULLY READ | `docs/AUTHOR_CURRENT_STATE.md` | Current production path and development law |
| FULLY READ | `docs/AUTHOR_WIRING_MAP.md` | Exact current stage ownership and production-vs-noncanonical boundaries |
| FULLY READ | `docs/AUTHOR_DECISION_LAW.md` | Author design laws / quality standard |
| FULLY READ | `docs/AUTHOR_NEXT_WORLD.md` | Strategic/ideation material; not architecture authority |
| FULLY READ | `docs/AUTHOR_PRODUCTION_ALIGNMENT.md` | Current operating ledger |
| FULLY READ | `docs/AUTHOR_FILE_REGISTRY.md` | Sectional Author file ownership/status registry |
| FULLY READ | `docs/COGAUTHOR_CONTRACT_MAP.md` | Canonical COGAUTHOR contract namespace and ownership |
| FULLY READ | `apps/api/src/services/authorRealityGraph.ts` | RealityGraph compiler |
| FULLY READ | `apps/api/src/services/authorCognition.ts` | Cognition / character read / latent movie discovery |
| FULLY READ | `apps/api/src/services/authorMovieDifferentiation.ts` | Material movie diversity gate |
| FULLY READ | `apps/api/src/services/authorBrainUniversal.ts` | Production Master Author orchestration |
| FULLY READ | `apps/api/src/services/authorMeaningSpine.ts` | Meaning semantic contract |
| FULLY READ | `apps/api/src/services/authorMouthRealizationSlot.ts` | Canonical realization boundary |
| FULLY READ | `apps/api/src/services/authorMouthCandidateSearch.ts` | Mouth candidate generation / normalization / scoring |
| FULLY READ | `apps/api/src/services/authorMouthLanguageGate.ts` | Language / concrete-reality gate |
| FULLY READ | `apps/api/src/services/authorMouthAttentionGate.ts` | Individual cut attention gate |
| FULLY READ | `apps/api/src/services/authorMouthQualityAdapter.ts` | Cross-gate quality adaptation; truth risk floor |
| FULLY READ | `apps/api/src/services/authorMouthGroundedFallback.ts` | Grounded safety fallback |
| FULLY READ | `apps/api/src/services/authorMouthRepairPlanner.ts` | Bounded repair objectives |
| FULLY READ | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | Sequence-level Mouth beam |
| FULLY READ | `apps/api/src/services/authorAttentionEditor.ts` | Whole-sequence editorial evaluation |
| FULLY READ | `apps/api/src/services/authorBeatTruthGate.ts` | Beat truth gate |
| FULLY READ | `apps/api/src/services/authorCutPolicy.ts` | Final cut legality / density / grounding |
| FULLY READ | `apps/api/src/services/authorSequenceArcGate.ts` | Sequence-level arc / payoff gate |
| FULLY READ | `apps/api/src/services/authorRealizationStrategyLattice.ts` | Existing Approach-B strategy selection machinery |
| FULLY READ | `apps/api/src/services/authorCumulativeMeaning.ts` | Cumulative meaning support; migration candidate |
| FULLY READ | `apps/api/src/services/authorEnterpriseMouth.ts` | Non-canonical acceptance-oriented alternate orchestration |
| FULLY READ | `apps/api/src/services/authorEnterpriseIntelligence.ts` | Enterprise helper cluster; consumer audit ongoing |
| FULLY READ | `apps/api/src/services/authorCreativeSearch.ts` | Experimental creative-search capability; consumer audit ongoing |
| FULLY READ | `apps/api/src/services/authorCounterfactualSearch.ts` | Experimental counterfactual capability; consumer audit ongoing |
| FULLY READ | `apps/api/author-enterprise-mouth-acceptance.ts` | Non-canonical Enterprise acceptance harness |
| FULLY READ | `apps/api/author-trajectory-search-acceptance.ts` | Isolated trajectory acceptance |
| FULLY READ | `packages/contracts/src/cogauthor/authorBrain.ts` | COGAUTHOR AuthorBrain truth/scenes contract |
| FULLY READ | `packages/contracts/src/cogauthor/realityGraph.ts` | COGAUTHOR immutable RealityGraph contract |
| FULLY READ | `packages/contracts/src/cogauthor/latentMovie.ts` | COGAUTHOR latent movie / trajectory contract |
| FULLY READ | `packages/contracts/src/cogauthor/cognition.ts` | COGAUTHOR cognition / planning semantic contract |
| FULLY READ | `packages/contracts/src/cogauthor/mouth.ts` | COGAUTHOR shared Mouth candidate/beat/pool/beam/repair contract |
| FULLY READ | `packages/contracts/src/cogauthor/index.ts` | COGAUTHOR contract barrel |
| FULLY READ | `packages/contracts/src/authoringIntelligence.ts` | shared strategy/lens/safety/model-tier contracts |
| FULLY READ | `scripts/verify-author-wiring.mjs` | current canonical dependency/ownership guard |
| FULLY READ | `scripts/verify-contract-ownership.mjs` | contract ownership guard |

## RETIRED / REMOVED CONTRACT LOCATIONS

The following former Experience paths are no longer contract authorities:

```text
packages/contracts/src/experience/authorBrain.ts
packages/contracts/src/experience/cognition.ts
packages/contracts/src/experience/latentMovie.ts
packages/contracts/src/experience/realityGraph.ts
packages/contracts/src/experience/mouth.ts
```

Their canonical replacements are under:

```text
packages/contracts/src/cogauthor/
```

## PARTIAL / NOT FULLY CERTIFIED YET

| Status | File | Reason |
|---|---|---|
| PARTIAL | `apps/api/src/services/authorLatentMovieSearch.ts` | Full-file certification / consumer trace pending |
| PARTIAL | `apps/api/src/services/localModelRuntime.ts` | Transport boundary verified; full-file certification pending |
| PARTIAL | `apps/api/src/services/authorLatentMovieConvergence.ts` | Consumer trace required before canonical / legacy classification |
| PARTIAL | `apps/api/src/services/authorLatentStoryThesis.ts` | Consumer trace required before canonical / legacy classification |
| PARTIAL | `apps/api/src/services/authorCharacterLensEngine.ts` | Helper read through Enterprise Intelligence; full-file certification pending |
| PARTIAL | `apps/api/src/services/authorModelRouter.ts` | Helper read through Enterprise Intelligence; full-file certification pending |
| PARTIAL | `apps/api/src/services/authorMultimodalEvidence.ts` | Helper read through Enterprise Intelligence; full-file certification pending |

## CURRENT REPOSITORY CONCLUSIONS

The file name is never the authority.

```text
ONE REALITY MODEL
ONE MASTER AUTHOR
ONE CANONICAL MOVIE SEARCH
ONE CANONICAL MOUTH PATH
ONE REALIZATION STRATEGY PATH
ONE ATTENTION EDITOR
ONE TRUTH / CUT GATE
ONE PRODUCTION ACCEPTANCE PATH
```

The current repository still contains additional helpers, adapters, enterprise services, benchmarks, diagnostics, and strategy material. They remain under audit until their owner, consumers, and acceptance responsibility are verified.

## PER-FILE LABEL STANDARD

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

## AUDIT LAW

No file becomes canonical because its name contains:

```text
author
mouth
brain
enterprise
monster
v1
v2
v3
final
fixed
```

Canonical status requires a verified owner, input contract, output contract, downstream consumer, and acceptance responsibility.

## 2026-08-19 · Mouth production snapshot / Approach-B mapping

SNAPSHOT: `audit/mouth-production-sync`
COMMIT: `587304bb862003d764d383baa36e9a71da326c79`

FINDING: `authorMouthRealizationSlot.ts` is already the correct semantic boundary for Approach B.
FINDING: `authorRealizationStrategyLattice.ts` already implements safe realization-strategy selection and is currently SUPPORT / PROMOTION TARGET rather than a second Mouth author.
FINDING: `packages/contracts/src/authoringIntelligence.ts` already owns `AuthorRealizationStrategy`, `AuthorStrategyCandidate`, and `AuthorRealizationObjective`; no second strategy contract should be created without consumer proof.
FINDING: `authorEnterpriseMouth.ts` is non-canonical alternate orchestration and should be mined for capabilities, not promoted as another production author.
FINDING: `authorCumulativeMeaning.ts` is a migration candidate for canonical editorial ownership, not a second semantic authority.

CHANGE: added `docs/AUTHOR_FILE_REGISTRY.md` as the sectional single-source file map.
CHANGE: aligned architecture/contract documentation with the actual COGAUTHOR contract namespace and explicit realization-strategy stage.
