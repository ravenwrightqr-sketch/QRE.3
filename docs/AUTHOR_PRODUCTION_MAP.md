# QRE AUTHOR · CANONICAL PRODUCTION MAP

> This document is the repository-level source of truth for Author/COGAUTHOR ownership, production authority, and diagnostic boundaries.

## Canonical Production Path

```text
SOURCE / PROMPT
      ↓
MASTER AUTHOR · authorBrainUniversal.ts
      ↓
REALITY GRAPH · authorRealityGraph.ts
      ↓
COGNITION · authorCognition.ts
      ↓
LATENT MOVIE SEARCH · authorLatentMovieSearch.ts
      ↓
MOVIE DIFFERENTIATION · authorMovieDifferentiation.ts
      ↓
MEANING SPINE · authorMeaningSpine.ts
      ↓
REALIZATION SLOTS · authorMouthRealizationSlot.ts
      ↓
MOUTH CANDIDATES · authorMouthCandidateSearch.ts
      ↓
LANGUAGE / TRUTH GATES
      ↓
SEQUENCE BEAM · authorMouthSequenceBeamSearch.ts
      ↓
ATTENTION EDITOR · authorAttentionEditor.ts
      ↓
CUT POLICY · authorCutPolicy.ts
      ↓
FINAL SCENES / EXACT PAYOFF
```

## Production Authority

### `apps/api/src/services/authorBrainUniversal.ts`

**Status:** CANONICAL PRODUCTION ORCHESTRATOR

**Owns:** end-to-end Author orchestration.

**Does not own:** a competing reality model, a second Mouth, or alternate production authority.

### `apps/api/src/services/authorRealityGraph.ts`

**Status:** CANONICAL

**Owns:** immutable evidence graph construction, provenance, relations, tensions.

### `apps/api/src/services/authorCognition.ts`

**Status:** CANONICAL

**Owns:** cognitive interpretation over the RealityGraph and delegation into latent-movie discovery.

### `apps/api/src/services/authorLatentMovieSearch.ts`

**Status:** CANONICAL

**Owns:** hypothesis generation and material movie differentiation input.

**Invariant:** latent movies are hypotheses, never source truth.

### `apps/api/src/services/authorMovieDifferentiation.ts`

**Status:** CANONICAL

**Owns:** material difference between competing movie interpretations.

### `apps/api/src/services/authorMeaningSpine.ts`

**Status:** CANONICAL

**Owns:** approved semantic trajectory / meaning obligations.

### `apps/api/src/services/authorMouthRealizationSlot.ts`

**Status:** CANONICAL

**Owns:** conversion of approved meaning beats into bounded realization slots.

### `apps/api/src/services/authorMouthCandidateSearch.ts`

**Status:** CANONICAL MOUTH OWNER

**Owns:** language realization, candidate normalization, truth-boundary filtering, semantic candidate scoring.

**Does not own:** reality, movie selection, meaning selection, endpoint choice, or sequence planning.

### `apps/api/src/services/authorMouthLanguageGate.ts`

**Status:** CANONICAL SUPPORT

**Owns:** language legality / forbidden realization checks.

### `apps/api/src/services/authorMouthQualityAdapter.ts`

**Status:** CANONICAL SUPPORT

**Owns:** quality aggregation without laundering invention risk.

### `apps/api/src/services/authorMouthSequenceBeamSearch.ts`

**Status:** CANONICAL

**Owns:** whole-sequence selection. It chooses sequences, not meanings.

### `apps/api/src/services/authorAttentionEditor.ts`

**Status:** CANONICAL

**Owns:** sequence-level attention audit and rewrite feedback.

### `apps/api/src/services/authorBeatTruthGate.ts`

**Status:** CANONICAL

**Owns:** beat-level truth enforcement.

### `apps/api/src/services/authorCutPolicy.ts`

**Status:** CANONICAL

**Owns:** final cut legality / grounding floor.

### `apps/api/src/services/localModelRuntime.ts`

**Status:** CANONICAL SUPPORT / TRANSPORT ONLY

**Owns:** local model transport and bounded model execution.

**Does not own:** Author cognition, Mouth semantics, candidate scoring, or sequence selection.

## Shared Contracts

Canonical Author semantic contracts live under:

```text
packages/contracts/src/cogauthor/
```

including:

```text
authorBrain.ts
cognition.ts
latentMovie.ts
realityGraph.ts
mouth.ts
index.ts
```

All shared semantic types must originate from `@qre/contracts`. Services must not redefine core semantic contracts locally.

## Diagnostic / Non-Production Boundary

### `apps/api/src/services/authorEnterpriseMouth.ts`

**Status:** DIAGNOSTIC ONLY

This is not a second production Author. `authorBrainUniversal.ts` must not import it.

It may be retained while canonical acceptance coverage is being migrated. Once the canonical acceptance harness replaces all necessary coverage, retire it.

### `apps/api/author-enterprise-mouth-acceptance.ts`

**Status:** TRANSITIONAL DIAGNOSTIC

This test must not be treated as proof of production readiness while it directly invokes the Enterprise Mouth path.

The canonical acceptance target is:

```text
authorBrainUniversal()
```

and must exercise the complete production pipeline.

## Non-Negotiable Architectural Rules

1. One production Author.
2. One canonical Mouth.
3. One shared COGAUTHOR contract owner per semantic symbol.
4. Model output is language, never source truth.
5. Creative lenses change framing, not reality.
6. Beam selects sequences, not meaning.
7. Endpoint is supplied/approved upstream and remains exact when required.
8. Fallback is an emergency safety rail, not the preferred creative path.
9. Data mode bypasses creative movie search when explicitly requested.
10. Legacy/diagnostic files are labeled and must not silently become production authority.

## File Header Standard

Every canonical Author/COGAUTHOR file should begin with:

- `FILE`
- `ROLE`
- `STATUS`
- `OWNER`
- `INPUTS`
- `OUTPUTS`
- `OWNS`
- `DOES NOT OWN`
- `DOWNSTREAM`
- `CONTRACT SOURCE`

Every diagnostic or transitional file must explicitly say `STATUS: DIAGNOSTIC` or `STATUS: TRANSITIONAL`.

## Completion Standard

The Author is not considered production-complete because a unit test is green.

Production completion requires:

```text
contracts green
+ wiring green
+ canonical end-to-end acceptance green
+ truth tests green
+ attention tests green
+ endpoint tests green
+ cross-industry tests green
+ diagnostic paths retired or explicitly isolated
```
