# QRE Author Changelog

This is the permanent experimental memory for the QRE Author.

Historical entries remain below, but the latest **CURRENT TRUTH** section overrides stale implementation claims.

## Working Rules

- Trace the full influence graph before changing author/cognition/compiler behavior.
- One canonical change at a time.
- Run the real Ollama runtime after meaningful changes.
- Inspect raw output, validated output, and production-path output.
- Learn general mechanisms, not phrase blacklists.
- Never weaken quality gates to make tests green.
- After 2–4 meaningful experiments, update this file and the architecture index.
- **Creative capability may multiply. Author authorities may not.**

---

## CURRENT TRUTH — 2026-08-15

### One brain / one path / one acceptance harness / guarded

The author architecture is now intentionally consolidated:

```text
PRODUCTION
experienceService
→ microBeatMouth / cinematicAuthor adapters
→ authorBrainUniversal

ACCEPTANCE
author-acceptance-suite
→ authorBrainUniversal
```

Both paths enter the **same Master Author**.

### Architecture drift guard

`scripts/verify-author-architecture.mjs`

The guard is now part of the repository build and CI path.

It fails when it detects:

```text
missing Master Author
missing canonical acceptance harness
legacy author files reintroduced
legacy author test pile reintroduced
acceptance imports a bridge instead of the Master Author
production imports deleted author paths
Master Author recreates a local validCut() validator
Master Author stops importing the canonical authorCutPolicy
```

The root build begins with:

```text
pnpm author:guard
```

CI runs the same guard before package builds.

This means architectural drift is now a **machine-enforced failure**, not a memory task.

### Master Author

`apps/api/src/services/authorBrainUniversal.ts`

This is the only Goal-1 creative author authority.

The Master Author now carries:

```text
Magnet Circle
Subject Continuity
Information Frontier
Sequence Necessity
Canonical Cut Policy evaluation
```

It must remain a living intelligence core: expand it when a general creative law is discovered; never reintroduce domain-specific or benchmark-specific author branches.

### MAGNET CIRCLE — CANONICAL SEQUENCE PRIMITIVE

QRE's universal creative invariant is not a prose style. It is the **MAGNET CIRCLE** inside `ViewerMomentum`:

```text
FACT
→ NOVELTY
→ UNCERTAINTY
→ INFORMATION VALUE
→ ATTENTION
→ TENSION
→ INFORMATION SEEKING
→ NARRATIVE ENGAGEMENT
→ DISCOVERY / REFRAME / PAYOFF
→ NEW UNCERTAINTY
↺
```

The shared contract exposes `MagnetCircle`, and the Master Author computes it for every sequence transition.

Diagnostics expose:

```text
magnetAverage
magnetPeak
magnetFloor
magnetCutsMeasured
```

The magnet is the invariant; creative style is downstream realization. Comedy, horror, romance, swagger, mystery, tenderness, absurdity, and other lenses can realize the same cognitive magnet differently.

### SUBJECT CONTINUITY + INFORMATION FRONTIER

Once the viewer knows the subject, the subject remains active in working memory.

```text
SUBJECT ESTABLISHED
→ PERSISTENT SUBJECT-SPACE
→ SPEND WORDS ON THE INFORMATION FRONTIER
```

The author should reference the subject again only when that reference itself carries information. Otherwise the next cut should spend its language on the newest valuable edge of the viewer's model.

The `InformationFrontier` contract tracks:

```text
known
frontier
novelty
uncertainty
informationValue
tension
nextNeed
```

The canonical cut policy measures:

```text
subjectReferenceCost
frontierValue
```

This is a universal law, not a Coco-specific rule.

### Production adapters

`apps/api/src/services/microBeatMouth.ts`

- projection/runtime adapter only
- no independent author
- no fixed creative beat count

`apps/api/src/services/cinematicAuthor.ts`

- rendering adapter only
- no independent author
- no critique/repair author loop
- no fixed creative beat count

### Canonical acceptance harness

`apps/api/author-acceptance-suite.ts`

Cases currently preserved:

```text
COCO
COCO-RETURN
MARIA
HORROR
RAVE
```

Run with:

```powershell
pnpm author:fast -- COCO
```

The harness calls `authorBrainUniversal` directly. There is no test-only author bridge and no test-only creative prompt enrichment.

### Deleted author junk

Removed:

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/authorBrainMomentum.ts
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
apps/api/src/services/authorFastCore.ts
apps/api/src/services/creativeRelationOps.ts
```

### Deleted test junk

Removed the accumulated one-off API author benchmark scripts.

The single replacement is:

```text
apps/api/author-acceptance-suite.ts
```

### Upstream cognition remains authoritative

Keep and evolve:

```text
packages/engine/src/cognition/universalMind.ts
packages/engine/src/cognition/worldModel.ts
packages/engine/src/cognition/significanceEngine.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/mindState.ts
```

These provide world understanding, significance, creative candidate search, planning, and learning. They are upstream cognition, not competing mouths.

### Cut policy convergence — COMPLETE

`apps/api/src/services/authorCutPolicy.ts` is now the **single semantic cut evaluator**.

`authorBrainUniversal.ts` no longer owns a duplicate `validCut()` implementation. The Master Author passes candidate cuts through the canonical policy with prior-cut context and exposes rejection reasons for diagnostics.

The canonical evaluator owns:

```text
groundedness
novelty
implication
explanation
question leakage
invention risk
repetition
compression
subject reference cost
information frontier value
```

### Core creative laws

```text
identity is baseline
truth ≠ attention
source state ≠ plot instruction
emotion ≠ automatic story arc
creative interpretation ≠ invented event
questions belong in hidden cognition
provider/service is usually stage context
subject/world gravity
persistent subject-space after establishment
information frontier outranks identity repetition
compressed impact > word-count fetish
one cut = one attention moment
next cut must earn itself
recurrence requires evidence
sparse world → smaller invented-world surface
magnet strength > beat count
remove a cut → if the information-seeking trajectory weakens, it mattered
creative style is downstream realization, not the universal objective
```

### Test integrity invariant

> **The test must not influence the production path, and the production path must not use a different author from the test.**

A benchmark is an observer. The Master Author is the authority.

### Next engineering target

Now that the path and semantic judge are converged, the next intelligence pass is **creative search**:

```text
WORLD FACTS
→ RELATION GRAPH
→ MULTIPLE MAGNET CANDIDATES
→ COUNTER-OBVIOUS ATTACK
→ MAGNET RANKING
→ SEQUENCE
→ THEATRICAL REALIZATION
```

The objective is not better wording first. The objective is to discover the highest-value information frontier before realizing it as language.

After that, evolve `creativePolicy.ts` away from domain-specific prose templates toward reusable creative operations that search the Magnet Circle instead of choosing wording first.

---

## CURRENT TRUTH — 2026-08-22 · RUNTIME / ANALYTICS CONVERGENCE

The runtime refactor established a separate runtime plane rather than pushing infrastructure into cognition or the author.

Canonical reference:

`docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md`

### Runtime / cognition / analytics are separate planes

```text
RUNTIME
  scan / access / moments / flow / geo / cinematic / delivery / session

COGNITION
  world understanding / significance / memory reasoning / creative learning

ANALYTICS
  runtime observations / registry semantics / repository persistence / dashboards
```

Runtime events travel through the Engine Event Spine. Analytics semantics are defined by the contracts registry. Database persistence is owned by `AnalyticsRepository`.

### Engine Event Spine

Canonical file:

`packages/engine/src/spine/eventSpine.ts`

Responsibilities:

```text
broadcast runtime lifecycle events
keep runtime decoupled
allow analytics / memory / reward listeners
avoid Prisma
avoid database writes
```

Presence and flow are now spine-native:

```text
CHECK_IN
CHECK_OUT
FLOW_STEP
FLOW_COMPLETE
```

The scan lifecycle is also spine-native:

```text
SCAN_START
SESSION_START
AI_DECISION
AI_MEMORY_USED
AI_CINEMATIC_DECISION
AI_MEMORY_LEARNED
ERROR
SESSION_END
```

### Analytics adapter

Canonical adapter:

`apps/api/src/services/analyticsSpineSubscriber.ts`

Its job is:

```text
EngineEvent
→ ENGINE_TO_ANALYTICS
→ AnalyticsEventType
→ AnalyticsRepository
```

The mapping is intentionally explicit because EngineEventType and AnalyticsEventType are different semantic vocabularies.

The adapter validates that every mapped analytics type exists in:

`ANALYTICS_EVENT_REGISTRY`

### Analytics registry

Canonical contracts:

```text
packages/contracts/src/analytics.ts
packages/contracts/src/analyticsRegistry.ts
```

The registry defines:

```text
type
category
description
defaultOutcome
source
learningRelevant
customerVisible
enterpriseRelevant
investorRelevant
```

Current coverage:

```text
contractEvents=57
registryEvents=57
missing=none
extra=none
invalid=none
REGISTRY COMPLETE: PASS
```

### Analytics persistence rule

Direct analytics database persistence is centralized in:

`apps/api/src/repositories/analyticsRepository.ts`

The runtime may read analytics through repository interfaces, such as:

```text
getScanInsights(assetId, analyticsRepository)
```

but runtime orchestration must not write `db.analyticsEvent` directly.

### Scan engine remains the single runtime orchestrator

Both production scan routes converge on:

```text
apps/api/src/routes/scan.route.ts
apps/api/src/routes/scan.index.ts
        ↓
packages/engine/src/scanEngine.ts
```

The scan engine was deliberately reduced by responsibility rather than moved into cognition.

Current runtime seams:

```text
buildRuntimeMoments()
selectCinematicScenes()
buildRuntimeGeoStory()
```

A MemorySnapshot runtime boundary is also defined as the next seam.

The canonical scan orchestration remains:

```text
asset
→ session
→ access
→ runtime moments
→ flow
→ GeoStory
→ cinematic selection
→ MemorySnapshot
→ story delivery
→ service receipt when applicable
→ analytics read-side insights
→ session end
```

### GeoStory

`packages/engine/src/geo/geoStoryCompiler.ts` is a pure geographic narrative compiler.

It converts observed geographic points into:

```text
intro scene
presence scenes grouped by rounded location
exit scene
summary
```

It is a presentation projection, not durable factual memory and not a creative author.

### MemorySnapshot

`packages/engine/src/geo/buildMemorySnapshot.ts` constructs a runtime experience-memory capsule from:

```text
moments
GeoStory
cinematicScenes
optional prior snapshot
```

It derives bounded runtime properties such as:

```text
type
locationTags
timeline
emotionalTone
title
summary
highlights
runtime metadata
```

It evolves runtime memory through `evolveRuntimeMemory(moments, prior)`.

MemorySnapshot is not the durable factual memory database. Runtime behavior must not silently become a new fact about the world.

One provenance caution is permanent: when a moment lacks a real time, the snapshot can create a synthetic timeline timestamp. Downstream code must not mistake that fallback for observed chronology.

### Runtime cinematic selection

The runtime selector is:

`packages/engine/src/runtime/cinematic/selectCinematicScenes.ts`

It owns:

```text
existing authored cinematic scenes
collaborative-memory acceptance filtering
scene normalization
generated cinematic fallback
selection policy
```

It is a presentation selector, not another author.

### Dead spine paths removed

The obsolete secondary handler path was removed:

```text
packages/engine/src/spine/handlers.ts
```

Stale generated handler and cognition-listener outputs were removed as well, and repository searches showed no remaining source references to the deleted handler/listener APIs.

### Acceptance evidence

After the runtime/analytics refactor, the following gates remained green:

```text
ENGINE SPINE PRESENCE ACCEPTANCE: PASS
ENGINE SPINE FLOW ACCEPTANCE: PASS
ANALYTICS SPINE ACCEPTANCE: PASS
REGISTRY COMPLETE: PASS
REAL ADAPTIVE LEARNING ACCEPTANCE: PASS
```

Adaptive learning also remained:

```text
baselineLens=deadpan
learnedLens=courtroom
learningPersisted=true
identityStateProjection=true
contextProjection=true
realityPreserved=true
assetIsolation=true
```

Builds and whitespace validation remained clean:

```text
contracts build ✅
engine build ✅
api build ✅
git diff --check ✅
```

### Current engineering principle

As intelligence expands, runtime orchestration should get simpler. The system should gain capabilities by extending canonical owners and boundaries, not by accumulating duplicate brains, buses, validators, or hidden repair systems.

---

## HISTORICAL ENTRIES

Older experiments are retained as evidence of discovered creative laws. They are not implementation authority.

Key durable findings include:

- QRE is splicing film, not writing a conventional paragraph.
- Two-word cuts can be powerful when they carry high implied context.
- Shortness itself is not the objective.
- A fact can be true without earning an attention cut.
- Emotional states are evidence, not automatic plot structure.
- Generic transformation arcs are a common failure mode.
- Service providers are usually stage context rather than protagonists.
- Questions belong in hidden cognition unless they are supplied source language.
- Sparse inputs should produce tighter creative implication rather than fabricated backstory.
- Returning chapters must change meaning rather than replay earlier chapters.
- `Lawyer informed.`, `Pink bows everywhere.`, `Coco flaunts the tag.`, and `Fear smear, baby.` are reference behaviors for compressed implication, not literal templates.

See:

`docs/QRE_AUTHOR_GOAL.md`
`docs/AUTHOR_ARCHITECTURE_INDEX.md`
`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`
`docs/QRE_MAGNET_CIRCLE.md`
