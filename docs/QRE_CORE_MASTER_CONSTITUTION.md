# QRE CORE — MASTER PROJECT CONSTITUTION

**STATUS:** CURRENT / CANONICAL PRODUCT CONSTITUTION  
**BRANCH:** `author/enterprise-realization-engine`

This document is the durable project-level source of truth for QRE's product vision and the boundaries that future agents and developers must preserve. It consolidates the earlier QRE Core master build vision with the current asset, enterprise, adaptive-learning, IdentityState, and Mouth architecture.

Historical documents, old architecture names, prototype names, and isolated acceptance helpers do not override this constitution or the canonical architecture index.

---

## 1. WHAT QRE IS

QRE is **not fundamentally a QR generator, chatbot, template library, or one-shot content generator**.

QRE is a **universal, persistent experience and memory engine**.

A physical QR/NFC object can be the doorway into a living digital experience. The experience can create useful artifacts, remember authorized history, observe outcomes, learn, ask useful questions, adapt, recommend or trigger next actions, and continue indefinitely.

The central product loop is:

```text
PHYSICAL / DIGITAL ENTRY POINT
        ↓
CREATE EXPERIENCE
        ↓
RUN / DELIVER
        ↓
OBSERVE REALITY
        ↓
UNDERSTAND STATE
        ↓
LEARN
        ↓
ADAPT
        ↓
INQUIRE WHEN NEEDED
        ↓
ADVANCE THE PARTICIPANT WHEN USEFUL
        ↓
RE-ENGAGE
        ↓
RUN AGAIN
        ↓
LEARN AGAIN
        ↓
FOREVER
```

"Forever" means QRE is designed as a longitudinal system rather than a disposable generated artifact. It does **not** mean unlimited retention, unlimited context, or unrestricted inference. Durable evidence remains scoped, summarized, provenance-aware, confidence-aware, and governed by explicit authorization boundaries.

---

## 2. THE SUBJECT CAN BE ANYTHING MEANINGFUL

Do not hard-code the product into a fixed list of verticals.

A QRE experience can be about:

```text
PERSON
ANIMAL
OBJECT
PLACE
PRODUCT
PROPERTY
HOME
BUILDING
VEHICLE
SERVICE
BUSINESS
PROJECT
GOAL
EVENT
TICKET
MEMORY
RELATIONSHIP
COLLECTION
ARTIFACT
ARTWORK
TRAVEL JOURNEY
CARE HISTORY
KNOWLEDGE RECORD
OR ANY OTHER MEANINGFUL SUBJECT
```

The criterion is not the category name. The criterion is whether there is supplied or observable reality, state, history, relationships, events, goals, knowledge, or future possibility that can support a useful experience.

Examples include:

- a housekeeping video receipt and continuing service record
- a pet groomer or daycare visit experience
- a living animal/pet history
- a real-estate property experience
- a restaurant or service experience
- a travel/hiking/states vision board
- a wedding or event memory
- a home knowledge system
- an appliance or equipment record
- a vehicle history
- a surfboard's story, trips, repairs, ownership, and memories
- a collectible object's provenance and history
- an artwork's story and evolving context
- a product's lifecycle and documentation

The domain changes. **The engine does not.**

---

## 3. PHYSICAL QR ART IS A REAL PRODUCT

QRE's QR art is physical art.

Examples:

```text
keychains
wood pieces
acrylic pieces
stickers
dog tags
plaques
signs
table/window pieces
event objects
wedding objects
property signs
home installations
wall-mounted art
architectural installations
```

The physical piece is what the customer can buy, own, give, carry, wear, install, display, collect, or inherit.

The physical object and the digital QRE asset are related but distinct:

```text
PHYSICAL QR/NFC ART
        ↓
UNIQUE SCANNABLE IDENTITY
        ↓
QRE DIGITAL ASSET / ENTRY POINT
        ↓
EXPERIENCE + MEMORY + KNOWLEDGE + ANALYTICS + LEARNING
```

The physical art is **not disposable packaging for software**.

The physical art is part of the product.

---

## 4. ASSET FACTS — NON-NEGOTIABLE

For the current schema:

```text
Asset = specific physical/digital QRE identity / entry point
```

A customer or organization can own/administer many Assets.

An Asset may have many experiences.

A Flow can potentially participate in multiple Asset relationships through `AssetFlow`.

Therefore:

```text
Asset ≠ Account
Asset ≠ User
Asset ≠ Flow
Asset ≠ Experience
```

The current schema contains `ownerId` and `accountId` on `Asset`, but these describe ownership/administration. They do **not** automatically define creative identity or learning scope.

For the current asset-backed learning seam, `Asset.id` is the explicit learning boundary because no first-class shared `Identity`/`World` model currently exists above Asset.

Never silently widen an asset-scoped learning query by finding other assets through:

```text
ownerId
accountId
AccountUser
user membership
```

Administrative authority is not creative-learning authority.

---

## 5. ENTERPRISE / ORGANIZATION MODEL

A real-estate brokerage, enterprise, service company, or organization may have many users and many Assets.

Example:

```text
ACCOUNT: Brokerage
│
├── Agent A
│    ├── Listing 101
│    └── Listing 102
├── Agent B
│    ├── Listing 201
│    └── Listing 202
└── Agent C
     └── Listing 301
```

The organization may administer, assign, publish, monitor, and report on all of these assets.

That does **not** mean Listing 101 learns from Listing 301.

The dashboard therefore remains asset-first:

```text
PERSONAL USER
  → My Assets
  → Experiences
  → Results / activity

ORGANIZATION ADMIN
  → Organization
  → Managed Assets
  → Users
  → Assignments
  → Permissions
  → Asset activity
  → Organization reporting
```

Users should not need to understand `ownerId`, `accountId`, `AssetFlow`, memory repositories, analytics tables, or learning projections. Those are implementation structures behind the simple product concepts of:

```text
who manages it
what asset is it
what experience does it run
what happened
what happens next
```

---

## 6. FUTURE SHARED WORLD / IDENTITY

The product may eventually support several physical QRE assets intentionally acting as portals into the same persistent world:

```text
IDENTITY / WORLD
       │
       ├── ASSET A — keychain
       ├── ASSET B — tag
       └── ASSET C — artwork
```

This is a legitimate product capability, but the current schema does not contain a first-class `identityId` or `worldId`.

Therefore do not fake a shared world using `accountId`, `ownerId`, or user membership.

When implemented, this must become an explicit domain and authorization relationship.

The likely conceptual future shape is:

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

The exact names/cardinalities are **not yet locked**. Do not add competing `identityId` and `worldId` fields without a domain decision.

---

## 7. GENERATED ARTIFACTS ARE REALIZATIONS, NOT THE PRODUCT

QRE can create:

```text
video receipts
service records
cinematic scenes
memory summaries
stories
knowledge records
interactive flows
recommendations
reminders
progress views
tickets
rewards
sponsor surfaces
other multimodal experiences
```

These are realizations of a living experience.

For example:

```text
HOUSEKEEPING JOB
    ↓
VIDEO RECEIPT
    ↓
SERVICE HISTORY
    ↓
PREFERENCE / PATTERN LEARNING
    ↓
FOLLOW-UP / NEXT SERVICE
```

Or:

```text
PET GROOMING VISIT
    ↓
VIDEO RECEIPT
    ↓
PET EXPERIENCE HISTORY
    ↓
RECURRING PATTERNS
    ↓
USEFUL OWNER QUESTIONS / NEXT CARE ACTION
```

Or:

```text
SURFBOARD
    ↓
OBJECT EXPERIENCE
    ↓
TRIPS / LOCATIONS / REPAIRS / PHOTOS / MEMORIES
    ↓
EVOLVING OBJECT STORY
```

The artifact is current output. The experience is what persists.

> **QRE creates artifacts; the product is the living experience that creates, remembers, learns from, and evolves beyond them.**

---

## 8. CORE EXECUTION PIPELINE

The system remains conceptually:

```text
SCAN EVENT
   ↓
SCAN ENGINE
   ↓
ACCESS / POLICY
   ↓
EXPERIENCE / FLOW
   ↓
MOMENT BUILDING
   ↓
COGNITION
   ↓
GEO / STORY / MEMORY / KNOWLEDGE
   ↓
CINEMATIC OR STRUCTURED RUNTIME
   ↓
FRONTEND EXPERIENCE
   ↓
ANALYTICS
   ↓
LEARNING / MEMORY
   ↓
RE-ENGAGEMENT / NEXT ACTION
```

The implementation must continue to respect the locked repository architecture:

```text
packages/contracts
packages/shared
packages/db
packages/engine
apps/api
apps/web
```

Build order:

```text
contracts → db → engine → api → web
```

Shared types come from `@qre/contracts`.

The engine remains Prisma-agnostic where its current architecture requires it.

Do not replace this architecture with a generic chatbot architecture.

---

## 9. COGNITION AND TRUTH

The cognitive system must determine, from supplied evidence and authorized context:

```text
what happened
who participated
where
when
explicit facts
safe relationships
salient details
emotional/creative engine
creative trajectories
memory significance
recurrence
new information
possible future relevance
```

Central rule:

> **Creative freedom in interpretation. Factual discipline in reality.**

The engine can use:

```text
metaphor
personification
analogy
irony
rhythm
comic framing
creative exaggeration
subtext
```

without turning unsupported details into literal reality claims.

Do not invent:

```text
people
objects
locations
chronology
concrete actions
body reactions
dialogue
sounds
outcomes
```

when the system does not have evidence for them.

---

## 10. THE CREATIVE AUTHOR

QRE should behave like an adaptive creative author/editor rather than a template engine.

Conceptually:

```text
QRE FACTS
+ WORLD
+ MEMORY
+ PREFERENCES
+ ANALYTICS
        ↓
CREATIVE DIRECTOR
        ↓
DRAFT
        ↓
CRITIC
        ↓
TARGETED REVISION
        ↓
QUALITY / TRUTH GATES
        ↓
FINAL REALIZATION
```

The author should find what is already interesting inside ordinary information.

Central principle:

> **Do not make boring things exciting by lying about them. Make them exciting by discovering what they already mean.**

Creative trajectories remain search spaces, not rigid templates:

```text
REVEAL
ESCALATION
HORROR
COMEDY
ROMANCE
MEMORY
TRANSFORMATION
BATTLE
CRAFT
MISSION
RELIEF
CONQUEST
DANCE
CINEMATIC REVEAL
```

---

## 11. MEMORY IS STRUCTURED MEANING, NOT JUST TEXT

QRE must accumulate authorized information across time.

Memory may recognize:

```text
people
places
animals
objects
products
properties
services
activities
events
recurring behaviors
repeated emotional patterns
meaningful returns
time gaps
before/after changes
relationships
```

Memory should preserve structured meaning plus source evidence.

Recommendations must be based on evidence rather than invented personality claims.

---

## 12. CONTINUOUS LEARNING

Learning is not a single score. It is longitudinal state.

The system should retain or derive, with provenance:

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

Signals can include:

```text
accepted draft
rejected draft
selected variation
edited draft
skipped draft
replay
save
share
completion
CTA interaction
memory reuse
recurrence
runtime outcome
explicit feedback
```

Different evidence types must remain distinguishable:

```text
EXPLICIT USER PREFERENCE
OBSERVED BEHAVIOR
RUNTIME OUTCOME
EXPLICIT SERVICE RECORD
WEAK SIGNAL
REPEATED PATTERN
HIGH-CONFIDENCE PATTERN
ORGANIZATION OBSERVATION
CURRENT STATE
OPEN QUESTION
NEXT ACTION
```

Do not silently collapse all of them into one generic preference bag.

---

## 13. OUTCOME LEARNING SEAM

The current outcome normalizer is intentionally pure:

```text
AnalyticsEventType
        ↓
normalizeExperienceOutcome()
        ↓
positive / negative / neutral
```

This is classification, not durable learning by itself.

The desired production seam is:

```text
REAL OUTCOME
    ↓
AnalyticsEvent
    ↓
Outcome Normalization
    ↓
Learning Analysis
    ↓
Persist / Reload
    ↓
Identity-Scoped Learning Context
    ↓
IdentityState
    ↓
Cognitive Author Context
    ↓
Learned Pressure / Eligible Signals
    ↓
Author Decision
    ↓
Experience Change
```

A test is not sufficient merely because a learning string exists.

The acceptance must prove causality:

```text
same reality
same underlying subject
same base prompt
OUTCOME A
    ↓
LEARNING DELTA
    ↓
CREATIVE / EXPERIENCE DECISION DELTA
```

while the supplied factual reality remains unchanged.

---

## 14. UNIVERSAL ADAPTIVE LOOP

The central long-term behavior is:

```text
CREATE
 ↓
OBSERVE
 ↓
UNDERSTAND
 ↓
LEARN
 ↓
ADAPT
 ↓
INQUIRE
 ↓
ADVANCE
 ↓
RE-ENGAGE
 ↓
OBSERVE AGAIN
 ↓
LEARN AGAIN
 ↓
FOREVER
```

Learning is operational only when it changes what the experience does next.

For non-cinematic experiences, "creative decision changes" may mean:

```text
next question
next reminder
next recommendation
next task
next progress state
next service follow-up
next experience variation
next CTA
next knowledge surface
```

---

## 15. INQUIRY

QRE must be allowed to ask useful questions when an important variable is missing or uncertain.

```text
KNOWN STATE
   ↓
MISSING / UNCERTAIN INFORMATION
   ↓
USEFUL QUESTION
   ↓
ANSWER
   ↓
NEW EVIDENCE
   ↓
UPDATED STATE
   ↓
BETTER NEXT ACTION
```

Examples:

```text
TRAVEL
Which state do you actually want to tackle next?

HOUSEKEEPING
Do you want the same room arrangement next visit?

PET CARE
Did the animal behave normally after the visit?

PROJECT
What is blocking the next step?
```

Questions must be grounded in context and should serve a useful purpose. QRE must not fabricate certainty merely to avoid asking.

---

## 16. ADVANCEMENT

QRE should not be merely a passive recorder.

Where authorized and appropriate, it should help the participant advance:

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

This is about supporting agency with grounded next steps—not fabricating actions, consent, or outcomes.

---

## 17. UNIVERSAL APPLICATION EXAMPLES

### Travel / Hiking / Vision Board

```text
states / places / interests / constraints
        ↓
vision-board experience
        ↓
progress
        ↓
stalls / completions / interests
        ↓
questions / next actions
        ↓
re-engagement
```

### Housekeeping / Services

```text
service facts
        ↓
creative video receipt / service record
        ↓
service history
        ↓
preferences / recurrence / issues
        ↓
follow-up / next visit
```

### Pet Grooming / Daycare / Animal

```text
pet facts + visit events + observations
        ↓
visit experience / video receipt
        ↓
care history
        ↓
recurring behavior / preferences / milestones
        ↓
useful owner questions / next care action
```

### Real Estate

```text
property facts + listing context + interactions
        ↓
property experience
        ↓
engagement / history / knowledge
        ↓
property-specific learning
        ↓
future experience adaptation
```

### Home / Property Knowledge

The home can accumulate builder, owner, repair, maintenance, warranty, upgrade, and memory information over its lifecycle.

Provenance must distinguish who supplied the information and when.

### Object / Product / Surfboard

```text
object
 ↓
identity
 ↓
ownership / history / places / events / repairs / photos / memories
 ↓
living object story
 ↓
future interactions
```

The same engine applies to an appliance, vehicle, collectible, artwork, gift, tool, instrument, or other meaningful object.

---

## 18. PHOTO / VISUAL KNOWLEDGE

QRE may use photos to extract structured knowledge from visible evidence:

```text
label
value
category
unit
confidence
notes
```

Do not hallucinate hidden or unsupported specifications.

The same structured-knowledge pattern can support homes, products, equipment, services, objects, materials, artwork, and memories.

---

## 19. EVENTS / TICKETS / REWARDS / SPONSORS

QRE can support tickets, event identities, check-in, redemption, rewards, sponsor attribution, and downstream experiences.

Sponsors must remain relevant and non-intrusive.

Rewards and attribution must rely on actual events, not merely impressions.

These are shared capabilities attached to experiences, not separate intelligence architectures.

---

## 20. DASHBOARD PRINCIPLE

The underlying system may be extremely sophisticated.

The user experience must remain extremely simple:

```text
BUY / CLAIM PHYSICAL ART
        ↓
CONNECT ASSET
        ↓
TELL QRE WHAT THIS IS / WHAT YOU WANT
        ↓
ADD PHOTOS / FACTS / KNOWLEDGE
        ↓
QRE UNDERSTANDS
        ↓
CREATE EXPERIENCE
        ↓
PREVIEW
        ↓
PUBLISH
        ↓
WATCH / USE / INTERACT
        ↓
QRE LEARNS
        ↓
QRE ADAPTS
```

Organization users get additional management surfaces:

```text
Assets
Users
Assignments
Permissions
Activity
Reporting
```

Users do not need to understand the underlying cognitive machinery.

---

## 21. SECURITY / AUTONOMY / SCOPE

Do not weaken authentication to make testing easier.

Do not leak private memories or learning between unrelated identities.

Ownership and administration determine who may operate an Asset. They do not automatically determine what that Asset learns.

Organization-level learning, if added, must be explicitly scoped and provenance-aware.

---

## 22. DEVELOPMENT DISCIPLINE

When modifying QRE:

1. Inspect the existing implementation before changing architecture.
2. Preserve contracts.
3. Preserve engine boundaries.
4. Reuse the existing analytics stream.
5. Reuse the existing memory structures.
6. Avoid duplicate intelligence systems.
7. Add acceptance coverage alongside substantial behavior.
8. Run actual builds and tests.
9. Inspect human-readable outputs.
10. Never claim success without evidence.

If a build fails, fix the smallest correct layer and rerun the relevant acceptance.

Do not create a separate hard-coded engine for every new vertical.

---

## 23. ABSOLUTE PRODUCT STANDARD

The system should make the user feel:

> **"Holy shit. It made something out of that."**

But under that simple surface, the product must be capable of:

```text
UNDERSTANDING
MEMORY
CREATIVE AUTHORING
KNOWLEDGE EXTRACTION
ANALYTICS
LEARNING
INQUIRY
ADAPTATION
RE-ENGAGEMENT
NEXT-ACTION GUIDANCE
```

without sacrificing factual grounding, identity boundaries, user autonomy, or architectural discipline.

---

## 24. PHYSICAL THING → LIVING EXPERIENCE

The deepest QRE pattern is:

```text
PHYSICAL THING
     ↓
UNIQUE QRE ENTRY POINT
     ↓
DIGITAL EXPERIENCE
     ↓
KNOWLEDGE
     ↓
MEMORY
     ↓
ANALYTICS
     ↓
LEARNING
     ↓
ADAPTATION
     ↓
FUTURE EXPERIENCE
```

A tiny keychain, a pet tag, a service receipt, a property installation, a wedding object, or a six-foot architectural QR artwork can all use the same core infrastructure.

The physical form changes.

The digital intelligence does not.

> **The physical QR art is the doorway. QRE is the living system behind it.**
