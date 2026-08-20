# QRE AUTHOR · CURRENT STATE

**STATUS:** CANONICAL CURRENT-STATE REFERENCE
**AUDIT:** 2026-08-20 · `audit/mouth-production-sync`

Read this before changing Author, Mouth, contracts, attention, cut policy, sequence arc, or model transport.

## 1. CURRENT PRODUCTION PATH

```text
SUPPLIED REALITY / USER MEDIA EVIDENCE
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
MEANING SPINE
   ↓
REALIZATION SLOTS
   ↓
REALIZATION STRATEGY LATTICE
   ↓
ONE CANONICAL MOUTH GENERATION OWNER
   ↓
DETERMINISTIC BEAM
   ↓
ATTENTION EDITOR
   ↓
TRUTH / CUT POLICY
   ↓
SEQUENCE ARC
   ↓
FINAL SCENES
   ↓
CINEMATIC RUNTIME
```

There is one semantic authority per stage. A helper may support a stage; it may not become another author.

## 2. PRODUCTION AUTHOR OWNERS

```text
Reality:          authorRealityGraph.ts
Cognition:        authorCognition.ts
Movie Search:     authorLatentMovieSearch.ts
Movie Diff:       authorMovieDifferentiation.ts
Master Author:    authorBrainUniversal.ts
Meaning:          authorMeaningSpine.ts
Slots:            authorMouthRealizationSlot.ts
Strategy:         authorRealizationStrategyLattice.ts
Mouth:            authorMouthCandidateSearch.ts
Beam:             authorMouthSequenceBeamSearch.ts
Attention:        authorAttentionEditor.ts
Truth:            authorBeatTruthGate.ts
Cut:              authorCutPolicy.ts
Arc:              authorSequenceArcGate.ts
Transport:        localModelRuntime.ts
```

## 3. MOUTH AUTHORITY LAW

There is exactly one production Mouth generation owner:

```text
apps/api/src/services/authorMouthCandidateSearch.ts
```

It owns:

```text
bounded model generation
candidate normalization
reality/invention checks
semantic candidate scoring
bounded repair
candidate selection input
```

`authorBrainUniversal.ts` orchestrates this result. It is not allowed to own a second Mouth generation implementation.

## 4. APPROACH B

Approach B is a realization strategy search, not another author.

The shared Mouth contract now carries:

```text
MouthCandidateBeat.realizationStrategies
```

The production target is:

```text
Meaning
→ Slot
→ safe strategies
→ language
→ deterministic semantic gates
→ Beam
```

Strategies may change framing, implication, status language, contrast, compression, callback, understatement, or other expressive treatment. They never grant permission to invent reality.

## 5. REALITY LAW

Reality is immutable.

User-supplied text, media-derived evidence, memory evidence, and confirmed source events form the factual world. Creative realization may alter framing, implication, metaphor, status, tone, and rhythm. It may not promote unsupported people, places, objects, actions, sounds, body reactions, chronology, dialogue, or outcomes into fact.

## 6. USER MEDIA LAW

The product is a user-owned-memory system:

```text
USER UPLOADS COCO BEFORE / AFTER PHOTOS
           ↓
MEDIA UNDERSTANDING
           ↓
EVIDENCE
           ↓
REALITY GRAPH
           ↓
AUTHOR
           ↓
MOUTH
```

AI image generation is not part of the canonical Author path. QRE may understand supplied media; it does not silently fabricate replacement reality.

## 7. UNIVERSALITY LAW

Nothing in the canonical Author path may depend on:

```text
dog grooming
weddings
restaurants
real estate
shelters
rescue dogs
one specific object
one specific emotion
one benchmark phrase
```

Domains are source content. The creative engine operates on relationships, changes, recurrence, tension, implication, attention, meaning, and endpoint integrity.

## 8. RETIRED SHADOW SYSTEMS

The audit removed the non-canonical Enterprise Mouth stack and its orphaned Mouth quality/fallback/repair stack.

Deleted systems must not be recreated as a new parallel author under a new filename.

## 9. EXPERIMENTAL CAPABILITY LAW

The repository may contain useful capability reservoirs such as:

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

These are not production authority until a real consumer, contract, and acceptance responsibility are proven.

## 10. TRAJECTORY VIABILITY

A requested beat count is not sacred.

If a planned beat has no distinct legal semantic realization, the system must eventually compress or merge trajectory structure rather than manufacture repeated Mouth lines.

The terminal endpoint remains sovereign during compression.

Target invariant:

```text
requested semantic intent
→ maximum distinct legal realizations
→ intelligent trajectory compression when necessary
→ exact endpoint
→ accepted final scenes
```

## 11. DEVELOPMENT LOOP

```text
FAILURE SIGNATURE
→ TRACE THE WHOLE INFLUENCE PATH
→ IDENTIFY THE OWNER / CONTRACT FAILURE
→ CHANGE ONE ARCHITECTURAL LAYER
→ TYPECHECK
→ CANONICAL ACCEPTANCE
→ CROSS-DOMAIN ACCEPTANCE
→ INSPECT OUTPUT
→ UPDATE REGISTRY / WIRING / LOG
```

Never weaken a gate merely to make the benchmark green.

## 12. PRODUCTION BAR

```text
VALID     = structurally and truthfully legal
GOOD      = grounded + coherent + moving
EXCELLENT = grounded + specific + surprising + cumulative + memorable
```

Production means the machine can reach the excellent class across unfamiliar prompts, domains, sparse evidence, rich evidence, returning memories, and user-supplied media without creating a second author.
