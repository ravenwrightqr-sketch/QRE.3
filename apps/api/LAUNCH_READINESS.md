# QRE Launch Readiness / Canonical System Reference

## Product invariant

QRE is **one universal experience-realization system**.

A user can enter information in different ways and request different outcomes:

- make a living dog tag
- make a grooming/service receipt
- turn housekeeping media into a receipt
- make a story
- make a memory
- make a text-message experience
- make a cinematic experience

These are **different intents into the same brain**, not different author systems.

The canonical product loop is:

`input → structured truth → cognition → subject/world state → experience intent → experience plan → universal author → truth/mouth gate → moments/sequence → cinematic/text/media runtime → learning → cognitive state`

## Architecture law: cognition vs mouth

### Cognition owns understanding

Universal cognition is responsible for:

- understanding source input
- resolving entities and subjects
- building/reusing subject understanding
- resolving memory
- modeling world state
- modeling current state/events
- identifying traits, preferences, activities, relationships, and recurring patterns
- distinguishing explicit facts from observations and derived inference
- reconciling conflicts and chronology
- selecting relevant memories/facts for the current request
- determining significance
- choosing an experience trajectory
- applying adaptive/creative learning
- producing the cognitive state consumed by the Author

### The Author owns realization

The Author should receive already-understood reality and determine **how to express it**.

It should not rediscover:

- what the subject is
- what the facts mean
- what memory applies
- what entities exist
- what chronology happened
- what a preference implies

The Author receives the cognitive state, experience intent, and creative constraints, then produces authored beats.

### The mouth owns presentation

The mouth turns approved authored beats into final experience material:

`beat → moment → sequence/cut → cinematic/text/media playback`

Internal cognition, diagnostics, provenance internals, learning signals, blueprints, and raw authoring payloads must never become customer-facing presentation content.

## Semantic representation rule: kill string soup, not language

Raw natural language remains valid at the **input and output edges**.

Inside QRE, meaning should be carried as structured, provenance-bearing semantic state rather than repeated string arrays.

Canonical semantic information includes:

- subject
- typed facts
- relations
- events
- current state
- recurring patterns
- relevant memories
- inference
- uncertainty
- experience intent
- trajectory
- learning
- provenance

The existing structured `MemoryContext`, `IdentityState`, `SubjectTruth`, `RealityGraph`, world model, learning state, and Universal Mind are the semantic substrate. They should converge into one reusable cognitive state rather than creating parallel memories/brains.

## Canonical cognitive state

The cognitive state is the reusable semantic snapshot passed into authoring. It carries the subject/world/request understanding required for experience realization.

Conceptually:

```text
CognitiveState
├── subject
├── facts
├── relations
├── events
├── currentState
├── relevant facts/events
├── inferences
├── recurringPatterns
├── relevantMemories
├── experienceIntent
├── trajectory
├── learning
└── provenance
```

The Author boundary should consume the selected semantic projection from this state, not duplicate every upstream string source.

## Learning rules

QRE must learn/adapt without corrupting reality.

Separate these categories:

### Subject learning

Who/what the subject is and what repeatedly characterizes it.

Examples:

- Coco is a poodle.
- Coco is fierce.
- Coco loves bacon.
- Coco loves dogs.
- Coco repeatedly becomes nervous before grooming.

### World/experience learning

What actually happened and what patterns recur in events.

### User learning

What this user prefers in experiences.

### Creative learning

Which lenses, pacing, endings, or realizations work well.

### Runtime learning

What users engage with, replay, complete, abandon, share, etc.

These learning domains must not be collapsed into one generic memory bucket.

## Truth / inference law

The system may reason broadly but may only assert what is supported.

### Explicit fact

`Coco loves dogs.`

May be used as factual subject knowledge.

### Observation

`Coco repeatedly seeks other dogs.`

May support a derived pattern.

### Inference

`Social interaction appears highly salient to Coco.`

May guide framing/experience selection but is not automatically a hard fact.

### Unsupported inference

`Coco loves dogs → Coco hates humans.`

Forbidden unless the user/source explicitly supplies the human aversion.

### Explicit negative

`Coco doesn't like humans, only dogs.`

Authorized and may be used.

The current subject-provenance acceptance suite locks this invariant.

## Universal example: Coco

Accumulated subject understanding can contain:

```text
Coco
poodle
fierce
friendly
loves bacon
loves other dogs
hates baths
likes night walks
recurring mischievous behavior
prior grooming history
```

A current grooming experience can contain:

```text
came in nervous
→ got a bath
→ stole a blue bow
→ left looking fabulous
```

A dog-tag request and a grooming-receipt request use the **same subject understanding**, but different experience intents.

The output may therefore be different while remaining grounded in the same accumulated knowledge.

## Experience output invariant

The final experience is a sequence, regardless of presentation format:

```text
experience
→ moment 1
→ moment 2
→ moment 3
→ moment 4
→ playback
```

The playback can appear as:

- cinematic scenes
- moving text
- photo/media beats
- mixed media
- a service receipt
- an identity/tag experience
- a conversational sequence

The underlying authoring system remains the same.

## Presentation boundary

The frontend receives presentation data only:

`experience → moments → cinematicScenes → player`

The frontend must not receive/render:

- INTENT
- DOMAIN
- SUBJECT metadata dumps
- GOAL/OUTPUT/TONE internals
- CURRENT FACTS dumps
- KNOWN ASSET FACTS dumps
- cognitive diagnostics
- learning signals
- provenance internals
- blueprints/debug JSON
- raw model output
- rejected author output

The player itself also has a final render guard. Rejected/polluted output must never render.

## Frontend cleanup completed

Legacy customer-facing/debug author surfaces removed from the active route path:

- `ExperienceCreator`
- `ExperienceBuilder`
- obsolete `ExperienceComposer` wiring

The preview path is presentation-only and rejects polluted/stale machine payloads.

## Existing cognition stack to preserve

Do **not** create parallel cognition systems unless a concrete gap is proven.

Existing canonical components include:

- Universal Mind
- Memory Resolver
- World Model / Reality Graph
- Identity State / Subject Truth
- Significance Engine
- Experience Planner
- Experience Critic
- Creative Policy / Composition / Revision
- Mind State / learning systems
- provenance and truth gates

The engineering objective is **convergence and correct wiring**, not another brain.

## No wasted cognition rule

Cognition should be performed once, represented structurally, and reused.

Avoid:

- reparsing the same facts at every layer
- passing the same fact through multiple string arrays
- making the Author rediscover memory/identity semantics
- generating temporary prose to discover what the story means
- using previous generated prose as authoritative reality
- rebuilding the whole subject model when one fact changes

Preferred pattern:

```text
raw input
→ interpret once
→ semantic state
→ retrieve only relevant memory
→ plan once
→ author once
→ render
→ learn/update semantic state
```

## Database readiness

`Asset.stateConfig` is part of the Prisma schema and requires the matching database migration.

Migration verified/applied locally:

`20260822235000_add_asset_state_config`

The local Prisma migration deployment successfully applied the migration, and `@qre/db` build regenerated Prisma Client successfully.

## Acceptance suite / current verification matrix

### Green in the latest local sweep

- `@qre/engine` build
- `@qre/api` build
- `@qre/web` build
- cognitive-state chronology acceptance
- cognitive-author context acceptance
- presentation-boundary acceptance
- author provenance acceptance
- author provenance-gate acceptance
- subject provenance acceptance
- author knowledge-learning acceptance
- author learning-loop acceptance
- author outcome-learning acceptance
- author living-memory acceptance
- author movie-pipeline acceptance

### Fixed during this hardening pass

- Prisma `Asset.stateConfig` schema/database drift
- provenance vocabulary gap for `human` / `humans`
- Author pipeline type regression around `presentationMode` / `cta`
- legacy frontend debug/JSON surfaces leaking into the customer path
- author source sanitation for internal cognition labels
- semantic cognitive state exposure to the Author boundary

### Still a required local gate

`author-real-adaptive-learning-acceptance.ts` was blocked before the migration by missing `Asset.stateConfig`; rerun after migration deployment.

`author-full-circle-acceptance.ts` previously failed because its standalone fixture used the obsolete `identity` field instead of canonical `identityState`; the fixture has been aligned and must be rerun.

`author-semantic-full-circle-acceptance.ts` must be run after the latest branch pull; it is the end-to-end semantic invariant test covering:

- same learned subject across multiple experience intents
- explicit vs inferred negative preference
- current events vs accumulated subject knowledge
- one model call
- clean presentation output
- no internal cognition leakage

## Production acceptance target

The final production gate is not merely “build passes.”

QRE must demonstrate:

```text
INPUT / COLLECT
      ↓
MEMORY / IDENTITY
      ↓
UNIVERSAL COGNITION
      ↓
COGNITIVE STATE
      ↓
EXPERIENCE INTENT
      ↓
UNIVERSAL AUTHOR
      ↓
PROVENANCE / TRUTH GATE
      ↓
MOMENTS / SEQUENCE
      ↓
CINEMATIC RUNTIME
      ↓
VISIBLE CLEAN EXPERIENCE
      ↓
LEARNING UPDATE
```

For Coco, that means entering facts in any natural form should produce a coherent subject understanding, while a request such as “make a living dog tag” or “make today's grooming receipt” selects a different experience using the same learned subject.

The resulting output must be grounded, adaptive, creative, sequenced, and free of internal system dumps or unsupported concrete claims.

## Final launch checklist

1. Contracts build passes.
2. Engine build passes.
3. DB migration state matches Prisma schema.
4. DB build / Prisma generate passes.
5. API build passes.
6. Web build passes.
7. Subject provenance passes.
8. Presentation boundary passes.
9. Cognitive-state/context passes.
10. Knowledge/learning-loop/adaptive-learning suites pass.
11. Full-circle author acceptance passes.
12. Semantic full-circle acceptance passes.
13. Real Coco receipt/tag path produces renderable scenes.
14. Real frontend player renders only presentation data.
15. No internal cognition appears in the UI.
16. `git diff --check` passes.
17. Working tree is clean.
18. CI/deployment checks are green.

## Current status

**Architecture:** converging onto one universal cognition → author → mouth system.

**Frontend:** legacy debug/customer author surfaces purged; presentation boundary hardened.

**Truth:** explicit-vs-inferred provenance invariant is enforced.

**Database:** `Asset.stateConfig` migration applied locally.

**Build:** engine, API, and web builds are currently green from the latest local sweep.

**Release state:** **NOT READY TO MERGE/SHIP until the remaining full-circle/adaptive-learning gates and production Coco flow are rerun green and CI/deployment is green.**
