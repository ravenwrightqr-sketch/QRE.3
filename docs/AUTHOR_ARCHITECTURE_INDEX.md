# QRE AUTHOR ARCHITECTURE INDEX

**STATUS:** CURRENT / CANONICAL
**BRANCH:** `author/enterprise-realization-engine`
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
| Mouth semantic contract | `packages/contracts/src/experience/mouth.ts` | ACTIVE CONTRACT / MIGRATION IN PROGRESS |
| Mouth candidate generation/scoring | `apps/api/src/services/authorMouthCandidateSearch.ts` | ACTIVE |
| Mouth sequence selection | `apps/api/src/services/authorMouthSequenceBeamSearch.ts` | ACTIVE |
| Mouth language gate | `apps/api/src/services/authorMouthLanguageGate.ts` | ACTIVE |
| Mouth attention gate | `apps/api/src/services/authorMouthAttentionGate.ts` | ACTIVE |
| Mouth quality adaptation | `apps/api/src/services/authorMouthQualityAdapter.ts` | ACTIVE / HARDENED |
| Grounded fallback | `apps/api/src/services/authorMouthGroundedFallback.ts` | ACTIVE / SAFETY RAIL |
| Attention Editor | `apps/api/src/services/authorAttentionEditor.ts` | ACTIVE |
| Truth / cut policy | `apps/api/src/services/authorBeatTruthGate.ts` + `apps/api/src/services/authorCutPolicy.ts` | ACTIVE |
| Sequence arc gate | `apps/api/src/services/authorSequenceArcGate.ts` | ACTIVE |
| Model transport | `apps/api/src/services/localModelRuntime.ts` | ACTIVE |
| Trajectory search | `apps/api/src/services/authorTrajectorySearch.ts` | CANDIDATE / NOT YET WIRED |

## 3. CONTRACT AUTHORITY

Canonical Author contracts live in `packages/contracts/src/experience/`.

Current verified authorities include:

```text
packages/contracts/src/experience/authorBrain.ts
packages/contracts/src/experience/realityGraph.ts
packages/contracts/src/experience/latentMovie.ts
packages/contracts/src/experience/cognition.ts
packages/contracts/src/experience/mouth.ts
```

No service may create a competing semantic contract for an existing concept.

Any type shared across Author services must either come from `@qre/contracts` or be demonstrably private to one implementation.

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

The Mouth receives approved meaning and source evidence.

It does **not** decide:

```text
reality
movie
meaning
endpoint
sequence architecture
```

It proposes language, then QRE evaluates:

```text
truth
meaning execution
relation execution
attention
next-cut pull
novelty
compression
repetition
endpoint exactness
```

Fallback is an emergency safety rail, not the desired creative winner.

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

`apps/api/src/services/authorEnterpriseMouth.ts` currently implements a **separate acceptance-oriented orchestration path** around the same Mouth primitives.

It is **NOT** the canonical production Mouth path because `authorBrainUniversal.ts` does not consume it.

Enterprise-specific helpers are therefore classified as:

```text
USEFUL CAPABILITY → audit for migration into canonical owners
DUPLICATE ORCHESTRATION → retire
ACCEPTANCE DATA → retain only where it tests the canonical path
```

The old Enterprise architecture documents have been retired from current authority.

## 8. ADAPTER / RECOVERY RULE

Recovery and adapters may translate existing approved meaning into canonical shapes.

They may not invent an alternate story or bypass the canonical gates.

## 9. ACCEPTANCE RULE

A production acceptance must exercise `authorBrainUniversal.ts`.

A diagnostic may test a helper in isolation, but its result cannot be called production green unless the canonical Master Author consumes it.

## 10. FILE STATUS STANDARD

Every audited file is classified as exactly one of:

```text
CANONICAL
SUPPORT
ACCEPTANCE
STRATEGY / IDEATION
HISTORICAL
LEGACY
ORPHAN
```

Names containing `enterprise`, `monster`, `v2`, `v3`, `final`, or `fixed` do not confer authority.

## 10A. ASSET IDENTITY / LEARNING SCOPE

QRE has a strict distinction between administrative scope and creative identity scope.

The physical QRE art piece is an `Asset`. `Asset.ownerId`, `Asset.accountId`, `User`, and `AccountUser` define ownership, administration, and organizational membership. They do **not** silently define a shared creative identity.

Current canonical rule:

```text
administration / ownership
    ≠
creative learning identity
```

For the current schema, `Asset.id` is the explicit identity boundary for asset-scoped creative learning. `creativeLearning.ts` and `autonomousLearning.ts` must therefore remain scoped to the requested asset and must not aggregate other assets merely because they share an owner, user, or account.

A real-estate brokerage, enterprise team, or other organization may legitimately administer many users' assets without merging those assets' creative learning.

The current schema has **no first-class `identityId` or `worldId` above Asset**. Any future shared-world behavior across multiple physical assets must be modeled as an explicit domain relationship; it must not be inferred from `accountId` or `ownerId`.

Canonical detail and regression requirements live in:

`docs/ASSET_IDENTITY_AND_LEARNING_SCOPE.md`

## 10B. ASSET-FIRST PRODUCT / DASHBOARD MODEL

The user-facing product is asset-first, not database-first.

```text
PHYSICAL QRE ART
    ↓
ASSET
    ↓
EXPERIENCES / FLOWS
    ↓
RUNTIME / ANALYTICS
    ↓
ASSET-SCOPED LEARNING
```

A customer may buy multiple physical QRE assets. Each purchase is its own `Asset` and its own QR/NFC identity. A customer may connect multiple experiences to an asset, and the existing `AssetFlow` relationship means flows/experiences are not themselves the asset identity boundary.

The dashboard should therefore expose the simple product concepts first:

```text
Personal user
  → My Assets
  → Experiences on each Asset
  → Results / activity

Organization / administrator
  → Organization
  → Managed Assets
  → Users / assignments / permissions
  → Asset activity and organization-level reporting
```

An administrator may manage assets belonging to many users. This is an **administrative capability**, not a reason to merge their creative learning.

The same asset-centric dashboard model should work for a solo customer and an enterprise such as a real-estate brokerage. Enterprise UX adds management, assignment, permissions, and organization reporting around assets rather than creating a separate semantic identity model.

Do not expose `ownerId`, `accountId`, `AssetFlow`, or other persistence details as the primary user mental model. Those are implementation/administration structures behind the simple concepts of **who manages it, what asset it is, what experience it runs, and what happened**.

## 10C. FUTURE SHARED-WORLD / ORGANIZATIONAL LEARNING

Two future capabilities must remain explicit and separate from current asset learning:

```text
SHARED WORLD / IDENTITY LEARNING
  → intentionally shared by multiple physical assets

ORGANIZATIONAL LEARNING
  → aggregated behavioral evidence across an authorized organization
```

Neither capability exists merely because assets share `accountId`, `ownerId`, `userId`, or administrative membership. Until a first-class authorization/relationship is modeled, current creative learning remains asset-scoped.

## 10D. FUTURE PRISMA / DOMAIN BLUEPRINT

**DESIGN-ONLY. NOT A CURRENT MIGRATION.**

When the product explicitly requires multiple physical assets to participate in one persistent world, introduce one canonical first-class identity relationship rather than inventing parallel `identityId` and `worldId` semantics.

Conceptual target:

```text
Account / Organization
        │
        ├── Users / Admins
        │
        └── Identity / World
                │
                ├── Asset A
                ├── Asset B
                └── Asset C
```

Likely shape:

```text
Identity / World
- id
- accountId?
- name
- kind
- status
- createdAt
- updatedAt
```

```text
Asset
- identityId?
- ownerId
- accountId
- ...existing fields...
```

Do not add both `identityId` and `worldId` as competing semantic relationships. Pick one canonical domain concept when the feature is actually implemented.

If organization-wide learning is later required, model it as separately scoped evidence rather than putting it into Asset learning. Any schema for that layer must carry authorization, provenance, confidence, recurrence, recency, and context.

## 10E. LEARNING → MOUTH PROJECTION

The full adaptive path must remain explicit:

```text
REALITY / RUNTIME EVENT
        ↓
AnalyticsEvent
        ↓
Outcome normalization
        ↓
Learning aggregation
        ↓
Scope + provenance + confidence
        ↓
Identity-scoped projection
        ↓
IdentityState.creativeLearning
        ↓
Cognitive Author Context
        ↓
Semantic eligibility / learned pressure
        ↓
Movie / meaning / realization decisions
        ↓
Mouth candidates
        ↓
Truth + meaning + attention gates
        ↓
FINAL LANGUAGE
```

The Mouth receives **approved learning pressure**, not raw analytics or administrative data.

Learning may influence creative choice such as:

```text
lens
pressure
novelty
trajectory
selection bias
creative emphasis
```

Learning may never create or rewrite factual reality:

```text
new person
new object
new location
new action
new outcome
new chronology
```

The richer future learning record should preserve:

```text
what happened
what was selected
what succeeded
what failed
confidence
recurrence
recency
context
scope
source
```

The Mouth-facing contract should be a compact projection of that evidence, with provenance retained enough to distinguish explicit preference, observed winner, repeated pattern, weak signal, shared-world signal, and organization signal.

## 11. DEFINITION OF DONE

The Author is production-ready when unfamiliar reality can travel through one coherent path:

```text
reality
→ interesting interpretation
→ differentiated movie
→ deliberate beat graph
→ strong momentum
→ excellent Mouth
→ truth-safe final scenes
```

The standard is not merely green tests. The standard is that the final viewer-facing sequence is excellent, grounded, complete, and repeatably produced across unrelated industries.

For the complete Asset, future Prisma, learning provenance, and Mouth projection rules, use:

`docs/ASSET_IDENTITY_AND_LEARNING_SCOPE.md`
