# QRE ASSET IDENTITY AND LEARNING SCOPE

**STATUS:** CURRENT / CANONICAL
**BRANCH:** `author/enterprise-realization-engine`

## Purpose

This document defines the non-negotiable distinction between a physical QRE asset, the people/accounts that administer it, the flows/experiences attached to it, and the evidence allowed to influence creative learning.

This exists specifically to prevent a future implementation from confusing **administrative ownership** with **creative identity**.

## 1. The physical product model

A QRE physical art piece — for example a keychain, tag, sticker, plaque, or other QR/NFC object — is an **Asset**.

The Asset is the current canonical QRE identity boundary for asset-scoped memory and creative learning.

```text
PHYSICAL QRE ART
      ↓
    ASSET
      ↓
   EXPERIENCES / FLOWS
      ↓
   RUNTIME OUTCOMES
      ↓
     LEARNING
```

A customer may buy multiple assets. Multiple assets may therefore belong to the same customer, company, team, or administrator without becoming one creative identity.

## 2. Account and ownership are administrative scopes

The database currently represents administrative relationships through fields such as:

```text
Asset.ownerId
Asset.accountId
User
AccountUser
```

These relationships answer questions such as:

```text
Who owns this asset?
Who can administer this asset?
Which organization/account is responsible for it?
Which users belong to the organization?
```

They do **not** answer:

```text
What does this asset's creative identity learn?
What creative preferences belong to this asset?
Which outcome should influence this asset's future authoring?
```

Therefore:

> **Administrative authority is not creative-learning authority.**

An organization may legitimately administer hundreds or thousands of assets belonging to many users. That must not cause those assets to share one undifferentiated creative-learning state.

### Enterprise example

A real-estate brokerage can have:

```text
ACCOUNT: Brokerage
│
├── User: Agent A
│    ├── Asset: Listing 101
│    └── Asset: Listing 102
│
├── User: Agent B
│    ├── Asset: Listing 201
│    └── Asset: Listing 202
│
└── User: Agent C
     └── Asset: Listing 301
```

The brokerage may administer every asset above. A successful creative outcome on Listing 101 must not automatically teach Listing 202 the same preference merely because both assets share an account.

## 3. Asset is the current creative-learning boundary

The canonical rule for the current architecture is:

```text
getCreativeLearningContext(assetId)
    → evidence for that asset

getAutonomousLearning(assetId)
    → outcomes for that asset

IdentityState(assetId)
    → learning projected from that asset
```

Learning services must not silently expand an asset-scoped query by discovering other assets through `ownerId`, `accountId`, `AccountUser`, or other administrative relationships.

The following pattern is forbidden:

```text
current asset
    ↓
find owner's/account's other assets
    ↓
aggregate their creative feedback/outcomes
    ↓
project that aggregate into current asset IdentityState
```

The correct current pattern is:

```text
current asset
    ↓
current asset evidence
    ↓
current asset outcomes
    ↓
current asset learning
    ↓
current asset IdentityState
```

## 4. User identity inside an event is attribution, not scope

Learning events may retain `userId` in event metadata.

That is useful for attribution:

```text
who recorded the preference?
who selected the variation?
who administered the asset?
```

It must not be interpreted as a scope-expansion instruction.

For example, if Agent A records creative feedback against Listing 101, that feedback belongs to Listing 101's learning population. Agent A's other listings do not become eligible merely because the same `userId` appears.

## 5. Flow and Experience are not the identity boundary

The database currently models Asset ↔ Flow through `AssetFlow`, and Asset/Flow can participate in `Experience` records.

This means a single asset can have multiple experiences, and a flow can potentially be associated with multiple assets.

Therefore:

```text
Flow ≠ Asset identity
Experience ≠ Asset identity
Account ≠ Asset identity
User ≠ Asset identity
```

A learning query must preserve the `assetId` of the actual runtime evidence it is using.

## 6. Shared worlds across multiple physical assets are a future explicit relationship

The current schema does **not** contain a canonical `identityId` or `worldId` relationship above Asset.

Therefore QRE must not simulate a shared world by using `accountId`, `ownerId`, or user membership.

A future product capability may deliberately support:

```text
WORLD / IDENTITY
      │
      ├── ASSET A — keychain
      ├── ASSET B — tag
      └── ASSET C — artwork
```

That would mean several physical objects are intentional entry points into the same persistent world. If introduced, the relationship must be explicit and separately authorized.

Until such a relationship exists in the data model, asset-scoped learning remains the canonical safe boundary.

## 7. Organizational learning is a separate future layer

QRE may eventually derive useful organization-level behavioral evidence, for example:

```text
Across 400 property listings,
short cinematic openings perform better.
```

That can be valuable, but it is not the same thing as an individual asset's identity learning.

It should eventually be represented as a separate, provenance-aware signal such as:

```text
IDENTITY LEARNING
ORGANIZATION LEARNING
EXPLICIT USER PREFERENCE
OBSERVED BEHAVIOR
WEAK EVIDENCE
HIGH-CONFIDENCE PATTERN
```

Organizational evidence must never masquerade as identity evidence by silently entering `creativeLearning` as though it came from the current asset.

## 8. Learning scope invariants

These invariants are mandatory:

1. **Asset ownership does not merge creative identities.**
2. **Account membership does not merge creative identities.**
3. **A user's administration of many assets does not merge creative identities.**
4. **A shared Flow does not merge Asset learning state.**
5. **Creative learning queries must be explicitly scoped to their authorized identity boundary.**
6. **Any future cross-asset learning must be an explicit product/domain relationship, not an inferred ownership relationship.**
7. **IdentityState must not contain learning evidence from unrelated assets.**
8. **A learning acceptance must prove isolation, not merely that learning occurred.**

## 9. Required regression behavior

The canonical isolation acceptance should demonstrate:

```text
ASSET A
  outcome → A learns courtroom

ASSET B
  outcome → B learns horror

reload A
  → courtroom present
  → horror absent

reload B
  → horror present
  → courtroom absent
```

The causal adaptive-learning acceptance should separately demonstrate:

```text
same asset
+ same underlying subject
+ same base prompt
+ real outcome A
        ↓
learning delta
        ↓
creative decision delta in Movie B
```

while the supplied factual reality remains unchanged.

## 10. Current schema fact

The current Prisma schema contains:

```text
User
Asset
Flow
AssetFlow
Experience
AnalyticsEvent
```

`Asset` has `ownerId` and `accountId`, but there is currently no first-class `identityId` or `worldId` on Asset.

Therefore the implementation must not claim that multiple assets share a persistent world unless and until that relationship is explicitly modeled.

## 11. Future Prisma/domain model — design now, implement later

**This section is a future blueprint, not a current migration. Do not add these fields/models until the current asset-scoped learning loop is green and the product requirement for shared identity is explicitly accepted.**

The clean future model is to introduce a first-class persistent identity/world above physical assets:

```text
Account / Organization
        │
        ├───────────────┐
        ↓               ↓
   Users/Admins     Identity / World
                         │
                 ┌───────┼────────┐
                 ↓       ↓        ↓
              Asset A  Asset B  Asset C
```

### Recommended future entities

Conceptually:

```text
Identity / World
- id
- accountId?              // organizational ownership, if appropriate
- name
- kind                    // person, pet, property, brand, event, memorial, etc.
- status
- createdAt
- updatedAt
```

```text
Asset
- id
- identityId?             // explicit relationship to shared world/identity
- ownerId                 // administrative ownership, retained
- accountId               // administrative organization, retained
- ...existing asset fields...
```

The exact model name (`Identity`, `World`, or another canonical domain term) should be decided once, then used consistently. **Do not add both `identityId` and `worldId` as competing concepts.** One relationship should own the semantic meaning.

### Optional future organizational learning model

Do not fold organization learning into Asset learning. A future organization-level projection may use a separate concept such as:

```text
OrganizationLearningSignal
- id
- accountId
- signalType
- evidenceCount
- confidence
- recurrence
- recency
- context
- pattern
- createdAt
- updatedAt
```

This is illustrative, not a locked schema. It exists to preserve the distinction:

```text
Asset identity evidence
        ≠
shared-world identity evidence
        ≠
organization evidence
```

### Future asset-to-identity rule

Once the relationship exists:

```text
Asset.identityId → Identity.id
```

then learning scope can become:

```text
asset-specific evidence
        ↓
Identity / World learning
        ↓
all assets explicitly belonging to that Identity / World
```

Only assets explicitly linked to the same Identity / World may share that learning.

An account, owner, user, or administrator relationship still does **not** imply shared identity.

### Migration requirement

When this is eventually implemented:

1. Every existing Asset must receive an explicit identity decision.
2. No historical learning may be merged merely because assets share `accountId`.
3. Backfill must be deterministic and auditable.
4. Learning queries must use the new identity relationship explicitly.
5. Organization-level learning must remain separately typed and provenance-aware.
6. Regression tests must cover both multi-asset shared identity and enterprise isolation.

Until that migration is complete, `Asset.id` remains the safe learning boundary.

## 12. Future learning provenance and richness

The eventual compact learning contract feeding the Author/Mouth should not reduce all evidence to a single undifferentiated string.

The durable learning record should be conceptually capable of representing:

```text
WHAT HAPPENED
WHAT WAS SELECTED
WHAT SUCCEEDED
WHAT FAILED
CONFIDENCE
RECURRENCE
RECENCY
CONTEXT
SCOPE
SOURCE
```

The key provenance dimensions are:

```text
scope:
  asset | identity | organization

source:
  explicit_user | observed_behavior | runtime_outcome | system_inference

confidence:
  numeric bounded value

recurrence:
  count / repeat pattern

recency:
  latest evidence timestamp / decay signal

context:
  the conditions under which the evidence was observed
```

This allows the Beast to distinguish:

```text
USER SAID THEY LIKED THIS
```

from:

```text
THIS PATTERN WON REPEATEDLY
```

from:

```text
THIS PATTERN WORKED IN THIS CONTEXT
```

from:

```text
THIS IS A WEAK INFERENCE
```

The richer evidence should be projected into the compact Mouth-facing contract rather than forcing the Mouth to reconstruct provenance from arbitrary strings.

## 13. IdentityState → Author → Mouth projection

The complete future learning path is:

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
Final viewer-facing language
```

The Mouth should receive only **approved, relevant, compact learning pressure**. It should not receive raw analytics, account membership, database identifiers, or unfiltered organization-wide evidence.

The projection should preserve enough provenance for the Author to know the difference between:

```text
EXPLICIT PREFERENCE
OBSERVED WINNER
REPEATED PATTERN
WEAK SIGNAL
ORGANIZATION SIGNAL
SHARED-WORLD SIGNAL
```

but should remain compact enough that learning does not drown out reality, current prompt intent, subject facts, or the current creative task.

### Mouth eligibility rule

Before a learning signal reaches the Mouth-facing contract, QRE should answer:

```text
1. Is this signal authorized for this identity?
2. Is it about the current subject / experience context?
3. Is the evidence strong enough to matter?
4. Is it recent or recurrent enough to remain relevant?
5. Does it conflict with current supplied reality?
6. Does it constrain creative choice or merely provide optional pressure?
```

The Mouth never gets to reinterpret a learning signal as factual reality.

Learning can influence:

```text
lens
pressure
novelty
trajectory
selection bias
creative emphasis
```

Learning cannot create:

```text
new facts
new events
new people
new outcomes
new chronology
```

## 14. Non-negotiable mental model

When debugging future learning behavior, reason in this order:

```text
WHO MAY ADMINISTER IT?
        ↓
owner / account / user membership

WHAT PHYSICAL QR IDENTITY IS THIS?
        ↓
Asset

WHAT EXPERIENCE RAN?
        ↓
Flow / Experience

WHAT ACTUALLY HAPPENED?
        ↓
AnalyticsEvent / normalized outcome

WHAT MAY THIS IDENTITY LEARN?
        ↓
Asset-scoped learning today
Identity/World learning only when explicitly modeled later

WHAT MAY THE ORGANIZATION LEARN?
        ↓
Separate organization-level evidence later

WHAT REACHES THE MOUTH?
        ↓
IdentityState / approved learning contract
```

Never replace the middle question with the first one.
