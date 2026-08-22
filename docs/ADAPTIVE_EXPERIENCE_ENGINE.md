# QRE UNIVERSAL ADAPTIVE EXPERIENCE ENGINE

**STATUS:** CURRENT / CANONICAL
**BRANCH:** `author/enterprise-realization-engine`

## Purpose

QRE is a universal, persistent experience engine. It is **not** a one-shot content generator, a story generator, or an industry-specific application.

Any authorized person, animal-caretaker, business, organization, service provider, or other entity may create a living experience around **anything that can have meaningful supplied reality, state, history, goals, relationships, events, or future possibilities**.

That includes people, animals, objects, places, products, properties, services, projects, memories, events, records, collections, artifacts, and combinations of these.

```text
PERSON
ANIMAL
OBJECT
PLACE
PRODUCT
PROPERTY
SERVICE
PROJECT
EVENT
MEMORY
RECORD
COLLECTION
ARTIFACT
RELATIONSHIP
OR ANY OTHER MEANINGFUL SUBJECT
```

Examples are not separate product categories. They are instances of one universal engine.

The same engine can create and operate:

```text
VIDEO RECEIPTS
SERVICE RECORDS
HOUSEKEEPING / CLEANING RECORDS
PET GROOMER EXPERIENCES
PET DAYCARE EXPERIENCES
PET / ANIMAL LIFE EXPERIENCES
REAL ESTATE PROPERTY EXPERIENCES
RESTAURANT EXPERIENCES
TRAVEL / HIKING / STATES VISION BOARDS
MEMORY EXPERIENCES
EVENT EXPERIENCES
LOYALTY / REWARD EXPERIENCES
PROJECT / GOAL EXPERIENCES
PRODUCT EXPERIENCES
EDUCATIONAL EXPERIENCES
PERSONAL / ORGANIZATIONAL WORKFLOWS
OBJECT / ARTIFACT EXPERIENCES
AND OTHER EXPERIENCES DERIVED FROM SUPPLIED REALITY
```

A generated artifact may be a video receipt, summary, scene sequence, service record, reminder, visual experience, interactive flow, object history, progress tracker, or another presentation. The artifact is only the current realization of a **living experience**; it is not necessarily the endpoint.

The domain changes. The engine does not.

An experience may observe reality over time, remember authorized evidence, learn from outcomes, ask useful questions when information is missing, adapt its future behavior, recommend or trigger the next useful action, and re-engage the participant or owner indefinitely.

The product goal is:

```text
CREATE EXPERIENCE
      ↓
RUN / DELIVER EXPERIENCE
      ↓
OBSERVE REAL WORLD RESPONSE
      ↓
UNDERSTAND STATE
      ↓
LEARN
      ↓
ADAPT
      ↓
INQUIRE WHEN INFORMATION IS MISSING
      ↓
ADVANCE THE PARTICIPANT / OWNER / EXPERIENCE WHEN A USEFUL NEXT STEP EXISTS
      ↓
RE-ENGAGE
      ↓
RUN AGAIN
      ↓
LEARN AGAIN
      ↓
FOREVER
```

"Forever" means the product is designed as a longitudinal loop rather than a disposable generated artifact. It does not mean unbounded retention, unbounded context, or unrestricted inference. Durable evidence remains scoped, summarized, confidence-aware, provenance-aware, and governed by the appropriate identity and organization boundaries.

## 1. Universal experience principle

QRE is a **general experience compiler/runtime/learning system**.

A user must not need a new product architecture merely because the subject changes.

The same underlying engine can turn supplied reality, history, goals, events, relationships, constraints, and context into a purpose-built experience and continue operating after the first output.

### Subject examples

```text
A PERSON
  can have goals, memories, plans, preferences, milestones, obstacles

AN ANIMAL
  can have care history, behavior, routines, milestones, observations,
  living memories, places visited, vacations, trips, walks, beaches,
  parks, groomer visits, veterinary visits, daycare visits, walking-service
  visits, social activity, presence updates, lost-mode state, rewards,
  owner notifications, and other authorized experiences.
  Multiple experiences can coexist around the same animal and accumulate
  into the same authorized long-term history.
, and living memories, of where, vacations, visits. anything. a social on and off data, one for vacation. one for lost mode. one for trips to dog groomer/vet/daycare/walking service and so on that can see presence and updates and change scan info to owner information and another button for lost mode reward./ call now for any updates on the animal.

A SURFBOARD
  can have an owner, purchase history, places surfed, repairs,
  trips, conditions, memories, photographs, and a story that grows

A CAR
  can have service history, trips, maintenance, ownership changes,
  memories, expenses, and future care needs. The same long-term model can
apply to parks, beaches, homes, vehicles, products, tools, artwork,
surfboards, collectibles, or any other object or subject with meaningful
history.


A HOUSE
  can have residents, repairs, renovations, events, memories,
  service history, and future maintenance

A PROPERTY LISTING
  can have facts, presentation history, audience interactions,
  performance outcomes, future listing changes, media, video receipts,
knowledge records, follow-ups, prompts, recommendations, and any other
experience QRE can create from authorized reality.


A SERVICE JOB
  can have work performed, materials, notes, customer preferences,
  follow-up requirements, and recurring service history. memories

A PRODUCT
  can have provenance, use history, reviews, maintenance, milestones,
  and future interactions. memories

AN EVENT
  can have preparation, attendance, interactions, outcomes,
  memories, follow-ups, and recurrence
```

The subject does not have to be a human or an organization. **If supplied reality gives the subject meaningful state, history, relationships, or future consequences, QRE can treat it as an experience subject.**

## 2. Generated artifacts are realizations of experiences

QRE must distinguish the **artifact** from the **experience**.

```text
REAL WORLD INPUT
      ↓
EXPERIENCE STATE
      ↓
AUTHORING / COMPILATION
      ↓
CURRENT REALIZATION
      ↓
VIDEO / RECEIPT / RECORD / EXPERIENCE VIEW
```

A video receipt for a completed housekeeping job is valuable immediately, but the experience can remain alive afterward:

```text
service completed
  ↓
receipt delivered
  ↓
service history retained
  ↓
future visit recognized
  ↓
preferences / patterns learned
  ↓
next service questions or reminders
```

A pet-grooming video receipt can be both a finished artifact and an observation in a continuing pet experience.

A surfboard story can be both a current video/story and a durable history that grows with every trip, repair, new owner, photograph, location, or meaningful event.

Therefore:

> **QRE creates artifacts, but the product is the living experience that produces, remembers, learns from, and evolves beyond those artifacts.**

## 3. There are multiple distinct scopes

QRE must never collapse these scopes:

```text
ORGANIZATION / ACCOUNT
  who may administer things

USER / OPERATOR
  who is acting, managing, or recording evidence

IDENTITY / WORLD
  what persistent thing an experience is about

SUBJECT
  the person, animal, object, place, product, service, event,
  record, or combination being experienced

ASSET
  which physical/digital QRE entry point identifies or hosts it

EXPERIENCE / FLOW
  which particular experience realization runs

SESSION
  one participant/runtime instance

OBSERVATION / OUTCOME
  what actually happened

LEARNING
  what durable evidence should change future behavior

ACTION / RE-ENGAGEMENT
  what useful next thing the system may ask, suggest, or initiate
```

The current schema explicitly contains Account/User/Asset/Flow/Experience/analytics concepts, but it does **not** yet contain a first-class shared `Identity`/`World` model. Until that exists, asset-scoped learning remains the safe current boundary for asset-backed identity.

## 4. Asset is an entry point, not necessarily the eventual learner

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
Asset ≠ Account
Asset ≠ User
```

The Asset tells QRE **which physical/digital entry point** was scanned or operated. It does not automatically define every other domain relationship.

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

## 5. Learning is longitudinal state, not merely a score

The long-lived learning system should eventually retain or derive, with provenance:

```text
what happened
what was selected
what succeeded
what failed
why the system believes it succeeded / failed
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

It should also distinguish **state that can change** from **facts that should remain grounded**.

The system should be able to distinguish evidence such as:

```text
EXPLICIT USER PREFERENCE
OBSERVED BEHAVIOR
RUNTIME OUTCOME
EXPLICIT SERVICE RECORD
WEAK SIGNAL
REPEATED PATTERN
HIGH-CONFIDENCE PATTERN
ORGANIZATION-LEVEL OBSERVATION
CURRENT STATE
OPEN QUESTION
NEXT ACTION
```

These are not interchangeable.

## 6. Inquiry is a first-class adaptive capability

A universal experience engine cannot adapt only from passive observation.

When the system has a meaningful uncertainty or a useful missing variable, it may **inquire** rather than invent.

```text
KNOWN STATE
    ↓
MISSING / UNCERTAIN INFORMATION
    ↓
USEFUL QUESTION
    ↓
PARTICIPANT / OWNER ANSWER
    ↓
NEW EVIDENCE
    ↓
UPDATED EXPERIENCE STATE
    ↓
BETTER NEXT ACTION
```

Examples:

```text
TRAVEL
  "Which of these three states do you actually want to visit next?"

HOUSEKEEPING
  "Do you want the same room arrangement next visit?"

PET CARE
  "Did your dog sleep normally after the grooming visit?"

PROJECT / GOAL
  "What is blocking the next step right now?"

SURFBOARD
  "Was this board used on the Oregon trip or the California trip?"
```

Questions must be grounded in known context and should serve a useful next action. QRE must not manufacture certainty merely to avoid asking.

## 7. Advancement is part of the engine

The engine is not merely a passive recorder.

Where authorized and appropriate, it should help the participant, owner, operator, or experience **advance**:

```text
STATE OBSERVED
      ↓
WHAT MATTERS NOW?
      ↓
NEXT USEFUL ACTION
      ↓
ASK / SUGGEST / TRIGGER
      ↓
ACTION TAKEN OR DECLINED
      ↓
OBSERVE RESULT
      ↓
LEARN
```

A travel vision board can become an ongoing planning companion rather than a static collage.

A service experience can evolve from a receipt into a useful history and follow-up system.

A pet experience can remember care patterns and surface relevant questions.

A project experience can notice stalled progress and ask what changed.

An object experience can accumulate provenance, use history, places, repairs, owners, milestones, and memories.

The system advances the human by **supporting agency with useful, grounded next steps**. For object- or animal-centered experiences, the system advances the experience/owner/caretaker rather than pretending the subject has provided human consent or intentions it never supplied.

## 8. Outcome learning is an analysis stage

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

## 9. Adaptive behavior must become actionable

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
AUTHOR / EXPERIENCE DECISION CHANGES
    ↓
EXPERIENCE CHANGES
    ↓
PARTICIPANT / OWNER / REAL-WORLD RESPONSE
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
Movie / experience decision changes
```

while supplied reality remains unchanged.

For a longitudinal non-cinematic experience, the equivalent proof is:

```text
same underlying goal / service / subject
OUTCOME A
    ↓
state changes
    ↓
next interaction changes
    ↓
useful action / question changes
```

## 10. Re-engagement is part of the engine

For longitudinal experiences such as goals, planning, habit-building, collections, learning, travel, services, care, projects, objects, products, or ongoing records, the engine must support:

```text
progress / change observed
      ↓
state updated
      ↓
next useful action inferred
      ↓
participant / owner prompted or experience re-opened
      ↓
response observed
```

A travel/hiking vision-board example may evolve from:

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
seasonal / contextual constraint
next useful action
open question
```

A service experience may evolve from:

```text
"Job completed"
```

to:

```text
service history
preferred conditions
recurring service interval
follow-up question
next appointment / task
```

A pet or animal experience may evolve from:

```text
"Visit recorded"
```

to:

```text
care history
recurring behavior
preferences / sensitivities
milestones
follow-up questions
next useful care action
```

An object experience may evolve from:

```text
"Object acquired"
```

to:

```text
provenance
places visited
use history
repairs
owners
milestones
memories
next maintenance / story opportunity
```

This should be implemented as one adaptive experience loop, not as separate hard-coded products for travel, housekeeping, pets, real estate, services, or objects.

## 11. Organization learning is separate

A brokerage or enterprise may legitimately manage many users and assets.

That gives the organization administrative scope, not permission to merge every identity's learning.

Later, the engine may derive organization-level patterns such as:

```text
Across 400 property experiences,
short cinematic openings have stronger completion rates.
```

or:

```text
Across a service organization,
customers respond better when recurring service preferences
are confirmed before the next visit.
```

That evidence must remain explicitly labeled as organization-level learning and must be selectively applied based on relevance and authorization.

It must not silently become one property's, person's, animal's, object’s, or service record's identity learning.

## 12. Future Prisma direction

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

## 13. IdentityState and Mouth projection

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
Movie / meaning / realization / next-action decisions
          ↓
Mouth / approved experience presentation
```

The Mouth receives only approved, compact, relevant learning pressure alongside source reality.

The Mouth must not decide whether an observation belongs to the identity, whether an organizational signal is authorized, whether a fact is true, or whether an ungrounded action occurred.

For non-cinematic experiences, the same approved learning contract may influence structured experience output, prompts, reminders, questions, progress states, records, receipts, or other presentation layers while preserving the same truth boundary.

## 14. Longitudinal product rule

QRE should optimize for:

```text
MORE USE
  → MORE OBSERVATION
  → BETTER LEARNING
  → BETTER ADAPTATION
  → MORE USEFUL ACTION
  → MORE VALUE
  → MORE USE
```

The experience therefore becomes an accumulating relationship rather than a disposable generated artifact.

The physical QR asset is the doorway.

The subject can be a person, animal, object, place, product, service, event, project, memory, or anything else with meaningful reality and an authorized experience around it.

The experience is the living system behind the doorway.

The learning loop is the memory.

The inquiry system discovers what is missing.

The advancement loop helps determine what should happen next.

The generated receipt, video, story, record, or interface is only the current expression of that living system.

That loop is the universal engine.
