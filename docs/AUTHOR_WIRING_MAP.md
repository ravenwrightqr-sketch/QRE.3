# QRE AUTHOR WIRING MAP

**Status:** CANONICAL CURRENT WIRING
**Branch:** `author/enterprise-mouth-rewire`
**Primary reference:** `docs/AUTHOR_CURRENT_STATE.md`

```text
SOURCE TRUTH
  → RealityGraph
  → Cognition / Character Read
  → Latent Movie Search / Differentiation
  → Beat Discovery
  → Canonical Beat Graph
  → Viewer Momentum / Magnet
  → Mouth
  → Attention Editor
  → Truth / Cut Policy
  → Bounded Repair
  → Final Scenes
  → Cinematic Runtime
```

## Canonical owners

| Responsibility | Owner |
|---|---|
| Reality graph | `apps/api/src/services/authorRealityGraph.ts` |
| Cognition | `apps/api/src/services/authorCognition.ts` |
| Latent movie search | `apps/api/src/services/authorLatentMovieSearch.ts` |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` |
| Master Author | `apps/api/src/services/authorBrainUniversal.ts` |
| Beat recovery | `apps/api/src/services/authorBeatPlanRecovery.ts` |
| Latent beat adaptation | `apps/api/src/services/authorLatentMovieBeatAdapter.ts` |
| Mouth realization | `apps/api/src/services/localModelRuntime.ts` + canonical author mouth craft |
| Attention editor | `apps/api/src/services/authorAttentionEditor.ts` |
| Truth gate | `apps/api/src/services/authorBeatTruthGate.ts` |
| Cut policy | `apps/api/src/services/authorCutPolicy.ts` |
| Model transport | `apps/api/src/services/localModelRuntime.ts` |
| Acceptance | Monster + author acceptance suite |

## Beat Graph

A beat is one perceivable change in the viewer's mental model.

```text
role
change
next
frontier
necessity
attentionFunction
setsUp
paysOff
creativeMove
nextBeatPullTarget
source/event IDs
```

Metadata is private. It must never leak into viewer prose.

## Truth boundary

Creative interpretation may change framing, attitude, implication, metaphor, status, and meaning. It may not create unsupported concrete reality in reality-locked mode.

## Acceptance invariants

```text
one Master Author
one Beat Graph shape
one Magnet representation
one mouth path
one Attention Editor
one truth/cut gate
no planning prose
no unsupported concrete invention
no silent partial success
no bypass recovery author
```

Builds prove compilation. Monster/acceptance runs prove semantic integrity.
