# QRE MOUTH PRODUCTION CONSOLIDATION PLAN

**STATUS:** ACTIVE IMPLEMENTATION PLAN
**BRANCH:** `audit/mouth-production-sync`
**DATE:** 2026-08-19

## Objective

Remove duplicate model-generation ownership and establish one canonical Mouth generation boundary.

## Target production path

```text
RealityGraph
  ↓
Cognition / Latent Movie
  ↓
Master Author
  ↓
Meaning Spine
  ↓
Realization Slots
  ↓
Realization Strategy Lattice
  ↓
CANONICAL MOUTH GENERATION OWNER
  ↓
Candidate Pools
  ↓
Language / Reality Gates
  ↓
Sequence Beam
  ↓
Attention Editor
  ↓
Truth / Cut Policy
  ↓
Final Scenes
```

## Ownership laws

- `authorBrainUniversal.ts` owns orchestration only.
- `authorMouthCandidateSearch.ts` owns Mouth model generation, parsing, bounded repair, candidate normalization, and semantic candidate scoring.
- `authorRealizationStrategyLattice.ts` owns realization-strategy derivation/selection.
- `authorMouthQualityAdapter.ts` owns downstream quality adaptation and gate-aware score adjustment.
- `authorMouthSequenceBeamSearch.ts` owns sequence selection.
- No second service may issue Mouth-generation model calls.
- No strategy subsystem may become a second author.
- No acceptance harness may define production authority.

## Implementation phases

### Phase 1 — Inventory and freeze

- Record all known Mouth/Enterprise/strategy files.
- Mark canonical, support, acceptance, historical, legacy, or promotion-target status.
- Do not delete anything before consumer proof.

### Phase 2 — Consolidate generation ownership

- Make `authorMouthCandidateSearch.ts` the only Mouth model-generation owner.
- Preserve its bounded per-beat repair and concurrency behavior.
- Remove duplicate generation/parse/repair logic from `authorBrainUniversal.ts`.
- Keep Brain responsible for passing approved inputs into Mouth and orchestrating downstream stages.

### Phase 3 — Wire Approach-B strategy selection

- Feed each canonical `MouthCandidateBeat` through `authorRealizationStrategyLattice.ts`.
- Carry selected strategy candidates as realization instructions into generation.
- Keep strategy selection deterministic and domain-neutral.
- Do not let strategy selection create facts or rewrite the beat graph.

### Phase 4 — Candidate-pool correctness

- Preserve per-beat pools.
- Preserve bounded repair.
- Preserve exact endpoint behavior.
- Preserve grounding, meaning, transition, relation, novelty, compression, and invention metrics.
- Ensure rejected candidates cannot enter Beam.

### Phase 5 — Production acceptance

Run, in order:

```text
contracts build
→ engine/api typecheck
→ canonical Mouth acceptance
→ Master Author acceptance
→ enterprise/universal acceptance diagnostics
→ final viewer-facing inspection
```

A helper-only test is diagnostic. Production green requires `authorBrainUniversal.ts`.

## File status map

| File / area | Target status | Responsibility |
|---|---|---|
| `apps/api/src/services/authorBrainUniversal.ts` | CANONICAL ORCHESTRATOR | Master Author orchestration; no direct Mouth generation ownership |
| `apps/api/src/services/authorMouthCandidateSearch.ts` | CANONICAL MOUTH OWNER | Model generation, parsing, bounded repair, candidate normalization/scoring |
| `apps/api/src/services/authorRealizationStrategyLattice.ts` | CANONICAL STRATEGY OWNER | Strategy derivation and safe selection |
| `apps/api/src/services/authorMouthQualityAdapter.ts` | CANONICAL SUPPORT | Gate-aware quality adaptation |
| `apps/api/src/services/authorMouthLanguageGate.ts` | CANONICAL GATE | Language/reality legality |
| `apps/api/src/services/authorMouthAttentionGate.ts` | CANONICAL GATE | Attention-cut behavior |
| `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | CANONICAL BEAM | Sequence selection |
| `apps/api/src/services/authorMouthRepairPlanner.ts` | SUPPORT | Repair objectives |
| `apps/api/src/services/authorMouthGroundedFallback.ts` | SUPPORT / SAFETY RAIL | Last-resort grounded recovery |
| `apps/api/src/services/authorEnterpriseMouth.ts` | ACCEPTANCE / MIGRATION SOURCE | Useful capability source only; not production orchestrator |
| `apps/api/src/services/authorEnterpriseIntelligence.ts` | SUPPORT / MIGRATION SOURCE | Strategy/evidence capability source only |
| `apps/api/src/services/authorCumulativeMeaning.ts` | SUPPORT / MIGRATION CANDIDATE | Cumulative meaning support |
| `apps/api/src/services/authorTrajectorySearch.ts` | EXPERIMENTAL | Not production-wired until endpoint/consumer verified |
| `apps/api/src/services/authorMouthMonster.ts` | AUDIT / DIAGNOSTIC | Must never become a second production author |
| `apps/api/author-enterprise-mouth-acceptance.ts` | ACCEPTANCE | Domain-neutral diagnostic harness |
| `packages/contracts/src/cogauthor/mouth.ts` | CANONICAL CONTRACT | Shared Mouth semantics |
| `packages/contracts/src/authoringIntelligence.ts` | CANONICAL CONTRACT SUPPORT | Realization strategy/evidence contracts |
| `docs/AUTHOR_FILE_REGISTRY.md` | CANONICAL DOC | File classification registry |
| `docs/AUTHOR_FILE_READ_LOG.md` | CANONICAL DOC | Read/certification history |
| `docs/AUTHOR_WIRING_MAP.md` | CANONICAL DOC | Current production dependency path |

## Completion criteria

The consolidation is complete only when:

1. `authorBrainUniversal.ts` has no direct Mouth model-generation loop.
2. `authorMouthCandidateSearch.ts` is the sole Mouth model-generation owner.
3. Strategy selection feeds canonical Mouth generation.
4. Candidate pools reach Beam without duplicate generation.
5. Exact endpoint behavior remains hard-constrained.
6. Canonical Master Author acceptance is green.
7. Documentation and file-read logs identify the final ownership map.
8. Duplicate orchestration is either removed or explicitly retained as non-production diagnostic code.
