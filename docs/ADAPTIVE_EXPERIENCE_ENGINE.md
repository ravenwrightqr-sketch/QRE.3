# QRE UNIVERSAL ADAPTIVE EXPERIENCE ENGINE

**STATUS:** CURRENT / CANONICAL
**BRANCH:** `author/enterprise-realization-engine`

## Purpose

QRE is a universal experience engine, not a one-shot content generator.

Any person, business, organization, or other authorized entity may create an experience around a real subject, goal, project, memory, ambition, event, place, product, or other domain. That experience may observe outcomes over time, learn from them, change its future behavior, and re-engage the participant indefinitely.

The product goal is:

```text
CREATE EXPERIENCE
      ↓
RUN EXPERIENCE
      ↓
OBSERVE REAL WORLD RESPONSE
      ↓
LEARN
      ↓
ADAPT
      ↓
RE-ENGAGE
      ↓
RUN AGAIN
      ↓
LEARN AGAIN
      ↓
FOREVER
```

"Forever" means the system is designed for an ongoing longitudinal loop. It does not mean unbounded retention, unbounded context, or unrestricted inference; durable evidence must be scoped, summarized, confidence-aware, and governed by the appropriate identity and organization boundaries.

## 1. Universal experience examples

The same engine must support radically different experiences without creating a separate learning architecture for each industry.

Examples:

```text
PERSON
  travel / hiking / states vision board
  → tracks progress
  → notices completed states
  → notices inactivity
  → learns what motivates the person
  → prompts the next useful action

PET
  living social dog tag
  → records interactions
  → learns recurring patterns
  → changes future experience emphasis

REAL ESTATE
  property experience
  → observes scans / completions / shares / CTA behavior
  → learns which presentation patterns perform
  → adapts future property experiences

RESTAURANT
  customer experience
  → observes replay / save / share / CTA behavior
  → learns which experience patterns work
  → changes future experiences
```

The domain changes. The adaptive loop does not.

## 2. There are multiple distinct scopes

QRE must never collapse these scopes:

```text
ORGANIZATION / ACCOUNT
  who may administer things

USER
  who is acting or recording evidence

IDENTITY / WORLD
  what persistent thing an experience is about

ASSET
  which physical/digital QRE entry point identifies or hosts it

EXPERIENCE / FLOW
  which particular experience realization runs

SESSION
  one participant/runtime instance

OUTCOME / OBSERVATION
  what actually happened

LEARNING
  what durable evidence should change future behavior
```

The current schema explicitly contains Account/User/Asset/Flow/Experience/analytics concepts, but it does **not** yet contain a first-class shared `Identity`/`World` model. Until that exists, asset-scoped learning remains the safe current boundary for asset-backed identity.

## 3. Asset is an entry point, not necessarily the eventual learner

For the current schema:

```text
PHYSICAL QRE ART
      ↓
    ASSET
```

An Asset may have many experiences, and the same Flow can potentially participate in multiple Asset relationships.

Therefore:

```text
Asset ≠ Flow
Asset ≠ Experience
```

For today's asset-backed learning seam, learning is scoped to the current Asset because that is the only explicit identity boundary available in the schema.

Future shared-world behavior may intentionally allow:

```text
IDENTITY / WORLD
       │
       ├── ASSET A — keychain
       ├── ASSET B — tag
       └── ASSET C — artwork
```

That future relationship must be explicit in the data model and authorization model.

## 4. Learning is longitudinal state, not merely a score

The long-lived learning system should eventually retain or derive, with provenance:

```text
what happened
what was selected
what succeeded
what failed
why the system believes it succeeded/failed
confidence
recurrence
recency
context
conditions
subject / identity scope
asset scope
experience / flow scope
source
```

The system should be able to distinguish evidence such as:

```text
EXPLICIT USER PREFERENCE
OBSERVED BEHAVIOR
RUNTIME OUTCOME
WEAK SIGNAL
REPEATED PATTERN
HIGH-CONFIDENCE PATTERN
ORGANIZATION-LEVEL OBSERVATION
```

These are not interchangeable.

## 5. Outcome learning is an analysis stage

The current outcome normalizer is intentionally pure:

```text
AnalyticsEventType
      ↓
normalizeExperienceOutcome()
      ↓
positive / negative / neutral
```

This is classification, not durable learning by itself.

Durable evidence currently lives in the existing analytics stream and related memory systems. `getAutonomousLearning()` analyzes the persisted events to derive behavioral patterns.

A future richer implementation may materialize summarized learning records, but it must preserve the raw evidence source and provenance rather than replacing it with opaque conclusions.

## 6. Adaptive behavior must become actionable

Learning is only operational when it changes what the system does.

The required causal chain is:

```text
OBSERVATION
    ↓
OUTCOME NORMALIZATION
    ↓
LEARNING DELTA
    ↓
PERSIST / RELOAD
    ↓
IDENTITY-SCOPED LEARNING CONTEXT
    ↓
AUTHOR DECISION CHANGES
    ↓
EXPERIENCE CHANGES
    ↓
PARTICIPANT RESPONSE
```

A test that merely shows a learning string exists is insufficient.

The production acceptance must demonstrate:

```text
same reality
same underlying subject
same base prompt
OUTCOME A
    ↓
learning changes
    ↓
Movie B creative decision changes
```

while the supplied reality remains unchanged.

## 7. Re-engagement is part of the engine

For longitudinal experiences such as goals, planning, habit-building, collections, learning, travel, or projects, the system must eventually support:

```text
progress observed
      ↓
state updated
      ↓
next useful action inferred
      ↓
participant prompted / experience re-opened
      ↓
response observed
```

A travel/hiking vision-board example may therefore evolve from:

```text
"Visit these states"
```

to an adaptive companion that can recognize:

```text
completed state
planned state
stalled state
recurring interest
preferred trip style
seasonal/contextual constraint
next useful action
```

This should be implemented as an adaptive experience loop, not as a separate hard-coded travel product.

## 8. Organization learning is separate

A brokerage or enterprise may legitimately manage many users and assets.

That gives the organization administrative scope, not permission to merge every identity's learning.

Later, the engine may derive organization-level patterns such as:

```text
Across 400 property experiences,
short cinematic openings have stronger completion rates.
```

That evidence must remain explicitly labeled as organization-level learning and must be selectively applied based on relevance and authorization.

It must not silently become one property's identity learning.

## 9. Future Prisma direction

When QRE implements explicit multi-asset shared identity, the likely model is conceptually:

```text
Identity / World
  id
  accountId?
  name
  kind
  status
  createdAt
  updatedAt

Asset
  id
  identityId?
  ownerId
  accountId
  ...existing fields...
```

The exact names and cardinalities are not yet locked. Do **not** add both `identityId` and `worldId` as competing concepts without a domain decision.

If organization-level learning is materialized, it should be a separate explicitly scoped record or projection rather than being mixed into Asset learning.

## 10. IdentityState and Mouth projection

Raw longitudinal evidence must not flow directly into language generation.

The intended path is:

```text
Analytics / Memory / Outcome evidence
          ↓
Scoped learning analysis
          ↓
Provenance + confidence + recurrence + recency
          ↓
IdentityState.creativeLearning
          ↓
Cognitive Author Context
          ↓
Semantic eligibility / learned pressure
          ↓
Movie / meaning / realization decisions
          ↓
Mouth
```

The Mouth receives only approved, compact, relevant learning pressure alongside source reality.

The Mouth must not decide whether an observation belongs to the identity, whether an organizational signal is authorized, or whether a fact is true.

## 11. Longitudinal product rule

QRE should optimize for:

```text
MORE USE
  → MORE OBSERVATION
  → BETTER LEARNING
  → BETTER ADAPTATION
  → MORE VALUE
  → MORE USE
```

The experience therefore becomes an accumulating relationship rather than a disposable generated artifact.

That loop is the universal engine.
