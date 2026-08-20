# QRE AUTHOR ARCHITECTURE INDEX

**STATUS:** CURRENT / CANONICAL
**AUDIT:** 2026-08-20 · `audit/mouth-production-sync`
**AUTHORITY:** This file defines current semantic ownership. Historical/idea documents do not override it.

## 1. MASTER RULE

> **ONE SEMANTIC AUTHORITY PER STAGE. NO GAPS. NO SHADOW AUTHORS.**

```text
SOURCE REALITY
    ↓
REALITY GRAPH
    ↓
COGNITION / CHARACTER READ
    ↓
LATENT MOVIE SEARCH
    ↓
MOVIE DIFFERENTIATION
    ↓
MASTER AUTHOR / BEAT DISCOVERY
    ↓
MEANING SPINE / REALIZATION SLOTS
    ↓
REALIZATION STRATEGY LATTICE
    ↓
ONE CANONICAL MOUTH GENERATION OWNER
    ↓
DETERMINISTIC SEQUENCE BEAM
    ↓
ATTENTION EDITOR
    ↓
TRUTH / CUT POLICY
    ↓
SEQUENCE ARC
    ↓
FINAL SCENES
    ↓
RUNTIME
```

## 2. CANONICAL OWNERS

| Concern | Canonical owner | Status |
|---|---|---|
| Source truth / evidence graph | `apps/api/src/services/authorRealityGraph.ts` | ACTIVE |
| Cognition / character read | `apps/api/src/services/authorCognition.ts` | ACTIVE |
| Latent movie search | `apps/api/src/services/authorLatentMovieSearch.ts` | ACTIVE |
| Graph convergence support | `apps/api/src/services/authorLatentMovieConvergence.ts` | ACTIVE SUPPORT |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` | ACTIVE |
| Master Author orchestration | `apps/api/src/services/authorBrainUniversal.ts` | ACTIVE / SOLE AUTHORITY |
| Beat recovery | `apps/api/src/services/authorBeatPlanRecovery.ts` | ACTIVE SUPPORT |
| Meaning Spine | `apps/api/src/services/authorMeaningSpine.ts` | ACTIVE |
| Realization Slots | `apps/api/src/services/authorMouthRealizationSlot.ts` | ACTIVE |
| Realization strategy selection | `apps/api/src/services/authorRealizationStrategyLattice.ts` | ACTIVE CAPABILITY / PROMOTION TARGET |
| Mouth semantic contract | `packages/contracts/src/cogauthor/mouth.ts` | CANONICAL |
| Mouth candidate generation / normalization / scoring / bounded repair | `apps/api/src/services/authorMouthCandidateSearch.ts` | ACTIVE / SOLE MOUTH GENERATION OWNER |
| Mouth sequence selection | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | ACTIVE |
| Whole-sequence attention editing | `apps/api/src/services/authorAttentionEditor.ts` | ACTIVE |
| Beat truth | `apps/api/src/services/authorBeatTruthGate.ts` | ACTIVE |
| Final cut legality / grounding / frontier | `apps/api/src/services/authorCutPolicy.ts` | ACTIVE |
| Sequence arc | `apps/api/src/services/authorSequenceArcGate.ts` | ACTIVE |
| Model transport | `apps/api/src/services/localModelRuntime.ts` | ACTIVE / TRANSPORT ONLY |

## 3. MOUTH OWNERSHIP

There is exactly one production Mouth generation owner:

```text
apps/api/src/services/authorMouthCandidateSearch.ts
```

It owns the model-facing realization call and candidate scoring. The Master Author orchestrates the result; it does not recreate another generation/repair/selection pipeline.

Separate language/attention/quality/fallback adapters were retired when their only production consumer was the non-canonical Enterprise Mouth stack. Their useful invariants have either been incorporated into canonical scoring/gates or are preserved as production laws.

## 4. APPROACH B

Approach B is a controlled realization-strategy search.

The contract explicitly carries:

```text
MouthCandidateBeat.realizationStrategies
```

Target:

```text
Meaning Spine
→ Realization Slot
→ safe realization strategies
→ Mouth wording candidates
→ deterministic semantic scoring
→ Beam
```

The lattice may change framing, implication, status, contrast, callback, compression, understatement, personification, or other expressive treatment. It never grants permission to invent reality.

## 5. TRUTH BOUNDARY

Reality is immutable.

Allowed:

```text
fact → factual realization
fact + supported relation → interpretation
supplied contradiction → creative framing
supplied recurrence → changed significance
supplied media → evidence
```

Forbidden as new factual content:

```text
new person
new object
new location
new chronology
new concrete action
new body reaction
new dialogue
new sound
new outcome
```

## 6. MEDIA LAW

User media is part of source reality:

```text
user uploads before/after photos
→ multimodal evidence extraction
→ RealityGraph / evidence
→ canonical Author
```

AI image generation is not part of the canonical Author path.

`aiProvider.ts` is a provider adapter and compatibility layer. Any compatibility writing call must delegate to `authorBrainUniversal.ts`; it cannot become a second prose author.

## 7. EXPERIMENTAL CAPABILITIES

The following remain capability reservoirs and are not semantic authorities until their live consumer and acceptance path are proven:

```text
authorLatentStoryThesis.ts
authorCreativeSearch.ts
authorCounterfactualSearch.ts
authorTrajectorySearch.ts
authorMouthCreativeLock.ts
authorCharacterLensEngine.ts
authorEvidenceFusion.ts
authorMemoryIntelligence.ts
authorMultimodalEvidence.ts
authorModelRouter.ts
authorTruth.ts
```

Trajectory search is especially important for future realization-viability / trajectory-compression work, but it is not silently promoted into the Master Author until its endpoint semantics are proven.

## 8. RETIRED SHADOW SYSTEMS

The following non-canonical Enterprise and orphaned Mouth support modules were removed in the 2026-08-20 audit:

```text
Enterprise Mouth orchestration / policy / runtime / safety / intelligence
Enterprise acceptance harness
MouthQualityAdapter
MouthGroundedFallback
MouthLanguageGate
MouthAttentionGate
MouthRepairPlanner
CumulativeMeaning support adapter
LatentMovieBeatAdapter
```

A new filename must not recreate any of these as another author.

## 9. ACCEPTANCE RULE

Production acceptance exercises:

```text
authorBrainUniversal()
```

Helper acceptance exists to diagnose components. It cannot establish production authority.

## 10. DEFINITION OF DONE

The Author becomes production-ready when unfamiliar source reality can travel through one coherent machine:

```text
reality
→ meaningful interpretation
→ differentiated movie
→ deliberate beat graph
→ realization strategy
→ strong Mouth candidates
→ sequence optimization
→ attention / truth / cut
→ exact endpoint
→ complete scenes
```

The quality standard is not “the compiler ran.” It is excellent, grounded, distinct, complete output across unrelated industries, sparse inputs, rich inputs, returning memories, and user-supplied media.
