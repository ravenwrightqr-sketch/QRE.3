# QRE AUTHOR ARCHITECTURE INDEX

**STATUS:** CURRENT / CANONICAL
**AUDIT SNAPSHOT:** `audit/mouth-production-sync`
**AUTHORITY:** This file defines the current semantic ownership map. Historical/idea documents do not override it.

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
REALIZATION STRATEGY
    ↓
MOUTH CANDIDATES
    ↓
LANGUAGE + REALITY GATES
    ↓
SEQUENCE BEAM
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

Trajectory search is a supported semantic capability but is **not yet declared a canonical production stage** until its complete endpoint/consumer wiring is verified in the live Master Author.

## 2. CANONICAL OWNERS

| Concern | Canonical owner | Status |
|---|---|---|
| Source truth / evidence graph | `apps/api/src/services/authorRealityGraph.ts` | ACTIVE |
| Cognition / character read | `apps/api/src/services/authorCognition.ts` | ACTIVE |
| Latent movie search | `apps/api/src/services/authorLatentMovieSearch.ts` | ACTIVE |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` | ACTIVE |
| Master Author orchestration | `apps/api/src/services/authorBrainUniversal.ts` | ACTIVE |
| Meaning Spine | `apps/api/src/services/authorMeaningSpine.ts` | ACTIVE |
| Realization Slots | `apps/api/src/services/authorMouthRealizationSlot.ts` | ACTIVE |
| Realization strategy selection | `apps/api/src/services/authorRealizationStrategyLattice.ts` | SUPPORT → PROMOTION TARGET |
| Mouth semantic contract | `packages/contracts/src/cogauthor/mouth.ts` | CANONICAL |
| Mouth strategy / safety contract types | `packages/contracts/src/authoringIntelligence.ts` | SHARED AUTHORING CONTRACT / CONSUMER AUDIT |
| Mouth candidate generation/scoring | `apps/api/src/services/authorMouthCandidateSearch.ts` | ACTIVE |
| Mouth language gate | `apps/api/src/services/authorMouthLanguageGate.ts` | ACTIVE |
| Mouth attention gate | `apps/api/src/services/authorMouthAttentionGate.ts` | ACTIVE |
| Mouth quality adaptation | `apps/api/src/services/authorMouthQualityAdapter.ts` | ACTIVE / HARDENED |
| Grounded fallback | `apps/api/src/services/authorMouthGroundedFallback.ts` | ACTIVE / SAFETY RAIL |
| Mouth repair objectives | `apps/api/src/services/authorMouthRepairPlanner.ts` | SUPPORT |
| Mouth sequence selection | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | ACTIVE |
| Attention Editor | `apps/api/src/services/authorAttentionEditor.ts` | ACTIVE |
| Truth / cut policy | `apps/api/src/services/authorBeatTruthGate.ts` + `apps/api/src/services/authorCutPolicy.ts` | ACTIVE |
| Sequence arc gate | `apps/api/src/services/authorSequenceArcGate.ts` | ACTIVE |
| Model transport | `apps/api/src/services/localModelRuntime.ts` | ACTIVE |
| Trajectory search | `apps/api/src/services/authorTrajectorySearch.ts` | CANDIDATE / NOT YET WIRED |

## 3. CONTRACT AUTHORITY

Canonical COGAUTHOR Author contracts live in:

```text
packages/contracts/src/cogauthor/
```

The public package barrel is:

```text
packages/contracts/src/index.ts
    ↓
packages/contracts/src/cogauthor/index.ts
```

Current COGAUTHOR authorities include:

```text
cogauthor/authorBrain.ts
cogauthor/cognition.ts
cogauthor/latentMovie.ts
cogauthor/realityGraph.ts
cogauthor/mouth.ts
```

`packages/contracts/src/authoringIntelligence.ts` currently owns broader domain-neutral authoring strategy/lens/safety/model contracts and supplies `AuthorRealizationStrategy` / `AuthorStrategyCandidate` consumed by the existing realization strategy lattice. Relocation into COGAUTHOR is a consumer-audit decision, not an assumption.

No service may create a competing semantic contract for an existing concept.

## 4. TRUTH BOUNDARY

Reality is immutable.

Allowed:

```text
fact → factual realization
fact + supported relation → interpretation
supplied contradiction → creative framing
supplied object → changed meaning
```

Not allowed in reality-locked mode:

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

Creative lenses change framing. They do not create reality.

## 5. MOUTH CONTRACT

The Mouth receives an approved realization job plus source evidence.

It does **not** decide:

```text
reality
movie
meaning
endpoint
sequence architecture
```

The production evolution is:

```text
Realization Slot
→ safe realization strategy
→ language candidates
→ truth / language gates
→ semantic scoring
→ whole-sequence Beam
```

The model supplies wording only. QRE owns truth, semantic legality, sequence selection, endpoint integrity, and final gating.

## 6. SEQUENCE LAW

One viewer-facing message normally performs one dominant cut.

A successful sequence must create movement:

```text
CUT
→ viewer state changes
→ something remains unresolved
→ next CUT becomes desirable
→ payoff lands
```

A list of facts chopped into separate lines is not a movie.

## 7. ENTERPRISE MOUTH STATUS

`apps/api/src/services/authorEnterpriseMouth.ts` is an acceptance-oriented alternate orchestration over canonical Mouth primitives. It is **NOT** the canonical production Mouth path because `authorBrainUniversal.ts` does not consume it.

Useful capabilities from that cluster are migration candidates only:

```text
strategy selection
cumulative meaning
safety
bounded budgets
cross-domain fixtures
surprise diagnostics
```

Duplicate orchestration must retire after useful capabilities are migrated and verified in canonical owners.

## 8. ACCEPTANCE RULE

Production acceptance must exercise `authorBrainUniversal.ts`.

Helper-level acceptance diagnoses components; it does not establish production authority.

## 9. FILE STATUS STANDARD

Every audited file is classified exactly one of:

```text
CANONICAL
SUPPORT
ACCEPTANCE
STRATEGY / IDEATION
HISTORICAL
LEGACY
ORPHAN
UNDER AUDIT
```

Names containing `enterprise`, `monster`, `v2`, `v3`, `final`, or `fixed` do not confer authority.

## 10. DEFINITION OF DONE

The Author is production-ready when unfamiliar reality can travel through one coherent path:

```text
reality
→ interesting interpretation
→ differentiated movie
→ deliberate beat graph
→ realization strategy
→ strong Mouth
→ sequence search
→ attention / truth / cut
→ complete payoff
→ final scenes
```

The standard is not merely green tests. The standard is excellent, grounded, complete, repeatable output across unrelated industries.
