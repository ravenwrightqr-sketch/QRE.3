# QRE ARCHITECTURE INDEX — CANONICAL

## Purpose

Start here before changing QRE. This is the fast architectural map: **what, where, why, inputs, outputs, ownership, non-ownership, and proof**.

## Ownership

| Layer | Owns | Does not own |
|---|---|---|
| `@qre/contracts` | Shared shapes and canonical analytics event names | Runtime decisions or persistence |
| Engine cognition | Reality typing, world/context cognition | Database persistence |
| `IdentityState` | Accumulated identity/world state | Creative wording |
| `CognitiveAuthorContext` | One structured author packet | Persistence or timeline decisions |
| Universal Author / Super Cog | Meaning selection, movie trajectory, creative competition | New factual reality |
| Mouth | Grounded wording | Timeline ownership or reality authority |
| Provenance Gate | Reality enforcement | Creative preference |
| `MovieBeatPlan` | One playable timeline + media order | Authoring persistence |
| `ExperienceService` | Orchestration + runtime scene conversion | Competing author/timeline logic |
| `MemoryRepository` | Durable identity-scoped truth | Behavioral preference inference |
| `AnalyticsRepository` | Durable observed behavior/outcomes | Durable factual reality |
| `CreativeLearning` | Accepted/rejected creative signals + autonomous patterns | Factual truth |
| Media bridge | Storage representation → `CognitiveAuthorMedia` | Media storage ownership |

## Canonical loop

```text
input
→ reality typing / provenance
→ Memory + Geo + Presence + Analytics + Media + Domain Cognition
→ IdentityState
→ CognitiveAuthorContext
→ Super Cog / Universal Author
→ Mouth
→ Provenance Gate
→ MovieBeatPlan
→ ExperienceService
→ Player
→ outcome / new input
→ AuthorLearningLoop + behavioral learning
→ stronger IdentityState
→ better next experience
```

## File map

### Identity / context

- `apps/api/src/services/authorIdentityState.ts` — composes memory, analytics, presence, creative learning, domain state, recurrence, and context.
- `apps/api/src/services/authorCognitiveContext.ts` — builds the single author packet.
- `packages/contracts/src/cogauthor/identityState.ts` — IdentityState contract.
- `packages/contracts/src/cogauthor/cognitiveAuthorContext.ts` — author packet contract.

### Reality / provenance

- `apps/api/src/services/authorRealityProvenance.ts` — typed provenance construction.
- `apps/api/src/services/authorProvenanceSource.ts` — live IdentityState → provenance facts.
- `apps/api/src/services/authorProvenanceGate.ts` — rendered-line reality firewall.
- `packages/contracts/src/cogauthor/realityProvenance.ts` — permissions + forbidden expansions.

### Media

- `apps/api/src/services/authorMediaSource.ts` — existing `Insight(type=KNOWLEDGE)` image source → author media input.
- `apps/api/src/services/authorMediaBridge.ts` — normalization, role/source/time preservation, provenance, chronology.
- `apps/api/src/services/experienceService.ts` — live media insertion into `CognitiveAuthorContext.media`.
- `apps/api/author-media-context-acceptance.ts` — unit bridge proof.
- `apps/api/author-live-media-bridge-acceptance.ts` — live compile seam proof.

### Learning / adaptation

- `apps/api/src/services/authorLearningLoop.ts` — **single accepted-input learning authority**. Handles cognitive world evidence and deterministic explicit evidence.
- `apps/api/src/services/memoryProjection.ts` — world → MemoryWriteBatch.
- `apps/api/src/services/authorOutcomeLearning.ts` — canonical analytics event → `AnalyticsOutcomeKind` classification.
- `apps/api/src/services/autonomousLearning.ts` — behavioral winners/weaknesses from existing analytics outcomes.
- `apps/api/src/services/creativeLearning.ts` — explicit + autonomous creative learning context.
- `apps/api/src/services/authorCreativeLearningPressure.ts` — converts existing learning context into bounded learned-lens preference pressure.
- `apps/api/src/services/authorMoviePipeline.ts` — applies learned lens preference only when the incoming lens is neutral/default; explicit non-neutral lens intent remains authoritative.
- `apps/api/author-learning-loop-acceptance.ts` — input → memory + analytics + identity isolation.
- `apps/api/author-knowledge-learning-acceptance.ts` — deterministic Knowledge evidence → learning authority.
- `apps/api/author-outcome-learning-acceptance.ts` — canonical behavioral outcome normalization.
- `apps/api/author-adaptive-learning-acceptance.ts` — learned preference → next selected lens; explicit intent and reality remain authoritative.

### Movie / Mouth

- `apps/api/src/services/authorBrainUniversal.ts` — universal author/Mouth orchestration.
- `apps/api/src/services/authorMovieCognition.ts` — existing fact relationships, trajectory search, and lens competition.
- `apps/api/src/services/authorMoviePipeline.ts` — Author result → canonical `MovieBeatPlan`.
- `apps/api/src/services/authorMovieBeatPlan.ts` — deterministic timeline/media planner.
- `packages/contracts/src/cogauthor/movieBeatPlan.ts` — canonical timeline contract.

### Runtime / analytics

- `packages/engine/src/scanEngine.ts` — runtime entry; emits real scan/session/outcome analytics.
- `packages/engine/src/analytics/trackEvent.ts` — analytics event boundary.
- `apps/api/src/repositories/analyticsRepository.ts` — durable analytics persistence.
- `apps/api/src/routes/learning.ts` — operator-facing learning/reporting surface.

## Current status

### GREEN

```text
contracts / engine / api builds
live media ingestion
live provenance context
known memory-route learning bypass
Knowledge deterministic learning
canonical outcome taxonomy
adaptive learned-lens consumer
universal author regression suite
```

### IN PROGRESS

```text
all user/guest/staff reality-input route audit
real runtime outcome → IdentityState → next-experience proof
true candidate-level learned-pressure competition
operator reporting
```

### DELIBERATELY AFTER THE BRIDGES

```text
Mouth / lens hardening
beam / diversity competition hardening
lens-catalog consolidation
```

## Adaptive learning rules

```text
runtime outcome
→ canonical AnalyticsEventTypes
→ normalizeExperienceOutcome()
→ autonomousLearning
→ IdentityState.creativeLearning
→ CognitiveAuthorContext.creativeLearning
→ bounded learned-lens preference
→ existing authorMovieCognition
→ Mouth
```

Current consumer behavior is intentionally conservative:

- learned evidence can supply a preferred lens when the authoring request is neutral/default;
- explicit non-neutral lens intent outranks learned preference;
- rejected/avoided lenses cannot become learned winners;
- creative learning cannot alter the reality/provenance packet;
- the current preference is a bounded injection into the existing lens choice, not yet candidate-by-candidate hypothesis re-ranking.

**Next hardening step:** move learned pressure into the existing `authorMovieCognition` hypothesis scoring itself, without adding another lens engine.

## Known architecture cleanup target

There are overlapping lens catalogs in:

- `apps/api/src/services/authorMovieCognition.ts`
- `apps/api/src/services/authorCreativeLenses.ts`

Do **not** add another catalog. Consolidate these during the dedicated Mouth/lens phase after adaptive learning is fully acceptance-covered.

## Acceptance map

```text
author:fast                 universal author regression
author:media-context        media normalization
author:live-media-bridge    live media → context
author:provenance           provenance construction
author:provenance-gate      reality firewall
author:live-provenance      live provenance → author
author:learning-loop        accepted input → memory + analytics + isolation
author:knowledge-learning   explicit Knowledge → learning authority
author:outcome-learning     canonical outcome normalization
author:adaptive-learning    learned preference → next lens selection
author:movie-beat-plan      timeline/media selection
author:movie-pipeline       Mouth → MovieBeatPlan
author:full-circle          author → timeline → runtime shape
```

## Definition of full circle

```text
USER INPUT
→ Reality / Provenance
→ Memory + Geo + Presence + Analytics + Media
→ IdentityState
→ CognitiveAuthorContext
→ Super Cog
→ Mouth
→ Provenance Gate
→ MovieBeatPlan
→ ExperienceService
→ Player
→ Outcome / New Input
→ Universal Learning Loop
→ stronger IdentityState
→ materially changed next experience
```
