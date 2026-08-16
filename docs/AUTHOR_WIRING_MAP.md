# QRE AUTHOR WIRING MAP

Status: CANONICAL WIRING TRACKER
Branch: `elite-universal-rebuild-v10`

## Required production path

```text
experience input
  → source truth
  → RealityGraph
  → cognition
  → latent-movie candidates
  → Magnet / trajectory selection
  → SequencePlay
  → one-beat mouth realization
  → canonical cut policy
  → experience runtime
```

## Canonical owners

| Responsibility | Canonical owner | Required relationship |
|---|---|---|
| Master author | `apps/api/src/services/authorBrainUniversal.ts` | one production author |
| Reality graph compiler | `apps/api/src/services/authorRealityGraph.ts` | deterministic truth-to-graph adapter |
| Author cognition | `apps/api/src/services/authorCognition.ts` | consumes graph-derived relationships |
| Sequence semantics | `packages/contracts/src/sequencePlay.ts` | source of SequencePlay / SequenceCut |
| Magnet semantics | `packages/contracts/src/viewerMomentum.ts` | one MagnetCircle owner |
| Cut acceptance | `apps/api/src/services/authorCutPolicy.ts` | one semantic cut evaluator |
| Mouth runtime | `apps/api/src/services/localModelRuntime.ts` | one beat → one short realization |
| Acceptance | `apps/api/author-acceptance-suite.ts` | exact Master Author path |

## Truth boundary

`RealityGraph` may represent relationships, recurrence, contradiction, chronology, provenance, and sensory signals. It may not rewrite source truth.

Creative lenses may change framing and interpretation. They may not silently create concrete facts in reality-locked mode.

Explicit fictional/world-creation requests are a separate author mode and must be marked as such.

## Sequence invariant

A beat is a **sentence cut / moving message**: one perceivable moment appears briefly, then the player advances.

Default text is short. Media is an independent sequence element.

Target rhythm:

```text
jolt → jolt → jolt → payoff
```

## Acceptance invariants

The live Author path must prove:

```text
one Master Author
one RealityGraph representation
one cognition plan
one SequencePlay representation
one MagnetCircle representation
one cut policy
one mouth
same truth → different lens → different experience

no invented concrete fact in reality-locked mode
no planning vocabulary in viewer text
no paragraph-like text cuts
no silent fallback author
```

## Wiring status

- RealityGraph contract: GREEN
- RealityGraph public export: GREEN
- deterministic graph compiler: GREEN
- AuthorBrainTruth graph field: GREEN
- Master Author direct graph consumption: PENDING
- Cognition direct graph consumption: PENDING
- Beat provenance enforced from graph: PENDING
- same-reality multi-lens acceptance: PRESENT
- enterprise wiring guard: PENDING

This document exists so a green build cannot be mistaken for a green intelligence path.
