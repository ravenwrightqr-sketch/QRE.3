# QRE Runtime + Analytics Current State

**Date:** 2026-08-22  
**Purpose:** Record the runtime, analytics, memory, geo, cinematic, and validation architecture established during the current QRE engineering pass.

> This document records the working architecture and acceptance evidence established in the development pass. The local working tree may contain source changes that have not yet been pushed to this GitHub branch. Do not treat this file as proof that every listed local source change is already present on `main`.

## 1. Architectural Boundary

QRE now treats three systems as separate semantic planes:

```text
RUNTIME
  scan / access / moments / flow / geo / cinematic / delivery / session

COGNITION
  world understanding / significance / memory reasoning / creative learning

ANALYTICS
  runtime observations / registry semantics / repository persistence / dashboards
```

The runtime and cognition layers may exchange bounded data, but analytics persistence is not allowed to become a runtime implementation detail.

## 2. Canonical Scan Runtime Entry Point

The canonical runtime entry point remains:

```text
packages/engine/src/scanEngine.ts
```

Both production API scan paths converge on `scanEngine()`:

```text
apps/api/src/routes/scan.route.ts
apps/api/src/routes/scan.index.ts
        ↓
packages/engine/src/scanEngine.ts
```

The scan routes are delivery surfaces. They should not duplicate lifecycle orchestration or analytics persistence logic.

## 3. Scan Runtime Responsibilities

`scanEngine()` orchestrates the runtime sequence:

```text
asset resolution
↓
session creation
↓
access resolution
↓
runtime moment assembly
↓
flow execution
↓
GeoStory construction
↓
cinematic scene selection
↓
MemorySnapshot construction
↓
story delivery
↓
service receipt when applicable
↓
analytics read-side insights
↓
session completion
```

A receipt here means the basic runtime service receipt produced by the engine when the runtime detects a qualifying service experience. It is not the author mouth itself and is not the cinematic player.

## 4. Runtime Decomposition

The scan engine is intentionally getting smaller as semantic responsibilities are extracted into coherent runtime boundaries.

### Runtime moment assembly

Current internal seam:

```text
buildRuntimeMoments()
```

It owns:

```text
system moments
purchase moments when access is not unlocked
flow-step → moment conversion when unlocked
moment ordering
```

This is runtime planning, not cognition.

### Cinematic selection

Current runtime boundary:

```text
packages/engine/src/runtime/cinematic/selectCinematicScenes.ts
```

It owns:

```text
generated cinematic scenes
accepted authored cinematic scenes
collaborative-memory acceptance filtering
scene normalization
selection policy: authored scenes when available, otherwise generated scenes
```

It does not create a second author.

`cinematicRuntime()` remains the cinematic realization engine. The selector is the runtime presentation policy around it.

### Geo runtime boundary

Current runtime adapter:

```text
packages/engine/src/runtime/geo/buildRuntimeGeoStory.ts
```

It converts scan-level geo input into the compiler's `GeoPoint[]` shape and delegates to:

```text
packages/engine/src/geo/geoStoryCompiler.ts
```

The underlying GeoStory compiler stays pure and remains in `geo/`.

### Memory runtime boundary

The intended runtime seam is:

```text
packages/engine/src/runtime/memory/buildRuntimeMemorySnapshot.ts
```

Its purpose is to make the runtime boundary explicit around `buildMemorySnapshot()` without redesigning the underlying memory projection.

## 5. Engine Event Spine

Runtime analytics emission now uses the Engine Event Spine:

```text
packages/engine/src/spine/eventSpine.ts
```

The spine:

```text
broadcasts runtime lifecycle events
keeps the engine decoupled from analytics storage
contains no Prisma code
performs no database writes
```

Presence emits spine events for:

```text
CHECK_IN
CHECK_OUT
```

Flow execution emits:

```text
FLOW_STEP
FLOW_COMPLETE
```

Scan runtime emits:

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

The event spine is runtime vocabulary. It is intentionally not identical to the durable analytics vocabulary.

## 6. Analytics Adapter

The API owns the analytics adapter:

```text
apps/api/src/services/analyticsSpineSubscriber.ts
```

Its job is:

```text
EngineEvent
    ↓
ENGINE_TO_ANALYTICS
    ↓
AnalyticsEventType
    ↓
AnalyticsRepository
```

The mapping is explicit because runtime events and business analytics events are different semantic types.

Example:

```text
SCAN_START → SCAN
UNLOCK_GRANTED → UNLOCK
CHECK_IN → CHECK_IN
FLOW_STEP → FLOW_STEP
AI_MEMORY_LEARNED → AI_MEMORY_LEARNED
```

The adapter is registry-aware and rejects an analytics type that is missing from the canonical registry.

## 7. Analytics Registry

Canonical contracts:

```text
packages/contracts/src/analytics.ts
packages/contracts/src/analyticsRegistry.ts
```

The registry defines the meaning of every analytics event, including:

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

The registry is not a duplicate runtime event bus. It is the semantic definition of durable analytics observations.

The registry currently covers 57 events.

The permanent registry gate is:

```text
packages/contracts/registry-check.ts
```

Acceptance result established during this pass:

```text
contractEvents=57
registryEvents=57
missing=none
extra=none
invalid=none
REGISTRY COMPLETE: PASS
```

## 8. Analytics Persistence Boundary

Direct analytics writes are now centralized through:

```text
apps/api/src/repositories/analyticsRepository.ts
```

The intended invariant is:

```text
runtime / services
        ↓
AnalyticsRepository.trackEvent()
        ↓
db.analyticsEvent.create()
```

A repository search during this pass showed only the repository retaining the direct `db.analyticsEvent.create` write in the engine/API source paths.

Ticketing analytics and other direct route writes were moved toward the repository path during the refactor so the persistence boundary remains centralized.

## 9. Analytics Read Side

Analytics reads remain legitimate runtime dependencies where needed.

For example:

```text
getScanInsights(assetId, repos.analyticsRepository)
```

is a read-side analytics query. It does not violate the persistence boundary.

The rule is:

```text
scanEngine may READ analytics-derived insight
scanEngine does not WRITE analytics records directly
```

## 10. GeoStory Semantics

`packages/engine/src/geo/geoStoryCompiler.ts` converts observed geographic points into a presentation-oriented `GeoStory`.

Inputs:

```text
assetId
lat
lng
createdAt
optional label/city/region/country
```

Behavior:

```text
no points
  → empty scenes + "No movement recorded."

points
  → intro scene from first point
  → grouped presence scenes
  → exit scene from final point
  → geographic summary
```

Locations are grouped using latitude/longitude rounded to two decimal places.

Presence scene intensity is bounded by:

```text
min(1, visits / 5)
```

GeoStory is a geographic narrative projection. It is not a factual memory database, not a tracker, and not a creative author.

## 11. MemorySnapshot Semantics

`packages/engine/src/geo/buildMemorySnapshot.ts` constructs a runtime experience-memory capsule from:

```text
assetId
moments
GeoStory
cinematicScenes
optional prior MemorySnapshot
```

It classifies the runtime experience using bounded moment-type heuristics:

```text
location + media → event
location only     → service
story             → generic / experience
GeoStory > 3 scenes → memorial override
```

It also builds:

```text
locationTags
timeline
emotionalTone
title
summary
highlights
runtime metadata
```

It calls `evolveRuntimeMemory(moments, prior)` from the runtime cognition layer, allowing a prior snapshot to evolve rather than starting from nothing each time.

Important provenance rule:

The timeline can use a synthetic timestamp fallback when an explicit moment time is absent. That fallback must not be mistaken downstream for observed real-world event chronology.

## 12. Memory Boundary

`MemorySnapshot` is not the durable factual memory store.

Conceptually:

```text
RUNTIME EXPERIENCE
   ↓
Moments + GeoStory + Cinematic Scenes
   ↓
MemorySnapshot
   ↓
player / delivery / runtime memory representation
```

Separately:

```text
SOURCE / AUTHOR / USER EVIDENCE
   ↓
COGNITION + MEMORY PROJECTION
   ↓
DURABLE FACTS / ENTITIES / RELATIONS / EVENTS
```

A runtime experience capsule must not silently become a new fact about the world.

The API scan route therefore keeps scan-memory consolidation as a separate path from factual memory so runtime behavior cannot masquerade as new truth.

## 13. Cognition Boundary

Cognition remains upstream of final runtime realization.

The author/cognition architecture retains its existing canonical ownership:

```text
Reality Graph
→ latent movie search
→ movie differentiation
→ cognition
→ Master Author
→ mouth / experience moments
→ cinematic runtime
```

Runtime projection modules must not become second authors.

The new runtime decomposition is therefore deliberately outside `packages/engine/src/cognition/`.

## 14. Deleted / Removed Spine Junk

During the spine cleanup, the obsolete secondary handler path was removed:

```text
packages/engine/src/spine/handlers.ts
```

The generated stale outputs were also removed:

```text
packages/engine/dist/spine/handlers.js
packages/engine/dist/spine/handlers.d.ts
packages/engine/dist/spine/handlers.d.ts.map
packages/engine/dist/spine/cognitionListener.js
packages/engine/dist/spine/cognitionListener.d.ts
packages/engine/dist/spine/cognitionListener.d.ts.map
```

Searches confirmed no remaining source imports of:

```text
registerHandler
emitToHandlers
spine/handlers
cognitionListener
startCognitionListener
```

The remaining runtime spine authority is `eventSpine.ts`.

## 15. Acceptance Evidence

The following gates were repeatedly passing after the refactor:

```text
ENGINE SPINE PRESENCE ACCEPTANCE: PASS
ENGINE SPINE FLOW ACCEPTANCE: PASS
ANALYTICS SPINE ACCEPTANCE: PASS
REGISTRY COMPLETE: PASS
REAL ADAPTIVE LEARNING ACCEPTANCE: PASS
```

The adaptive-learning acceptance additionally verified:

```text
baselineLens=deadpan
learnedLens=courtroom
learningPersisted=true
identityStateProjection=true
contextProjection=true
realityPreserved=true
assetIsolation=true
```

Build checkpoint:

```text
pnpm --filter @qre/contracts build  ✅
pnpm --filter @qre/engine build      ✅
pnpm --filter @qre/api build         ✅
git diff --check                      ✅
```

## 16. Architectural Rules Established in This Pass

```text
scanEngine remains the single runtime scan orchestrator
scan routes remain delivery surfaces
runtime event vocabulary ≠ analytics vocabulary
analytics registry is canonical for analytics meaning
direct analytics DB persistence belongs in AnalyticsRepository
engine stays Prisma-free
GeoStory remains geographic projection
MemorySnapshot remains runtime experience memory, not durable truth
cognition does not absorb runtime plumbing
runtime selectors/adapters do not become authors
QRE should become simpler as intelligence increases
```

## 17. Next Runtime Refactor

The remaining scan-engine responsibilities should be extracted one coherent seam at a time.

Current sequence:

```text
buildRuntimeMoments()                    ✓
selectCinematicScenes()                  ✓
buildRuntimeGeoStory()                   ✓
buildRuntimeMemorySnapshot()             NEXT / boundary defined
```

After those boundaries are stable, reassess the remaining orchestration in `scanEngine.ts` rather than continuing to split arbitrarily.

The goal is not to make the engine small for its own sake. The goal is to make every semantic responsibility obvious, testable, and owned exactly once.
