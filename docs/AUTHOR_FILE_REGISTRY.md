# QRE AUTHOR FILE REGISTRY

**STATUS:** CANONICAL AUDIT REGISTRY
**SNAPSHOT:** `audit/mouth-production-sync` / `587304bb862003d764d383baa36e9a71da326c79`

This registry is the single sectional map for Author architecture files. Update the relevant section when ownership or behavior changes. The end-of-day alignment pass verifies the whole registry against code, contracts, imports, guards, and acceptance.

## 01 · PRODUCTION ORCHESTRATION

| Status | File | Role | Owner / responsibility |
|---|---|---|---|
| CANONICAL | `apps/api/src/services/authorBrainUniversal.ts` | Master Author orchestration | sole production Author authority |
| CANONICAL | `apps/api/src/services/authorRealityGraph.ts` | source reality graph | reality/evidence authority |
| CANONICAL | `apps/api/src/services/authorCognition.ts` | cognition / character / hypothesis layer | cognition authority |
| CANONICAL | `apps/api/src/services/authorLatentMovieSearch.ts` | latent movie search | movie hypothesis authority |
| CANONICAL | `apps/api/src/services/authorMovieDifferentiation.ts` | material movie diversity | movie differentiation authority |
| CANONICAL | `apps/api/src/services/authorMeaningSpine.ts` | semantic beat operations | meaning authority |
| CANONICAL | `apps/api/src/services/authorMouthRealizationSlot.ts` | realization boundary | converts Meaning Spine semantics into Mouth jobs |
| CANONICAL | `apps/api/src/services/authorMouthCandidateSearch.ts` | candidate generation / normalization / semantic scoring | canonical Mouth candidate authority |
| CANONICAL | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | complete sequence search | sequence-selection authority |
| CANONICAL | `apps/api/src/services/authorAttentionEditor.ts` | sequence attention / accumulation evaluation | editorial judgment authority |
| CANONICAL | `apps/api/src/services/authorBeatTruthGate.ts` | beat truth protection | truth boundary |
| CANONICAL | `apps/api/src/services/authorCutPolicy.ts` | final cut legality / density / grounding | cut gate |
| CANONICAL | `apps/api/src/services/authorSequenceArcGate.ts` | sequence-level arc/payoff evaluation | arc gate |
| CANONICAL | `apps/api/src/services/localModelRuntime.ts` | model transport | model transport only; not semantic authority |

## 02 · MOUTH SUPPORT / GATES

| Status | File | Role |
|---|---|---|
| SUPPORT | `apps/api/src/services/authorMouthLanguageGate.ts` | language naturalness / concrete invention / analytic leakage gate |
| SUPPORT | `apps/api/src/services/authorMouthAttentionGate.ts` | individual cut attention diagnostics |
| SUPPORT | `apps/api/src/services/authorMouthQualityAdapter.ts` | cross-gate quality adaptation; truth risk remains a floor |
| SUPPORT | `apps/api/src/services/authorMouthGroundedFallback.ts` | safety fallback when model coverage is incomplete |
| SUPPORT | `apps/api/src/services/authorMouthRepairPlanner.ts` | bounded repair objectives; does not author prose |
| SUPPORT / STRATEGY | `apps/api/src/services/authorRealizationStrategyLattice.ts` | existing Approach-B strategy search; derives safe realization strategies |
| SUPPORT / SEMANTIC STATE | `apps/api/src/services/authorCumulativeMeaning.ts` | cumulative meaning state; migration candidate for canonical editorial ownership |

## 03 · CONTRACTS

| Status | File | Role |
|---|---|---|
| CANONICAL | `packages/contracts/src/cogauthor/mouth.ts` | shared Mouth candidate / beat / pool / beam / repair contracts |
| CANONICAL | `packages/contracts/src/cogauthor/index.ts` | COGAUTHOR public barrel |
| SUPPORT / BROADER AUTHORING | `packages/contracts/src/authoringIntelligence.ts` | strategy / lens / safety / repair / model-tier contracts; currently supplies Approach-B strategy types |
| CANONICAL | `packages/contracts/src/cogauthor/authorBrain.ts` | Master Author truth / scene contracts |
| CANONICAL | `packages/contracts/src/cogauthor/cognition.ts` | cognitive semantic contracts |
| CANONICAL | `packages/contracts/src/cogauthor/latentMovie.ts` | latent movie / trajectory contracts |
| CANONICAL | `packages/contracts/src/cogauthor/realityGraph.ts` | immutable reality graph contracts |
| EXPERIENCE-OWNED / UNDER AUDIT | `packages/contracts/src/experience/beat.ts` | broader Experience beat contract; consumer analysis required before relocation |
| EXPERIENCE-OWNED / UNDER AUDIT | `packages/contracts/src/experience/meaning.ts` | broader Experience meaning contract; consumer analysis required before relocation |

## 04 · NON-CANONICAL ENTERPRISE CLUSTER

| Status | File | Role / disposition |
|---|---|---|
| ACCEPTANCE / NON-CANONICAL | `apps/api/src/services/authorEnterpriseMouth.ts` | alternate Mouth orchestration; useful capabilities must migrate into canonical owners; duplicate orchestration should retire |
| SUPPORT / ENTERPRISE | `apps/api/src/services/authorEnterpriseIntelligence.ts` | strategy/lens/budget/evidence helper cluster; audit consumers before migration |
| ACCEPTANCE | `apps/api/src/services/authorEnterpriseMouthAcceptanceMatrix.ts` | domain-neutral fixtures/invariants |
| ACCEPTANCE | `apps/api/author-enterprise-mouth-acceptance.ts` | acceptance harness for non-canonical Enterprise path |
| SUPPORT / EXPERIMENTAL | `apps/api/src/services/authorCreativeSearch.ts` | creative-search support; consumer trace required before promotion |
| SUPPORT / EXPERIMENTAL | `apps/api/src/services/authorCounterfactualSearch.ts` | counterfactual capability; consumer trace required before promotion |

## 05 · TRAJECTORY / EXPERIMENTAL

| Status | File | Role / disposition |
|---|---|---|
| CANDIDATE / NOT WIRED | `apps/api/src/services/authorTrajectorySearch.ts` | reusable trajectory search; not canonical until endpoint and Master Author consumer wiring are verified |
| ACCEPTANCE | `apps/api/author-trajectory-search-acceptance.ts` | isolated trajectory acceptance |

## 06 · DIAGNOSTIC / HISTORICAL RULE

Files containing `enterprise`, `monster`, `v1`, `v2`, `v3`, `final`, or `fixed` do not gain authority from their names. They require verified owner, input contract, output contract, consumer, and acceptance responsibility.

## 07 · APPROACH-B TARGET

The canonical Mouth evolution target is **not a new parallel subsystem**.

Current pieces already present:

```text
RealizationSlot
    ↓
authorRealizationStrategyLattice.ts
    ↓
AuthorRealizationStrategy / AuthorStrategyCandidate
    ↓
Mouth candidate generation
    ↓
truth / language / attention gates
    ↓
Beam
```

Production work is to make this one path explicit and contract-driven, then retire duplicate orchestration.

## 08 · DAILY ALIGNMENT CHECK

At the end of each change cluster:

```text
CODE
↔ IMPORTS / CONSUMERS
↔ @qre/contracts
↔ AUTHOR ARCHITECTURE INDEX
↔ AUTHOR WIRING MAP
↔ THIS REGISTRY
↔ ACCEPTANCE / GUARDS
```

Anything that cannot be classified gets `UNDER AUDIT`; nothing becomes a silent file.
