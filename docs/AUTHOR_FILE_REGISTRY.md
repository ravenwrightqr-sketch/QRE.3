# QRE AUTHOR FILE REGISTRY

**STATUS:** CANONICAL AUDIT REGISTRY
**AUDIT:** 2026-08-20 · `audit/mouth-production-sync`

This is the sectional map of every current Author-related service in `apps/api/src/services`. A file earns CANONICAL status only when its owner, contract, consumers, and production acceptance responsibility are explicit.

## 01 · CANONICAL PRODUCTION PATH

| Status | File | Owns |
|---|---|---|
| CANONICAL | `authorBrainUniversal.ts` | sole production Author orchestration |
| CANONICAL | `authorRealityGraph.ts` | immutable source/evidence graph |
| CANONICAL | `authorCognition.ts` | cognition, character read, movie hypothesis search |
| CANONICAL | `authorLatentMovieSearch.ts` | latent movie hypothesis generation |
| CANONICAL | `authorLatentMovieConvergence.ts` | deterministic graph convergence support used by movie search |
| CANONICAL | `authorMovieDifferentiation.ts` | material movie diversity |
| CANONICAL | `authorMeaningSpine.ts` | semantic beat meaning |
| CANONICAL | `authorMouthRealizationSlot.ts` | semantic-to-language realization boundary |
| CANONICAL | `authorRealizationStrategyLattice.ts` | Approach-B safe realization strategy selection; promotion into live Mouth path is next |
| CANONICAL | `authorMouthCandidateSearch.ts` | canonical Mouth generation, normalization, scoring, bounded repair |
| CANONICAL | `authorMouthSequenceBeamSearch.ts` | deterministic sequence optimization |
| CANONICAL | `authorAttentionEditor.ts` | sequence accumulation / attention evaluation |
| CANONICAL | `authorBeatTruthGate.ts` | beat-level truth protection |
| CANONICAL | `authorCutPolicy.ts` | final cut legality, grounding, density, repetition |
| CANONICAL | `authorSequenceArcGate.ts` | sequence-level arc/payoff gate |
| CANONICAL | `localModelRuntime.ts` | model transport only; no semantic authority |

## 02 · CANONICAL SUPPORT / INPUT INTELLIGENCE

| Status | File | Role |
|---|---|---|
| SUPPORT / CANONICAL | `authorBeatPlanRecovery.ts` | deterministic recovery of a selected latent movie into BeatPlan semantics |
| SUPPORT / AUDIT | `authorCharacterLensEngine.ts` | character/lens interpretation capability; must not create a second author |
| SUPPORT / AUDIT | `authorEvidenceFusion.ts` | evidence fusion capability; production consumer trace required |
| SUPPORT / AUDIT | `authorMemoryIntelligence.ts` | living-memory intelligence capability; must feed Reality/evidence, not prose |
| SUPPORT / AUDIT | `authorMultimodalEvidence.ts` | user media/evidence capability; media is source evidence, not generated reality |
| SUPPORT / AUDIT | `authorModelRouter.ts` | model selection/routing capability; transport only |
| SUPPORT / AUDIT | `authorTruth.ts` | broader Author truth helper; consumer ownership must remain explicit |
| SUPPORT / AUDIT | `aiProvider.ts` | provider adapter / media understanding compatibility path; must not become a second Author |

## 03 · CREATIVE CAPABILITY / NOT A SECOND AUTHOR

| Status | File | Role |
|---|---|---|
| SUPPORT / UNWIRED | `authorMouthCreativeLock.ts` | framing universes; may alter expression only, never reality/meaning/endpoint |
| SUPPORT / EXPERIMENTAL | `authorLatentStoryThesis.ts` | structural thesis extraction; not canonical until a live downstream consumer is proven |
| SUPPORT / EXPERIMENTAL | `authorCreativeSearch.ts` | creative-search capability; no production authority |
| SUPPORT / EXPERIMENTAL | `authorCounterfactualSearch.ts` | counterfactual capability; never allowed to rewrite Reality |
| SUPPORT / EXPERIMENTAL | `authorTrajectorySearch.ts` | reusable trajectory capability; not canonical until endpoint and consumer wiring are proven |
| SUPPORT / EXPERIMENTAL | `pureLatentStoryThesisAcceptance.ts` | isolated acceptance for thesis capability |
| SUPPORT / EXPERIMENTAL | `pureUniversalCognitionAcceptance.ts` | isolated cognition acceptance |

## 04 · ADAPTERS / PRODUCT INTEGRATION

| Status | File | Role |
|---|---|---|
| ADAPTER | `microBeatMouth.ts` | runtime projection into canonical Author; no independent author |
| ADAPTER | `cinematicAuthor.ts` | rendering/cinematic adapter; no independent author |
| SUPPORT | `creativeLearning.ts` | learned taste/preferences; soft guidance only, never source truth |
| SUPPORT | `autonomousLearning.ts` | learning infrastructure; must not alter truth or author authority silently |
| SUPPORT | `creativeSeedEngine.ts` | creative seed support; must remain upstream capability, not Mouth authority |
| SUPPORT | `entityMemoryService.ts` | persistent entity memory infrastructure |
| SUPPORT | `memoryProjection.ts` | memory projection infrastructure |
| PRODUCT | `experienceCreationServices.ts` | product-level creation orchestration; must delegate to canonical Author |
| PRODUCT | `experienceService.ts` | product experience service; canonical Author remains creative authority |

## 05 · RETIRED IN THIS AUDIT

The following were proven to be a non-canonical duplicate Mouth/quality stack and were removed:

```text
apps/api/src/services/authorEnterpriseAdversarialMatrix.ts
apps/api/src/services/authorEnterpriseIntelligence.ts
apps/api/src/services/authorEnterpriseMouth.ts
apps/api/src/services/authorEnterpriseMouthAcceptanceMatrix.ts
apps/api/src/services/authorEnterpriseMouthPolicy.ts
apps/api/src/services/authorEnterpriseRuntime.ts
apps/api/src/services/authorEnterpriseSafety.ts
apps/api/author-enterprise-mouth-acceptance.ts
apps/api/src/services/authorMouthQualityAdapter.ts
apps/api/src/services/authorMouthGroundedFallback.ts
apps/api/src/services/authorMouthLanguageGate.ts
apps/api/src/services/authorMouthAttentionGate.ts
apps/api/src/services/authorMouthRepairPlanner.ts
apps/api/src/services/authorCumulativeMeaning.ts
apps/api/src/services/authorLatentMovieBeatAdapter.ts
```

Their responsibilities were either duplicate orchestration or support code used only by the retired Enterprise path. The canonical Mouth already owns candidate generation, scoring, bounded repair, attention evaluation, truth protection, and final cut gating.

## 06 · CONTRACTS

Canonical shared semantic contracts live under:

```text
packages/contracts/src/cogauthor/
```

The canonical Mouth contract now explicitly carries:

```text
MouthCandidateBeat.realizationStrategies
```

so Approach B can cross the semantic-to-language boundary without inventing a parallel contract namespace.

## 07 · APPROACH-B PRODUCTION TARGET

The intended live machine is now:

```text
Reality
  ↓
Cognition
  ↓
Latent Movie
  ↓
Meaning Spine
  ↓
Realization Slot
  ↓
SAFE STRATEGY LATTICE
  ↓
CANONICAL MOUTH GENERATION OWNER
  ↓
DETERMINISTIC BEAM
  ↓
ATTENTION
  ↓
TRUTH / CUT
  ↓
SEQUENCE ARC
  ↓
FINAL SCENES
```

There is no second Mouth. Creative capability can multiply; semantic authority cannot.

## 08 · UNIVERSAL MEDIA LAW

User-supplied media is evidence:

```text
USER MEDIA
→ MEDIA UNDERSTANDING
→ EVIDENCE / REALITY
→ CANONICAL AUTHOR
→ MOUTH
```

AI image generation is not part of the canonical author path. Uploaded before/after photos, clips, audio, and other media remain user-owned source reality.

## 09 · FILE STATUS LAW

Every Author-related file must be exactly one of:

```text
CANONICAL
SUPPORT / CANONICAL
SUPPORT / AUDIT
SUPPORT / EXPERIMENTAL
ADAPTER
PRODUCT
RETIRED
```

No silent Author files. Names do not confer authority.

## 10 · DAILY ALIGNMENT CHECK

Every change cluster ends with:

```text
CODE
↔ IMPORTS / CONSUMERS
↔ @qre/contracts
↔ AUTHOR WIRING MAP
↔ THIS REGISTRY
↔ ACCEPTANCE
↔ ARCHITECTURE GUARD
```
