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
| FULLY READ | `docs/COGAUTHOR_CONTRACT_MAP.md` | Canonical COGAUTHOR contract namespace and ownership |
| FULLY READ | `apps/api/src/services/authorRealityGraph.ts` | RealityGraph compiler |
| FULLY READ | `apps/api/src/services/authorCognition.ts` | Cognition / character read / latent movie discovery |
| FULLY READ | `apps/api/src/services/authorMovieDifferentiation.ts` | Material movie diversity gate |
| FULLY READ | `apps/api/src/services/authorBrainUniversal.ts` | Production Master Author orchestration |
| FULLY READ | `apps/api/src/services/authorTrajectorySearch.ts` | Candidate trajectory-level search; not yet production-wired; endpoint-terminal defect identified |
| FULLY READ | `apps/api/src/services/authorMouthCandidateSearch.ts` | Mouth candidate generation and semantic scoring; shared semantic types identified for contract migration |
| FULLY READ | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | Sequence-level Mouth beam |
| FULLY READ | `apps/api/src/services/authorMouthQualityAdapter.ts` | Mouth quality adaptation; invention-risk laundering repaired |
| FULLY READ | `apps/api/src/services/authorMouthRepairPlanner.ts` | Bounded repair objectives |
| FULLY READ | `apps/api/src/services/authorEnterpriseMouth.ts` | Alternate acceptance-oriented Mouth orchestration; NOT imported by Master Author |
| FULLY READ | `apps/api/src/services/authorEnterpriseIntelligence.ts` | Enterprise helper combining strategy/lens/budget/evidence capabilities |
| FULLY READ | `apps/api/src/services/authorRealizationStrategyLattice.ts` | Safe realization strategy selection; consumes canonical MouthCandidateBeat |
| FULLY READ | `apps/api/src/services/authorEnterpriseMouthAcceptanceMatrix.ts` | Domain-neutral Mouth fixtures/invariants |
| FULLY READ | `apps/api/author-enterprise-mouth-acceptance.ts` | Acceptance harness for non-canonical Enterprise Mouth path |
| FULLY READ | `apps/api/author-trajectory-search-acceptance.ts` | Isolated trajectory acceptance |
| FULLY READ | `packages/contracts/src/cogauthor/authorBrain.ts` | COGAUTHOR AuthorBrain truth/scenes contract |
| FULLY READ | `packages/contracts/src/cogauthor/realityGraph.ts` | COGAUTHOR immutable RealityGraph contract |
| FULLY READ | `packages/contracts/src/cogauthor/latentMovie.ts` | COGAUTHOR latent movie / trajectory hypothesis contract |
| FULLY READ | `packages/contracts/src/cogauthor/cognition.ts` | COGAUTHOR cognition / planning semantic contract |
| FULLY READ | `packages/contracts/src/cogauthor/mouth.ts` | COGAUTHOR shared Mouth candidate/beam/repair contract |
| FULLY READ | `packages/contracts/src/cogauthor/index.ts` | COGAUTHOR contract barrel |
| FULLY READ | `packages/contracts/src/experience/beat.ts` | Existing public ExperienceBeat contract |
| FULLY READ | `packages/contracts/src/experience/authoring.ts` | Existing experience authoring/version contract; remains broader Experience-owned |
| FULLY READ | `packages/contracts/src/experience/index.ts` | Experience contract barrel / export authority |
| FULLY READ | `packages/contracts/src/experience/meaning.ts` | Existing high-level meaning contract; broader Experience-owned pending consumer audit |
| FULLY READ | `scripts/verify-author-wiring.mjs` | Current canonical Author dependency/ownership guard |
| FULLY READ | `scripts/verify-contract-ownership.mjs` | Contract ownership guard |

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
| PARTIAL | `apps/api/src/services/authorLatentMovieSearch.ts` | Canonical search structures inspected; full-file certification still pending |
| PARTIAL | `apps/api/src/services/localModelRuntime.ts` | Transport boundary verified; full-file certification still pending |
| PARTIAL | `apps/api/src/services/authorLatentMovieConvergence.ts` | Requires consumer trace before canonical/legacy classification |
| PARTIAL | `apps/api/src/services/authorLatentStoryThesis.ts` | Requires consumer trace before canonical/legacy classification |
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
