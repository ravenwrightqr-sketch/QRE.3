# QRE COMPLETION TRAJECTORY — CANONICAL

## Rule

Do not add another brain, timeline owner, persistence system, or lens system while a lower-level bridge is incomplete. Every significant bridge gets an acceptance and an architecture-index entry.

## Current status

### GREEN

- Contracts / Engine / API build chain.
- IdentityState and CognitiveAuthorContext.
- Live media ingestion: Knowledge image evidence → MediaAsset/CognitiveAuthorMedia → context → MovieBeatPlan.
- Live provenance: IdentityState facts → provenance packet → Mouth → Provenance Gate.
- Known memory-route learning bypass → AuthorLearningLoop.
- Knowledge deterministic evidence → AuthorLearningLoop.
- Canonical behavioral outcome taxonomy.
- Learned-lens consumer inside the existing author pipeline.
- Universal author regression suite.

### IN PROGRESS

- Complete audit of every user/guest/staff reality-bearing input route.
- Real runtime outcome → IdentityState → materially different next experience proof.
- True candidate-level learned-pressure competition inside `authorMovieCognition`.
- Owner/operator reporting.

## Outcome + adaptive bridge

Runtime already records outcome events. The behavioral learning layer now consumes one canonical event taxonomy, and the author consumes resulting creative learning through a bounded learned-lens preference:

```text
runtime outcome
→ AnalyticsEventTypes
→ normalizeExperienceOutcome()
→ autonomousLearning
→ IdentityState.creativeLearning
→ CognitiveAuthorContext.creativeLearning
→ authorCreativeLearningPressure
→ learned preferred lens when neutral/default
→ existing authorMovieCognition
→ Mouth
```

Rules:

- learned preference is bounded and soft relative to explicit intent;
- explicit non-neutral lens intent wins;
- rejected/avoided lenses cannot become learned winners;
- creative learning never changes reality or provenance;
- no second lens engine is introduced.

The current acceptance proves the consumer bridge. It does **not** yet prove true candidate-level re-ranking or the full persisted Movie A → outcome → Movie B loop.

Acceptance:

```powershell
pnpm --filter @qre/api author:outcome-learning
pnpm --filter @qre/api author:adaptive-learning
```

## 1. Live media ingestion — GREEN

```text
Knowledge image
→ authorMediaSource
→ authorMediaBridge
→ CognitiveAuthorContext.media
→ MovieBeatPlan
→ silent photo beat
```

## 2. Live provenance — GREEN

```text
IdentityState.canonicalFacts
→ authorProvenanceSource
→ AuthorRealityProvenance
→ CognitiveAuthorContext.provenanceFacts
→ Provenance Gate
```

## 3. Universal input learning — IN PROGRESS

```text
accepted reality input
→ one learning authority
→ MemoryRepository + AnalyticsRepository
→ next IdentityState
```

Known routes already normalized: `/experience/memory/:assetId` and Knowledge writes. Remaining routes require audit/classification.

## 4. Post-play outcome learning — IN PROGRESS

Required production proof:

```text
Movie A
→ real completion/replay/abandon/save/share/CTA/etc.
→ canonical outcome normalization
→ behavioral/creative learning
→ IdentityState
→ CognitiveAuthorContext
→ Movie B
```

Movie B must materially change because of newly observed outcome evidence, not because the prompt changed.

The immediate next hardening is to move learned pressure from preferred-lens injection into the **existing hypothesis score inside `authorMovieCognition`**, keeping the same catalog and same author owner.

## 5. Owner/operator reporting — TODO

Minimum useful signals:

- accepted evidence
- state changes / recurrence
- creative accept/reject patterns
- winning/weak lenses
- replay/completion/friction
- CTA performance when configured
- media contributions
- provenance rejects
- identity confidence
- learned creative pressure

## 6. Mouth / lens hardening — AFTER THE ABOVE

Do not add a new lens engine.

Target pipeline:

```text
REAL FACTS
→ approved meaning / relationship
→ existing lens search
→ learned pressure inside existing hypothesis competition
→ candidate realization
→ reality gate
→ meaning execution gate
→ attention-cut gate
→ creative-lock gate
→ diversity gate
→ beam / best line
```

Fallback is an emergency safety rail, not the preferred winner.

## Architecture rules

1. One universal brain.
2. One canonical author context.
3. One timeline owner: `MovieBeatPlan`.
4. One durable memory truth layer: `MemoryRepository`.
5. One learning authority for accepted inputs and eventual outcome write-back.
6. No direct reality writes bypass learning unless explicitly classified as infrastructure.
7. No second lens engine.
8. Photo beats are silent by default.
9. Business CTA is opt-in.
10. Learning changes future selection, never historical reality.
11. Explicit Knowledge is deterministic evidence, not model-generated interpretation.
12. Every bridge gets an acceptance and an index entry.
13. Canonical `AnalyticsEventTypes` own the runtime outcome vocabulary.
14. Learned creative pressure is soft preference; explicit authoring intent remains authoritative.

## Known next-level cleanup

`authorMovieCognition.ts` and `authorCreativeLenses.ts` currently contain overlapping lens catalogs. Do not add another. Consolidate during the dedicated Mouth/lens phase after adaptive learning is fully acceptance-covered.

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
