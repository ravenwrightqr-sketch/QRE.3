# QRE ENTERPRISE REALIZATION ENGINE

This document defines the enterprise Universal Author realization layer.

## Canonical ownership

```text
REALITY
  RealityGraph / RealityEnvelope
      ↓
CHARACTER + LENS
  private authoring interpretation
      ↓
MEANING
  MeaningSpine
      ↓
MOVIE
  multi-movie competition / dominance
      ↓
BEATS
  Beat Graph / realization slots
      ↓
STRATEGY
  deterministic realization strategy lattice
      ↓
CANDIDATES
  model-proposed language variants
      ↓
CRITIC
  grounding + relation coverage + language + invention + safety
      ↓
SEQUENCE
  beam search / cumulative meaning
      ↓
EDITOR
  targeted repair objectives
      ↓
CREATIVE CRITIQUE
  obviousness + genericness + grounded surprise
      ↓
MOUTH
  final viewer-facing language
```

The model is a proposal engine. QRE owns reality, meaning, evaluation, budgets, and sequence selection.

## Meaning Spine

`authorMeaningSpine.ts` converts approved beat metadata plus RealityEnvelope evidence into deterministic realization obligations.

Each spine beat contains source and target events, graph relations, relation strength, inherited evidence, and realization obligations. A multi-signal beat must execute its relationship, not merely repeat its endpoints.

## Realization Strategy Lattice

`authorRealizationStrategyLattice.ts` deterministically selects safe strategies from graph structure and beat intent:

- contrast
- status inversion
- understatement
- double meaning
- callback
- implication
- personification
- recontextualization
- compression
- reversal

The language model operates inside this approved strategy space.

## Character + Lens Engine

`authorCharacterLensEngine.ts` builds a domain-neutral private character profile from supplied traits, recurring signals, object relationships, and unresolved tensions. Lens profiles alter framing and realization preference without authorizing new reality.

Supported canonical lenses include comedy, romance, horror, tenderness, nostalgia, chaos, fierce, absurd, dramatic, quiet, and custom.

## Multimodal evidence

`authorMultimodalEvidence.ts` normalizes evidence from text, image-derived observations, documents, timelines, geo signals, memory, and scans into a common evidence contract. Extraction may propose evidence; RealityGraph remains the truth boundary.

## Execution modes

`authorEnterpriseMouthPolicy.ts` defines bounded budgets.

### dev-fast

```text
max model calls: 2
primary: 1
batched recovery: 1
revision: 0
variants/beat: 3
```

### model

```text
max model calls: 1
primary: 1
recovery: 0
revision: 0
```

### full

```text
max model calls: 3 nominal
primary: 1
recovery: 1
revision: 1
```

### no-model

```text
max model calls: 0
```

Used for deterministic scoring, beam, language gates, and regression testing.

## Adaptive model routing

`authorModelRouter.ts` estimates semantic complexity from event density, relations, tensions, contradictions, and modalities, then selects a bounded model tier and search budget.

Easy cases remain cheap. Dense contradiction or multimodal cases can earn deeper search.

## Cumulative meaning + memory

`authorCumulativeMeaning.ts` evaluates inherited evidence and transition continuity across beats.

`authorMemoryIntelligence.ts` detects recurring signals and cross-memory callbacks so repeated details can gain changed meaning rather than become duplicate captions.

`authorEnterpriseRuntime.ts` provides deterministic seeds, versions, audit helpers, style-memory updates, and memory-delta merging. Persistence belongs above these pure helpers in the existing DB truth layer.

## Creative search

`authorMovieCompetition.ts` supports competing movie hypotheses and dominance. `authorCreativeSearch.ts` adds grounded-surprise scoring and creative self-critique.

The engine should not stop merely because a candidate is grammatical. It should keep searching while a materially stronger grounded alternative remains.

## Enterprise safety

`authorEnterpriseSafety.ts` provides a shared hallucination taxonomy:

- unsupported person
- unsupported object
- unsupported action
- unsupported setting
- unsupported emotion
- unsupported reaction
- unsupported chronology
- domain leakage
- literalized metaphor
- analytic language
- keyword collage
- generic filler

Domain knowledge is not evidence. A grooming prompt does not authorize scissors; a wedding prompt does not authorize an altar; a restaurant prompt does not authorize staff or menu details unless supplied.

## Enterprise invariants

The mouth must never:

- expand the approved beat count
- invent source events
- invent concrete people, objects, places, actions, reactions, or outcomes
- treat analytic language as realization
- treat keyword assembly as realization
- replace a supplied endpoint with an invented payoff
- pass a sequence solely because JSON parsed

## Cross-domain acceptance

`authorEnterpriseMouthAcceptanceMatrix.ts` provides structural fixtures for service, wedding, restaurant, real-estate, horror-memory, and romantic-memory cases. The matrix tests invariants, not industry templates.

## Development rule

Use `no-model` to debug architecture, `dev-fast` for fast model probes, `model` to isolate generation quality, and `full` for production-like repair and acceptance.
