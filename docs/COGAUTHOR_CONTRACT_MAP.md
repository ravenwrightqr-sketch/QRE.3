# QRE COGAUTHOR Contract Map

## Status

Canonical. Current as of the `author/enterprise-realization-engine` branch.

## Purpose

`COGAUTHOR` is the dedicated contract namespace for the universal cognition / authoring / latent-movie / Mouth semantic pipeline.

It is intentionally separate from the broader `experience/` contracts.

## Public API

All consumers import from:

```ts
@qre/contracts
```

The public package barrel exposes:

```text
packages/contracts/src/index.ts
    ↓
packages/contracts/src/cogauthor/index.ts
```

## Canonical contracts

| File | Owns | Status |
| --- | --- | --- |
| `cogauthor/authorBrain.ts` | Master Author truth + scene contracts | canonical |
| `cogauthor/cognition.ts` | cognitive claims, hypotheses, plans, directives, mind state | canonical |
| `cogauthor/latentMovie.ts` | latent movie hypotheses and trajectory steps | canonical |
| `cogauthor/realityGraph.ts` | immutable source reality graph + provenance + relations | canonical |
| `cogauthor/mouth.ts` | Mouth candidate, beat, pool, beam, and repair contracts | canonical |

## Deliberately not moved yet

These remain under `experience/` until consumer analysis proves they are exclusively COGAUTHOR-owned:

- `authoring.ts`
- `meaning.ts`
- `subjectTruth.ts`
- `premise.ts`
- `entityExtractor.ts`
- broader Experience Blueprint / Beat / Runtime contracts

A filename containing `author` is not sufficient evidence for relocation.

## Ownership law

```text
one semantic concept
→ one canonical contract
→ one public barrel
→ consumers import from @qre/contracts
→ no service-local semantic copies
```

## Production pipeline

```text
RealityGraph
  ↓
Cognition
  ↓
Latent Movie
  ↓
Master Author
  ↓
Meaning / Realization
  ↓
Mouth
  ↓
Attention / Truth / Cut
  ↓
Sequence
```

## Anti-drift rule

Do not create `v2`, `v3`, `final`, `fixed`, or service-local copies of these semantic contracts. Change the canonical contract deliberately, migrate all consumers, test the boundary, and remove superseded definitions.
