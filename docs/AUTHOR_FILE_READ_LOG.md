# QRE AUTHOR FILE READ LOG

**Purpose:** Make repository inspection explicit. A file is labeled **FULLY READ** only after its complete current contents were inspected. Tree listing, search hits, snippets, or partial fetches do not qualify.

## Fully read

| Status | File | Scope / reason |
|---|---|---|
| FULLY READ | `docs/AUTHOR_ARCHITECTURE_INDEX.md` | Canonical Author ownership and pipeline |
| FULLY READ | `docs/AUTHOR_CURRENT_STATE.md` | Current-state Author contract and development law |
| FULLY READ | `docs/AUTHOR_WIRING_MAP.md` | Canonical stage ownership and acceptance invariants |
| FULLY READ | `docs/AUTHOR_LATENT_MOVIE_SEARCH.md` | Reality → movie candidate architecture and next-step trajectory mandate |
| FULLY READ | `apps/api/src/services/authorRealityGraph.ts` | Reality/evidence/event/relation construction |
| FULLY READ | `apps/api/src/services/authorMovieDifferentiation.ts` | Material movie diversity gate |
| FULLY READ | `packages/contracts/src/experience/latentMovie.ts` | Latent movie / trajectory contracts |
| FULLY READ | `packages/contracts/src/experience/authorBrain.ts` | Master Author input contract |
| FULLY READ | `apps/api/src/services/authorTrajectorySearch.ts` | New deterministic trajectory-level search layer |
| FULLY READ | `apps/api/author-trajectory-search-acceptance.ts` | New trajectory acceptance harness |

## Read but NOT full-file certified yet

| Status | File | Reason |
|---|---|---|
| PARTIAL | `apps/api/src/services/authorBrainUniversal.ts` | Large production file; imports and current canonical pre-Mouth path inspected, but not every line certified yet |
| PARTIAL | `apps/api/src/services/authorLatentMovieSearch.ts` | Canonical search header and core search structures inspected; complete-file certification pending |
| PARTIAL | `apps/api/src/services/localModelRuntime.ts` | Identified as model transport boundary; complete-file certification pending |

## Historical / comparative read

| Status | File | Reason |
|---|---|---|
| FULLY READ (COMPARATIVE BRANCH) | `apps/api/src/services/authorMouthCraft.ts` on `author/enterprise-mouth-rewire` | Used as evidence for the newer evidence-first Mouth contract; **not** treated as automatically canonical for `author/enterprise-realization-engine` |

## Repository-level conclusions already verified

```text
ONE REALITY MODEL
ONE LATENT MOVIE SEARCH
ONE MASTER AUTHOR
ONE CANONICAL BEAT GRAPH
ONE MOUTH PATH
ONE ATTENTION EDITOR
ONE TRUTH / CUT GATE
ONE ACCEPTANCE PATH
```

The current repository tree also contains many historical/adapter/test/script files. Their existence does not make them semantic authorities.

## Audit rule going forward

No file is called canonical merely because its name says `author`, `mouth`, `brain`, `enterprise`, `monster`, `v2`, or `v3`.

A file becomes canonical only when its owner, inputs, outputs, and downstream consumer are verified against the current wiring.
