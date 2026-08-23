# QRE ARCHITECTURE INDEX — CANONICAL

## Purpose

Start here before changing QRE. This is the fast architectural map: **what, where, why, inputs, outputs, ownership, non-ownership, and proof**.

## Ownership

| Layer | Owns | Does not own |
|---|---|---|
| `@qre/contracts` | Shared shapes and canonical analytics event names | Runtime decisions or persistence |
| **The State** | Domain-neutral identity, active experience context, and the collection of experiences attached to one canonical asset | Creative wording, analytics persistence, feature-specific business engines |
| Engine cognition | Reality typing, world/context cognition | Database persistence |
| `IdentityState` | Accumulated identity/world state | Creative wording |
| `CognitiveAuthorContext` | One structured author packet, including creative-safety classification | Persistence or timeline decisions |
| Universal Author / Super Cog | Meaning selection, movie trajectory, creative competition | New factual reality |
| Mouth | Grounded wording and realization | Timeline ownership or reality authority |
| Provenance Gate | Reality enforcement | Creative preference |
| `MovieBeatPlan` | One playable timeline + media order | Authoring persistence |
| `ExperienceService` | Orchestration + runtime scene conversion | Competing author/timeline logic |
| `MemoryRepository` | Durable identity-scoped truth | Behavioral preference inference |
| `AnalyticsRepository` | Durable observed behavior/outcomes | Durable factual reality |
| `CreativeLearning` | Accepted/rejected creative signals + autonomous patterns | Factual truth |
| Media bridge | Storage representation → `CognitiveAuthorMedia` | Media storage ownership |
| Creative safety classifier | Semantic protected-context classification | Rendering, memory, or lens ownership |

## Canonical loop

```text
input
→ reality typing / provenance
→ Memory + Geo + Presence + Analytics + Media + Domain Cognition
→ IdentityState
→ The State / experience continuity
→ CognitiveAuthorContext + Creative Safety
→ Super Cog / Universal Author
→ Mouth
→ Provenance Gate
→ MovieBeatPlan
→ ExperienceService
→ Player
→ outcome / new input
→ AuthorLearningLoop + behavioral learning
→ stronger IdentityState / The State
→ better next experience
```

## Universal identity / experience rule

QRE does not create a new engine for every industry, object, animal, workflow, or UI mode.

The universal architectural primitive is **The State**:

```text
THE STATE
   ↓
identity + experiences
   ↓
multiple experiences
   ↓
shared runtime history / memory / outcomes
   ↓
learning
   ↓
future adaptation
```

The UI may expose experiences as buttons, modes, or workflows. The underlying engine remains universal.

Examples:

```text
ANIMAL
→ social
→ lost mode
→ care
→ vacations
→ trips
→ memories
→ rewards
```

```text
SURFBOARD
→ trips
→ beaches
→ sessions
→ repairs
→ photos
→ owners
→ memories
```

These are not separate engines. They are different experience sets attached to different states.

The same pattern applies to properties, vehicles, businesses, physical QR Art, equipment, and other identity-bearing assets.

## File map

### The State

- `packages/contracts/src/theState.ts` — canonical domain-neutral `TheState` contract.
- `packages/contracts/src/experience/runtime.ts` — canonical `Experience` response now carries `state: TheState | null`.
- `packages/engine/src/theState.ts` — pure asset → `TheState` projection.
- `packages/engine/src/scanEngine.ts` — projects `TheState` as part of every successful scan response.
- `docs/THE_STATE_ARCHITECTURE.md` — detailed universal identity/experience rule and future expansion constraints.

### Identity / context

- `apps/api/src/services/authorIdentityState.ts` — composes memory, analytics, presence, creative learning, domain state, recurrence, and context.
- `apps/api/src/services/authorCognitiveContext.ts` — builds the single author packet and carries creative-safety state.
- `packages/contracts/src/cogauthor/identityState.ts` — IdentityState contract.
- `packages/contracts/src/cogauthor/cognitiveAuthorContext.ts` — author packet contract, including `creativeSafety`.

### Reality / provenance

- `apps/api/src/services/authorRealityProvenance.ts` — typed provenance construction.
- `apps/api/src/services/authorProvenanceSource.ts` — live IdentityState → provenance facts.
- `apps/api/src/services/authorProvenanceGate.ts` — rendered-line reality firewall.
- `packages/contracts/src/cogauthor/realityProvenance.ts` — permissions + forbidden expansions.

### Creative safety / adaptation

- `apps/api/src/services/authorCreativeSafetyContext.ts` — semantic-first protected-context classifier. Consumes structured cognitive plan/premise signals; raw memorial terminology exists only as an emergency backstop.
- `apps/api/src/services/authorCreativeLearningPressure.ts` — bounded learned-lens preference pressure.
- `apps/api/src/services/authorMoviePipeline.ts` — attaches creative safety to the canonical author context and prevents learned/explicit incompatible genre selection for protected contexts.
- `apps/api/src/services/authorBrainUniversal.ts` — converts protected memorial context into a neutral, continuity-first realization before model generation.

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
- `apps/api/author-learning-loop-acceptance.ts` — input → memory + analytics + identity isolation.
- `apps/api/author-knowledge-learning-acceptance.ts` — deterministic Knowledge evidence → learning authority.
- `apps/api/author-outcome-learning-acceptance.ts` — canonical behavioral outcome normalization.
- `apps/api/author-adaptive-learning-acceptance.ts` — learned preference → next selected lens, protected memorial safety, explicit intent, and reality preservation.

### Movie / Mouth

- `apps/api/src/services/authorBrainUniversal.ts` — universal author/Mouth orchestration.
- `apps/api/src/services/authorMovieCognition.ts` — existing fact relationships, trajectory search, and lens competition.
- `apps/api/src/services/authorMoviePipeline.ts` — Author result → canonical `MovieBeatPlan`.
- `apps/api/src/services/authorMovieBeatPlan.ts` — deterministic timeline/media planner.
- `packages/contracts/src/cogauthor/movieBeatPlan.ts` — canonical timeline contract.

### Runtime / analytics

- `packages/engine/src/scanEngine.ts` — runtime entry; emits real scan/session/outcome analytics and exposes The State alongside the active experience.
- `packages/engine/src/theState.ts` — pure identity/experience projection; not a domain-specific runtime.
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
protected memorial realization rail
universal author regression suite
The State contract + scan projection
```

### IN PROGRESS

```text
semantic safety classification wired into the direct author pipeline
full compileExperience → cognitive-plan → creativeSafety production seam
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
→ Creative Safety
→ existing authorMovieCognition
→ Mouth
```

Current consumer behavior is intentionally conservative:

- learned evidence can supply a preferred lens when the authoring request is neutral/default;
- explicit non-neutral lens intent outranks learned preference in ordinary contexts;
- rejected/avoided lenses cannot become learned winners;
- creative learning cannot alter the reality/provenance packet;
- protected memorial/tribute contexts force a continuity-first neutral realization and cannot become spy/heist/horror/deadpan/etc.;
- semantic safety is based on structured cognitive plan/premise signals when available;
- raw memorial terminology is only an emergency backstop and is not the long-term classifier authority;
- the current learned preference is bounded and not yet candidate-by-candidate hypothesis re-ranking.

**Next hardening step:** wire `compiled.cognition.plan`/premise into `CognitiveAuthorContext.creativeSafety` inside the live `compileExperience()` seam, then move learned pressure into existing `authorMovieCognition` hypothesis scoring.

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
author:adaptive-learning    learned preference + protected memorial safety

author:movie-beat-plan      timeline/media selection
author:movie-pipeline       Mouth → MovieBeatPlan
author:full-circle          author → timeline → runtime shape
```

## Definition of full circle

```text
USER INPUT
→ Reality / Provenance
→ Memory + Geo + Presence + Analytics + Media
→ IdentityState / The State
→ CognitiveAuthorContext + Creative Safety
→ Super Cog
→ Mouth
→ Provenance Gate
→ MovieBeatPlan
→ ExperienceService
→ Player
→ Outcome / New Input
→ Universal Learning Loop
→ stronger IdentityState / The State
→ materially changed next experience
```
✅ emitted event exists in code/contracts
✅ event exists in Prisma schema
✅ migration exists
✅ migration deployed to live DB
✅ real persistence test passes
