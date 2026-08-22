# Super Cog North-Star Backlog

> These are product and architecture ideas captured from the evolving QRE vision. They are **not literal implementation requirements**. Treat them as a durable north-star backlog; implement only when the idea fits the canonical architecture and passes the acceptance gates.

## Product Direction

QRE should make people **want the experience**, not merely tolerate a generated receipt, caption, dashboard, or QR page.

The same universal brain should support:

- pet identities and pet social media
- living memories and memorials
- relationships
- people and artists promoting themselves or their work
- businesses and service providers
- service receipts/media
- real estate and properties
- events and weddings
- projects
- goals and vision-board-like identities
- games / game-like framing
- spy / mystery / noir-style framing
- optional lenses for otherwise boring material

A boring source is not a reason to invent facts. It is a reason to find a more compelling **presentation strategy** from the facts that exist.

## Identity-Centered Product

The physical QR/NFC asset should be a persistent doorway to a living identity rather than a disposable link.

Examples:

- pet tag → pet identity and memories
- business object/sign → business/service identity
- event object/ticket → event identity and memories
- memorial object → living memory
- property object → property identity/history
- personal artifact → personal identity/goals/memories

The physical artifact can remain stable while the digital world behind it accumulates history.

## Context Switching

One identity may enter different experience contexts without becoming a different brain.

Pet example:

- living identity
- daycare
- groomer
- vet
- walker
- vacation
- social
- lost/found

Person example:

- living identity
- relationship memory
- goals
- projects
- travel
- work
- artist/promotional story

The context should change the cognitive mode, evidence priorities, privacy boundary, and presentation style.

## Location + Time

Location and time should be treated as contextual evidence, not decorative metadata.

Ideas include:

- physical site
- experience place
- event venue
- memory place
- recurring place
- travel context

Location may influence which memories and relationships are relevant, but location must never manufacture an event or relationship.

Time should support chronology, recurrence, anniversaries, gaps, before/after relationships, and temporal callbacks.

## Universal World Model

Long-term direction:

`physical identity → event → memory → graph → pattern → meaning → creative opportunity → experience → new event`

Universal primitives should include:

- entity
- event
- state
- relationship
- place
- time
- evidence
- media
- intent
- outcome
- recurrence

Raw evidence should never be discarded merely because it has been summarized.

## Memory Graph

QRE should eventually understand:

- who/what appeared
- what happened
- where it happened
- when it happened
- what happened before/after
- what repeats
- what changed
- what relationships are recurring
- what places become meaningful
- what details return as callbacks

Example:

`Coco → visited → groomer → blue bow incident → later grooming visit`

## Significance + Attention

Potential future cognitive signals:

- novelty
- repetition
- change
- rarity
- personal relevance
- relationship importance
- emotional weight when explicitly supported
- recurrence
- surprise relative to accumulated reality

Core question:

> What is the one thing here that makes somebody care?

## Creative Opportunity Search

For meaningful reality, Super Cog should search multiple grounded possibilities before the Mouth writes anything.

Potential presentation strategies are notes, not mandatory outputs:

- comedy
- romance
- noir
- mystery
- spy
- game-like progression
- absurd framing
- horror-like tension without supernatural invention
- mockumentary
- epic framing
- tender memory framing
- promotional storytelling

The key rule remains:

> Creativity may change presentation and meaning. It may not create reality.

## Service Media

Service businesses should be able to turn normally boring material into memorable experiences.

Examples:

- housekeeping
- grooming
- mechanic
- barber
- tattoo artist
- contractor
- landscaper
- restaurant
- wedding vendor
- other providers

Possible output forms:

- cinematic receipt
- funny service recap
- client-facing story
- before/after experience
- promotional story
- repeat-service memory

Do not infer homeowner, Airbnb, customer identity, property ownership, or other unsupported context.

## Promotion

The same system can help a person, artist, lawyer, business, or other entity tell a story about themselves or their work.

A professional/exact-data mode must remain distinct from entertainment modes. Domain intent determines how much interpretive freedom is appropriate.

## Goals + Vision

A goal/vision identity should accumulate actual progress rather than remain a static vision board.

Potential flow:

`goal → real update → current state → progress/friction → grounded opportunity → next experience`

Examples of updates:

- researched something
- completed a milestone
- found a customer
- saved money
- shipped a prototype
- attended an event
- changed direction

QRE should help users see progress and discover next actions from supplied reality.

The system should not invent accomplishments or claim that a goal was achieved without evidence.

## Game / Spy / Lens Notes

These are optional **framing lenses** for making ordinary material more engaging.

They should not become separate brains.

A lens can change:

- tone
- framing
- pacing
- terminology
- question emphasis
- presentation order when permitted

A lens cannot change provenance or invent literal facts.

## Learning

The user should never need a "train AI" button.

Automatic learning should come from:

1. supplied reality
2. durable memory
3. scans/interactions
4. repeated choices
5. accepted/rejected creative outcomes
6. observed behavioral signals
7. updated IdentityState
8. better future experiences

Learning means discovering relationships, recurrence, preferences, creative fit, and meaningful patterns from evidence.

Learning must not become silent factual invention.

## Proactive Future

Long-term possibilities:

- detect recurring places
- detect recurring people/entities
- detect recurring events
- surface anniversaries
- notice gaps / inactivity
- suggest saving a meaningful moment
- suggest a grounded next action
- suggest a collection or timeline
- surface unresolved questions
- generate a new experience without an explicit prompt when permissions and product rules allow

Examples:

> You have 8 memories here.

> This person keeps appearing in your events.

> This is your third visit to this place.

> You haven't updated this goal in 30 days.

These should be based on observed evidence, not speculation.

## Media as Evidence

Photos and video should eventually participate in cognition as:

- evidence
- memory anchors
- callbacks
- visual references
- change detection
- significant moments

They should not merely decorate generated text.

## Physical Object Strategy

A physical artifact can be the permanent doorway into the evolving identity.

Possible forms:

- wood
- acrylic
- metal
- stickers
- tags
- plaques
- custom shapes
- event keepsakes
- memorial objects

The digital experience is what makes the physical object worth keeping.

## Architecture Rules

Do not create parallel brains.

Canonical ownership:

- contracts → canonical data shapes
- memory → durable reality/history
- IdentityState → unified cognitive snapshot
- domain cognition → mode/context interpretation
- Super Cog / Movie Cognition → meaning, trajectory, movie selection
- Mouth → language realization
- truth/provenance gates → enforce reality boundaries
- experience/player → execution and playback
- analytics + creative learning → observed feedback

New functionality should plug into an existing owner whenever possible.

## Current Strategic Priority

Before adding more surface features, strengthen the boundary between:

`observed fact → permitted inference → movie beat → generated language`

The next major engineering target is **provenance-aware inference envelopes** so every generated line remains within what its source facts actually permit.

After that, deepen:

1. character movie search
2. persistent-meaning search
3. goal/intent trajectory search
4. proactive grounded intelligence
5. richer media/location cognition
6. simple end-user product flows

## Master Principle

The experience on screen is the product.

Everything upstream exists to make the next experience:

- more grounded
- more meaningful
- more personal
- more useful
- funnier
- more surprising
- easier to create

**without inventing reality.**
