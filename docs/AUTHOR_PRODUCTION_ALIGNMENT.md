# QRE AUTHOR · PRODUCTION ALIGNMENT LEDGER

**STATUS:** CURRENT OPERATING LEDGER
**AUDIT SNAPSHOT:** `audit/mouth-production-sync`

This ledger records production laws and verified development learnings. It does not override the architecture index, wiring map, or COGAUTHOR contract map.

## CURRENT TARGET

```text
SUPPLIED REALITY
→ STRUCTURED REALITY GRAPH
→ RELATIONSHIPS
→ LATENT MOVIE SEARCH
→ MOVIE DIFFERENTIATION
→ MEANING SPINE
→ REALIZATION SLOTS
→ REALIZATION STRATEGY
→ MOUTH CANDIDATES
→ LANGUAGE / REALITY GATES
→ SEQUENCE BEAM
→ ATTENTION EDITOR
→ TRUTH / CUT POLICY
→ SEQUENCE ARC
→ FINAL EXACT ENDPOINT / FINAL SCENES
```

The Author remains universal. Domain examples are acceptance evidence, never architecture.

## HARD LAWS

### Reality owns facts

No author stage may invent a concrete person, object, location, action, reaction, chronology, sound, or outcome.

### Cognition owns meaning

Movie hypotheses, relationships, meaning, and realization jobs are upstream of the Mouth. The Mouth supplies language only.

### Grounding is not meaning

A sentence can contain supplied facts and still fail the cognitive job. Keyword overlap never substitutes for semantic movement.

### One beat = one cognitive job

A beat earns its place by advancing the viewer model. Fact collage is not a realization.

### Realization strategy is bounded interpretation

A strategy may alter framing, implication, status, rhythm, callback, compression, or rhetorical pressure. It may never alter approved reality or the semantic job assigned by the Meaning Spine.

### Endpoint authority is absolute

If the approved semantic plan supplies an endpoint, the final realization is that endpoint. Previous beats earn it; they do not embellish or replace it.

### Beam optimizes valid candidates

Sequence arithmetic must never rescue a candidate already rejected for truth violation, invention, endpoint violation, or forbidden realization behavior.

### Recovery is bounded

Malformed model output is a recovery condition. Preserve valid candidates and repair only the missing/failed portion. Do not create a second fallback author.

### Universal means entity-neutral

No active author authority may depend on Coco, grooming, wedding, restaurant, horror, or any other domain vocabulary.

### One authority per responsibility

```text
Reality authority   → RealityGraph / RealityEnvelope
Movie authority     → Latent Movie search / differentiation
Meaning authority   → Meaning Spine / Realization Slots
Strategy authority  → Realization Strategy Lattice
Language authority  → Mouth Candidate Search
Sequence authority  → Mouth Beam
Judgment authority  → Attention Editor / Truth / Cut Policy / Sequence Arc
```

## VERIFIED PRINCIPLES

Already demonstrated in the build cycle:

```text
contracts/type safety remain green when changes respect owners
RealityGraph preserves provenance and relations
latent movie candidates remain hypotheses
endpoint preservation is a hard constraint
candidate batches must be recoverable per beat
sequence scoring must operate on complete paths
bounded concurrency is required for local inference
```

## CURRENT OWNERSHIP FINDING

The synchronized production snapshot currently has **two model-generation ownership surfaces**:

```text
authorBrainUniversal.ts
    → direct per-beat localModelGenerate / parse / repair / candidate selection

authorMouthCandidateSearch.ts
    → its own per-beat generation / repair / bounded-concurrency machinery
```

This is an implementation duplication, not two legitimate semantic authorities.

### Required consolidation

The final production Mouth path should have one generation owner:

```text
approved Realization Slot
→ realization strategy selection
→ bounded model generation
→ normalization / repair
→ language + truth gates
→ candidate pools
```

`authorBrainUniversal.ts` should orchestrate that result, not reimplement the Mouth generation loop.

## APPROACH-B STATUS

Approach B is **partially present** and should be promoted rather than rebuilt:

```text
RealizationSlot
→ authorRealizationStrategyLattice.ts
→ AuthorRealizationStrategy / AuthorStrategyCandidate
→ Mouth candidate generation
→ truth / language / attention gates
→ Beam
```

The strategy lattice is currently a promotion target because the canonical Master Author does not yet invoke it as the generation strategy owner.

## ENTERPRISE CLUSTER STATUS

The Enterprise Mouth cluster contains useful capabilities—strategy selection, cumulative meaning, grounded surprise, safety, bounded budgets, and cross-domain fixtures—but `authorEnterpriseMouth.ts` is a duplicate orchestration path and is not consumed by the canonical Master Author.

Migration rule:

```text
useful capability
→ identify canonical owner
→ migrate
→ acceptance
→ retire duplicate orchestration
```

## STRUCTURED-OUTPUT LAW

The local model transport is a transport concern, not a cognition concern.

When JSON is malformed or truncated:

```text
preserve usable candidate data
→ normalize per beat
→ recover only missing coverage
→ continue through the same gates
```

Do not silently turn a partial model response into a successful partial movie.

## MOUTH LAW

The production Mouth must optimize:

```text
truth
+ semantic execution
+ relationship execution
+ attention movement
+ next-cut pull
+ novelty
+ compression
+ endpoint exactness
```

It must reject:

```text
invented concrete reality
planning prose
keyword collage
source restatement
clause overload
future-beat leakage
non-exact payoff
```

## DEBUGGING DISCIPLINE

For every failure:

```text
1. identify the first failed boundary
2. identify the lost contract
3. identify the responsible owner
4. consolidate duplicate ownership if present
5. make the narrowest surgical change
6. typecheck
7. run changed acceptance
8. inspect final viewer output
9. update registry / architecture / read log
```

Do not patch the last symptom while leaving an ownership mismatch intact.

## DO NOT REINTRODUCE

```text
hardcoded domain branches
benchmark-specific prose templates
independent fallback authors
second model identity names
v2/v3/final/fixed architecture files
per-test author logic
score laundering
endpoint embellishment
silent partial success
parallel semantic authorities
```

## NEXT INTELLIGENCE TARGET

After generation ownership is consolidated:

```text
REALIZATION STRATEGY SEARCH
→ STRATEGY-AWARE LANGUAGE GENERATION
→ CANDIDATE POOLS
→ WHOLE-SEQUENCE BEAM
→ ATTENTION / CUT / ARC
→ CROSS-DOMAIN ACCEPTANCE MATRIX
```

The goal is not more Author machinery. The goal is a decisive universal author whose viewer-facing result is excellent, grounded, complete, fast, and repeatable across unrelated industries.
