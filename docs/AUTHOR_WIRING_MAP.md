# QRE AUTHOR WIRING MAP

**STATUS:** CURRENT / CANONICAL
**AUDIT:** 2026-08-20 · `audit/mouth-production-sync`

## Canonical live path

```text
USER-SUPPLIED REALITY / MEDIA EVIDENCE
  → authorRealityGraph.ts
  → authorCognition.ts
  → authorLatentMovieSearch.ts
  → authorMovieDifferentiation.ts
  → authorBrainUniversal.ts
  → authorMeaningSpine.ts
  → authorMouthRealizationSlot.ts
  → authorRealizationStrategyLattice.ts
  → authorMouthCandidateSearch.ts
  → authorMouthSequenceBeamSearch.ts
  → authorAttentionEditor.ts
  → authorBeatTruthGate.ts / authorCutPolicy.ts
  → authorSequenceArcGate.ts
  → final scenes
  → cinematic runtime
```

## Canonical owners

| Responsibility | Owner | Status |
|---|---|---|
| Reality construction | `authorRealityGraph.ts` | CANONICAL |
| Cognition / character read | `authorCognition.ts` | CANONICAL |
| Latent movie search | `authorLatentMovieSearch.ts` | CANONICAL |
| Graph convergence support | `authorLatentMovieConvergence.ts` | CANONICAL SUPPORT |
| Material movie differentiation | `authorMovieDifferentiation.ts` | CANONICAL |
| Master Author orchestration | `authorBrainUniversal.ts` | CANONICAL / SOLE AUTHORITY |
| Meaning Spine | `authorMeaningSpine.ts` | CANONICAL |
| Realization boundary | `authorMouthRealizationSlot.ts` | CANONICAL |
| Realization strategy selection | `authorRealizationStrategyLattice.ts` | CANONICAL CAPABILITY / NEXT WIRING PROMOTION |
| Mouth generation + normalization + scoring | `authorMouthCandidateSearch.ts` | CANONICAL / SOLE MOUTH GENERATION OWNER |
| Sequence optimization | `authorMouthSequenceBeamSearch.ts` | CANONICAL |
| Attention accumulation | `authorAttentionEditor.ts` | CANONICAL |
| Beat truth | `authorBeatTruthGate.ts` | CANONICAL |
| Final cut policy | `authorCutPolicy.ts` | CANONICAL |
| Sequence arc | `authorSequenceArcGate.ts` | CANONICAL |
| Model transport | `localModelRuntime.ts` | CANONICAL TRANSPORT ONLY |

## Architecture cleanup completed in this audit

The following shadow branch was removed:

```text
Enterprise Mouth
+ Enterprise policy/runtime/safety/intelligence
+ Enterprise acceptance path
+ standalone Mouth quality/language/attention/fallback/repair adapters
+ duplicate latent-movie→beat adapter
```

Those modules were not consumed by the canonical Master Author. Keeping them would preserve duplicate ownership and make future failures ambiguous.

## Mouth ownership law

There is exactly one production Mouth generation owner:

```text
authorMouthCandidateSearch.ts
```

`authorBrainUniversal.ts` may orchestrate Mouth work, but must not implement another model-generation / parse / repair / selection subsystem.

## Approach-B target

Approach B is now represented in the shared Mouth contract through:

```text
MouthCandidateBeat.realizationStrategies
```

The next live wiring step is:

```text
RealizationSlot
→ deriveSafeStrategies()
→ realizationStrategies on MouthCandidateBeat
→ candidate prompt explicitly explores those strategies
→ deterministic scoring / Beam decides which wording survives
```

The strategy lattice changes expressive search, not Reality, Meaning, or endpoint authority.

## Universal media law

```text
user media
→ multimodal evidence
→ RealityGraph
→ canonical Author
```

AI image generation is outside the production Author path. QRE may interpret supplied media, but it must not silently replace user reality with generated imagery.

## Experimental capabilities

These remain explicitly non-authoritative until a real consumer is proven:

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

They are capability reservoirs, not shadow Authors.

## Acceptance rule

Production acceptance exercises:

```text
authorBrainUniversal()
```

Component tests may diagnose individual helpers. They never establish production authority by themselves.

## Production law

```text
compile green
≠
production green

helper green
≠
production green

one model output green
≠
universal green

canonical path + authoritative gates + cross-domain acceptance
=
production confidence
```
