# QRE Living Reality Engine — Canonical Architecture

## Status

This document is the canonical product and architecture direction for the Super Cog / Author system.

The goal is not to build a better story generator.

The goal is to build a **living reality engine** that continuously turns a real person's, pet's, relationship's, business's, property, event, service history, or goal/vision into an evolving identity and then into cinematic experiences.

The experience shown on screen is the end product. Everything before it exists to make that experience increasingly grounded, useful, personal, funny, meaningful, or surprising without inventing reality.

---

## 1. The Core Product

QRE creates and maintains a persistent identity around something real.

Examples:

- a pet
- a person
- a relationship
- a family
- a business
- a home/property
- a wedding/event
- a service history
- a project
- a trip
- a goal
- a vision board
- a memorial/living memory

The user should not need to understand cognition, learning, prompts, lenses, or memory systems.

They simply:

1. create an identity
2. add real facts or updates
3. scan/use the identity in real life
4. let QRE remember what happened
5. receive better experiences over time

**No manual "train the AI" workflow is required.**

---

## 2. The Universal Loop

```text
REAL LIFE
   |
   v
USER INPUT / SCAN / EVENT / LOCATION / INTERACTION
   |
   v
REALITY TYPING
   |
   v
MEMORY + EVENT GRAPH
   |
   v
IDENTITY STATE
   |
   v
SUPER COG
   |
   +--> DOMAIN COGNITION
   |
   +--> COGNITIVE STATE
   |
   +--> OPPORTUNITY SEARCH
   |
   +--> TRAJECTORY SEARCH
   |
   v
SELECTED MOVIE / EXPERIENCE
   |
   v
OPTIONAL LENS
   |
   v
ONE MOUTH CALL
   |
   v
CINEMATIC EXPERIENCE / PLAYER
   |
   v
SCAN BEHAVIOR / FEEDBACK / OUTCOME
   |
   +------------------------------+
                                  |
                                  v
                             LEARNING
                                  |
                                  +----> next Identity State
```

This is the closed loop to build.

---

## 3. The Hard Reality Law

This is non-negotiable across every domain.

> **QRE may derive meaning and relationships from supplied reality. QRE may not invent reality.**

The system may:

- reorder supplied facts only when the explicit experience mode permits it
- compress supplied facts into cinematic language
- expose relationships between supplied facts
- derive a cognitive state from supplied facts
- identify recurring details
- identify contradictions already present
- identify opportunities already latent in the supplied world
- choose framing, tone, lens, rhythm, or presentation
- learn from observed user behavior

The system may not invent:

- people
- identities
- relationships
- places
- buildings/rooms
- objects/props
- body details
- dialogue
- ownership
- tenancy
- customer/client relationships
- participants
- pets/animals not supplied
- physical actions not supplied
- sensory details not supplied
- specific causes that were not supplied
- private feelings presented as fact
- literal events that did not happen

A plausible detail is still invented.

**Derivation is permitted. Fabrication is not.**

---

## 4. Four Separate Layers of Truth

Keep these distinctions explicit.

### MEMORY

What actually happened or was explicitly supplied.

Examples:

- Coco loves bacon.
- Coco went to daycare.
- We met at the local bar.
- The offer arrived that night.

### COGNITION

How supplied facts relate to one another.

Examples:

- fierce + friendly creates a character tension
- met at bar + seen every day creates a relationship progression
- one event returning later creates a callback opportunity

Cognition may infer **relationships**, not new facts.

### GENERATION

How QRE presents the supplied world.

Examples:

- deadpan
- noir
- playful
- cinematic
- observational
- concise
- warm
- suspenseful

Generation changes presentation, not reality.

### LEARNING

What observed behavior suggests was useful, preferred, ignored, rejected, replayed, saved, or shared.

Examples:

- the owner repeatedly saves short comedic experiences
- a certain lens has higher completion
- a certain trajectory causes abandonment
- a certain memory recommendation is repeatedly selected

Learning changes future **selection/context**, not historical facts.

---

## 5. The Missing Canonical Object: Identity State

The architecture should converge on one derived object above memory, analytics, presence, and creative learning:

```ts
IdentityState {
  canonicalFacts
  currentState
  traits
  preferences
  activities
  relationships
  history
  recentEvents
  recurringPatterns
  goals
  intentions
  unresolvedQuestions
  locations
  activeContext
  behavioralLearning
  creativeLearning
}
```

This does not need to replace existing repositories.

It is a **cognitive projection** over existing truth.

The purpose is to give Super Cog one canonical snapshot instead of making it independently reason over disconnected lists.

---

## 6. Existing QRE Pieces Already Point Toward This

The existing system already contains substantial pieces of the target architecture.

### Memory projection

The API memory projection converts the world model into durable entities, facts, relations, and events.

### Memory repository

The memory repository persists those facts and reloads active high-confidence context for later cognition.

### Presence

Presence/location can already influence authoring context and is suitable for pet daycare, vet, dog walker, vacation, event, property, service, and physical-site use cases.

### Analytics

QRE already records scans, completion, abandonment, errors, replay, saves, shares, CTA actions, rewards, payments, memory actions, and creative decisions.

### Creative learning

Accepted/rejected/selected creative outcomes are persisted and returned as future learning context.

### Autonomous learning

Observed experience outcomes are grouped by creative characteristics and converted into behavioral winners/weaknesses.

### Author Brain

The Author Brain now uses structured reality, cognitive states, selected movie cognition, trajectory, lens information, and hard grounding rules before making the single mouth call.

---

## 7. Automatic Learning: What the User Actually Does

The user does **not** teach a model.

They simply live.

### Example: pet

Owner creates:

```text
Coco
poodle
fierce
friendly
loves bacon
loves other dogs
long walks at night
```

At daycare:

```text
played with other dogs
stole the ball
slept all afternoon
```

At the vet:

```text
checkup
weight recorded
vaccination updated
```

At home:

```text
long walk at night
```

QRE automatically accumulates those facts and events.

The next experience receives:

```text
identity + current context + history + cognitive state + learning
```

The owner never clicks "train".

### Example: person / goals

User enters:

```text
MOVE TO PORTLAND
BUILD QRE
BUY A YACHT
START A BUSINESS
```

Then real updates accumulate:

```text
researched Portland
saved money
built prototype
got first customer
looked at boats
```

QRE can automatically recognize:

- progress
- repeated intent
- unresolved goals
- friction
- recurring behavior
- milestones
- changes in direction
- opportunities to revisit prior intentions

The resulting cinematic experience can evolve with the person's actual life.

---

## 8. Pet Social / Living Identity Product

The pet product is an application of the universal identity system.

The owner goes to the dashboard and enters structured facts.

Example:

```text
Name: Coco
Breed: Poodle
Traits: fierce, friendly
Preferences: loves bacon, loves other dogs
Activities: long walks at night
```

The owner can then switch the same living identity into contexts such as:

- daycare
- vet
- groomer
- dog walker
- boarding
- vacation
- home
- lost-pet mode
- social profile

A scan can:

1. display the living identity
2. expose owner-safe information
3. notify the owner when appropriate
4. capture a real-world event/update
5. feed that update into memory
6. let Super Cog create a grounded story later

The physical QR/NFC object is therefore an interface to a **living identity**, not merely a static profile.

---

## 9. Living Memory Product

A relationship can become a persistent living identity.

Example facts:

```text
met at the local bar
connected
talked until close
seen each other every day
```

The system can preserve the facts while cognition finds grounded relationships such as:

```text
origin -> connection -> repeated presence
```

The cinematic layer can then create experiences about the relationship without inventing what happened next.

The key boundary is:

> **Meaning may evolve. Facts do not.**

---

## 10. Goals / Vision Board Product

A goal is also a persistent identity.

The dashboard can expose:

```text
GOAL
CURRENT REALITY
MILESTONES
UPDATES
FRICTION
NEXT QUESTIONS
```

QRE does not merely render a static vision board.

It compares intention with accumulated reality and can create cinematic experiences around actual progress.

Example:

```text
INTENTION
move to Portland

REALITY
researched neighborhoods
visited once
saved money

COGNITION
intention is becoming concrete

NEXT EXPERIENCE
show the movement from idea to real-world commitment
```

The model does not invent the commitment. It identifies the relationship between supplied facts.

---

## 11. Domain Cognition

Domains should specialize interpretation without creating separate brains.

Universal Super Cog remains central.

```text
                     SUPER COG
                         |
        +----------------+----------------+
        |                |                |
    PET MODE         MEMORY MODE       SERVICE MODE
        |                |                |
     PET facts       relationship       service facts
     pet states      chronology          service updates
     social pull     continuity          operational context
        |                |                |
        +----------------+----------------+
                         |
                    DOMAIN MOVIE
                         |
                    ONE MOUTH CALL
```

A domain can provide:

- entity vocabulary
- state vocabulary
- special tensions
- opportunity types
- safety constraints
- presentation defaults

It must not become a second unrelated authoring brain.

---

## 12. Movie Creation Architecture

The movie path should remain:

```text
REALITY
  ↓
IDENTITY STATE
  ↓
DOMAIN COGNITION
  ↓
COGNITIVE STATE
  ↓
HYPOTHESES
  ↓
TRAJECTORY SEARCH
  ↓
WINNER
  ↓
OPTIONAL LENS
  ↓
ONE MOUTH CALL
  ↓
VALIDATION
  ↓
CINEMATIC SCENES
```

The Mouth should not be responsible for planning multiple complete stories.

Super Cog chooses.

The Mouth renders.

The validator protects the reality boundary.

---

## 13. Validator Role

The validator is not only a policeman.

It is also a teacher.

Current checks should continue to detect:

- invented places
- invented objects
- invented body details
- unsupported identity
- weak pull
- repetition
- excessive length
- chronology violations
- abstract cognition language
- unsupported relationships

Future direction:

```text
VALIDATOR FAILURE
      ↓
structured rejection reason
      ↓
COG / AUTHOR SIGNAL
      ↓
next candidate planning improves
```

The validator should influence future generation through structured constraints, not by allowing bad output to survive.

---

## 14. Behavioral Learning

There are two different kinds of learning.

### Truth learning

New facts/events from real life.

```text
memory/event updates
```

### Preference learning

Evidence about what experiences work for the user.

```text
completion
replay
save
share
CTA
reward
abandonment
error
accept/reject/select
```

These must never be conflated.

A user liking a noir movie does not become a fact about their life.

A user entering "Coco loves bacon" does not become a preference signal merely because it appeared frequently.

---

## 15. The Learning Loop Must Be Automatic

Every normal product action should participate automatically where applicable:

```text
DASHBOARD UPDATE
   -> memory write

SCAN
   -> presence + analytics + possible owner notification

LOCATION EVENT
   -> context update

SERVICE UPDATE
   -> memory event

EXPERIENCE PLAY
   -> behavioral analytics

EXPERIENCE SAVE / SHARE / REPLAY
   -> preference evidence

NEW EXPERIENCE REQUEST
   -> load IdentityState
   -> use learning
   -> plan next experience
```

The user should never have to coordinate this manually.

---

## 16. Privacy / Ownership Boundary

Learning must remain scoped correctly.

Per-identity truth belongs to that identity.

Creative behavior learned from an owned identity/account must not silently become another customer's private context.

Cross-account aggregate learning can exist only as intentionally designed product-level aggregate intelligence, never as accidental leakage of private memory or facts.

The current learning implementation already scopes creative learning to owned assets/account assets and treats explicit feedback separately from autonomous behavioral signals. This direction should remain locked.

---

## 17. What “Learning” Should Mean to the Customer

Never expose the internal machinery unless useful.

The customer experience should feel like:

> "QRE remembers."

> "QRE noticed."

> "QRE knows what happened before."

> "QRE picked up on that pattern."

> "QRE made the next one better."

Not:

> "The model updated its latent preference vector."

The product language should describe observable value, not implementation jargon.

---

## 18. The Identity Dashboard

The dashboard should eventually become a simple control surface for the living identity.

### Core sections

```text
IDENTITY

REALITY
- facts
- traits
- preferences
- places
- people
- events

NOW
- current context
- current state
- current location
- current mode

MEMORY
- timeline
- important moments
- recurring details
- relationships

INTENT
- goals
- future plans
- unresolved questions

LEARNING
- what QRE has noticed
- what experiences work
- what is changing

CREATE
- make a movie
- make a memory
- make a social post
- make a goal experience
```

The interface should remain fast and low-friction.

Users should not need to learn a complex authoring dashboard.

---

## 19. Real-World Scan Context

The same identity can be interpreted differently by context.

Examples:

```text
Coco + daycare
= social / playful / current-day context

Coco + vet
= factual / care / owner-notification context

Coco + groomer
= service / before-after / memory context

Coco + vacation
= travel / location / continuity context
```

The identity remains the same.

The domain/context changes.

This is one of the strongest reasons not to create separate brains.

---

## 20. Location as Context, Not Permission to Invent

Location can provide:

- where the scan happened
- which mode is active
- visit count
- returning status
- physical-site context
- location history

Location may change framing.

Location may not manufacture events that were never supplied or observed.

For example:

```text
scan at daycare
```

permits:

> daycare context

It does not permit:

> Coco played with a golden retriever named Max.

unless that was actually supplied/observed.

---

## 21. The Physical Product Strategy

The physical QR/NFC artifact should be treated as the identity's physical doorway.

Potential objects:

- dog tag
- collar tag
- keychain
- sticker
- business sign
- wedding keepsake
- memorial object
- property sign
- event object
- personal identity card

Scan -> identity -> context -> experience.

The object can remain static while the identity continuously evolves.

That is the value proposition.

---

## 22. Commercial Product Families

The underlying system is universal. Product packaging can be domain-specific.

### Consumer

- living memories
- relationships
- family identities
- goals
- vision experiences

### Pets

- living pet identity
- daycare/vet/groomer context
- owner notification
- social pet media
- care timeline

### Businesses

- living business identity
- service stories
- customer experiences
- promotional cinematic media
- campaign learning

### Real estate

- property identity
- property history
- listing facts
- renovation timeline
- buyer-facing cinematic experience

### Events

- event identity
- attendee/ticket context
- live moments
- recap experiences
- sponsor interactions

### Service businesses

- service history
- customer-facing summaries
- recurring updates
- before/after memory
- business promotion

The same brain powers all of them.

---

## 23. What I Would Build Next

### Phase A — Canonical Identity State

Create one service that composes:

```text
memory
presence
analytics
creative learning
domain cognition
intent/goals
recent events
```

into one `IdentityState`.

Do not duplicate persistence.

### Phase B — Automatic Update Pipeline

Every dashboard/event/scan update should flow through one normalizer:

```text
input
 -> reality typing
 -> memory batch
 -> identity refresh
```

### Phase C — Super Cog Consumption

Make Super Cog accept the canonical `IdentityState` rather than independent ad hoc context lists.

### Phase D — Learning Projection

Return a compact derived learning view:

```text
observedPatterns
preferredExperienceShapes
weakExperienceShapes
recurringTopics
recentChanges
confidence
```

### Phase E — Contextual Movie Generation

Use:

```text
identity
+ current context
+ domain
+ cognitive state
+ selected learning
```

to search for the next movie.

### Phase F — Player Feedback Loop

Capture what happens after playback:

```text
complete
replay
save
share
CTA
abandon
```

and automatically feed it into the next learning projection.

---

## 24. The Long-Term Monster

The end state is not:

```text
prompt -> story
```

It is:

```text
REAL WORLD
    |
    v
PERSISTENT IDENTITY
    |
    +--> MEMORY
    +--> HISTORY
    +--> CURRENT STATE
    +--> INTENT
    +--> RELATIONSHIPS
    +--> LOCATION
    +--> DOMAIN
    +--> LEARNING
          |
          v
       SUPER COG
          |
          v
   SEARCH / PLANNING
          |
          v
      NEXT MOVIE
          |
          v
      SCREEN PLAYOUT
          |
          v
     REAL-WORLD RESPONSE
          |
          +----------------> LEARNING
```

The system gets better because the **identity gets richer** and because QRE gets better evidence about what experiences actually work.

---

## 25. Final Product Principle

QRE should make the customer feel that their object, pet, relationship, business, project, or goal is **alive**.

Not alive because QRE invents a personality.

Alive because real life keeps happening and QRE keeps remembering, organizing, understanding, and presenting it.

**The world supplies the facts.**

**Memory preserves them.**

**Cognition connects them.**

**Learning improves selection.**

**Super Cog chooses what matters next.**

**The Mouth turns that into the movie.**

**The player makes it visible.**

Then real life happens again.

That loop is the product.
