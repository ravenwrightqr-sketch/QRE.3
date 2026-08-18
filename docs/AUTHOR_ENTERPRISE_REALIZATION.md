# QRE ENTERPRISE REALIZATION ENGINE

This document defines the current target architecture for the Universal Author realization layer.

## Semantic ownership

```text
REALITY
  RealityGraph / RealityEnvelope
      ↓
MEANING
  MeaningSpine
      ↓
MOVIE
  LatentMovieCandidate
      ↓
BEATS
  Beat Graph / realization slots
      ↓
CANDIDATES
  Model-proposed language variants
      ↓
CRITIC
  grounding + relation coverage + language + invention
      ↓
SEQUENCE
  beam search / cumulative meaning
      ↓
EDITOR
  targeted repair objectives
      ↓
MOUTH
  final viewer-facing language
```

The model is a proposal engine. QRE owns reality, meaning, evaluation, and sequence selection.

## Meaning Spine

`authorMeaningSpine.ts` converts approved beat metadata plus RealityEnvelope evidence into deterministic realization obligations.

Each spine beat contains:

- source event IDs and labels
- target event IDs and labels
- graph relation kinds
- strongest relation strength
- inherited evidence
- realization obligations

The spine must remain domain-neutral.

## Execution modes

`authorEnterpriseMouthPolicy.ts` defines four explicit budgets.

### dev-fast

```text
max model calls: 2
primary: 1
batched recovery: 1
revision: 0
variants/beat: 3
```

Used for rapid local iteration.

### model

```text
max model calls: 1
primary: 1
recovery: 0
revision: 0
```

Used to probe model behavior independently of repair loops.

### full

```text
max model calls: 3 nominal
primary: 1
recovery: 1
revision: 1
```

Used for production-style author acceptance.

### no-model

```text
max model calls: 0
```

Used for deterministic scoring, beam, language-gate, and regression testing.

## Enterprise invariants

The mouth must never:

- expand the approved beat count
- invent source events
- invent concrete people, objects, places, actions, reactions, or outcomes
- treat analytic language as realization
- treat keyword assembly as realization
- replace a supplied endpoint with an invented payoff
- pass a sequence solely because the JSON contract parsed

A multi-signal beat must execute the supported graph relationship, not merely mention its endpoints.

## Cross-domain acceptance

`authorEnterpriseMouthAcceptanceMatrix.ts` provides structural fixtures for service, wedding, restaurant, real-estate, horror-memory, and romantic-memory cases.

The fixtures intentionally test authoring invariants rather than industry-specific templates.

## Development rule

When debugging architecture, use `dev-fast` or `no-model` first. Use `model` to probe generation quality. Use `full` only when validating the complete repair path.
