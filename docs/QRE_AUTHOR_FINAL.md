# QRE Universal Author — Final

STATUS: CANONICAL
ROLE: Final governance contract for the Universal Author compiler boundary.

QRE is a universal entity-centric cognitive experience system. The Author is not a product vertical, story writer, or database. It is the creative compiler that finds the latent experience inside supplied world reality and projects that experience into the existing runtime.

## Single authority model

```text
INPUT / MEDIA / GEO / MEMORY
          ↓
   Reality Graph
          ↓
      Cognition
          ↓
   ONE selected Movie
          ↓
   Creative Realizer
          ↓
    Story / Sequence
          ↓
 Experience Composition
          ↓
        Runtime
          ↓
   New world evidence
          ↺
```

There is one Reality authority, one Cognition authority, one Movie selection authority, one creative Realizer/Mouth, one experience-composition boundary, one runtime projection boundary, and one persistent world-memory substrate. No competing Author path is permitted.

## Reality

Reality consists of explicit entities, events, states, relations, places, times, evidence, media, provenance, confidence, and uncertainty. Derived interpretation never becomes factual merely because it is useful creatively.

Source evidence outranks interpretation. A figurative realization may be imaginative while remaining anchored to supplied evidence. A new concrete person, place, action, reaction, event, result, dialogue, or chronology is forbidden unless supplied.

Time, geo, photographs, video, receipts, links, and other contextual inputs are real evidence or presentation material. They remain available to the experience system, but they do not automatically become authored story beats.

## Cognition

Cognition reasons over arbitrary domains. It discovers relationships, change, recurrence, temporal context, continuation, attention opportunities, significance, and creative hypotheses. It searches multiple possible Movies and selects exactly one. The downstream Author never re-ranks or replaces that Movie.

Sparse reality is valid. Cognition may produce an observation, preference constellation, callback, possibility, conceptual experience, or other natural form without forcing plot.

Cognition determines the story's justified semantic length from the supplied reality. It must never shorten, fragment, or otherwise deform the story to reserve capacity for photos, geo, timestamps, or other additions.

## Story / sequence

The story is the primary authored experience. A fact can be true and still deserve zero authored language. A rich reality may justify many story beats. A thin reality may justify only a few. There is no universal beat count.

There is no mandatory `hook → develop → turn → payoff` template. Those are possible search shapes, not requirements. The sequence earns its length from meaningful semantic movement, not from an arbitrary duration target and not from the number of attached media items.

The Author must not become a caption generator, event checklist, timestamp reel, or receipt. Event-by-event coverage is acceptable only when that ordering itself is the meaningful experience.

## Experience additions are additive

Photos, video, geo, timestamps, maps, receipts, links, attachments, actions, and similar materials are first-class experience additions. They may appear at the opening, closing, between story beats, attached to a story beat, or in another justified position.

They do not consume or replace story beats. They do not establish a maximum story length. They do not cause Cognition to choose a shorter Movie.

Cognition may determine useful placement for media/context. The final experience may therefore look like:

```text
GEO / ARRIVAL
STORY BEAT
STORY BEAT
PHOTO
STORY BEAT
VIDEO
STORY BEAT
GEO / DEPARTURE
```

A business experience may naturally use geo or place context at the start and end. A before/after experience may place photos around a semantic change. A wedding or other media-rich experience may contain many media items without reducing the authored story to fit them.

The frontend may allow users to reorder experience additions without altering the underlying reality or semantic Movie. Author-created story beats remain grounded and distinct from movable presentation additions.

## Creative realization

The Realizer receives the selected Movie and performs it. Creative freedom is high in framing, attitude, implication, personification, status, irony, understatement, juxtaposition, callbacks, rhetorical questions, rhythm, and genre performance. Reality freedom is zero.

Visible language must speak like a person, not a compiler. Internal terms such as cognition, trajectory, candidate, semantic turn, viewer state, evidence IDs, planner, and narrative structure must never reach the customer.

Every concrete scene carries source-event provenance. Provenance is evidence of grounding, not an instruction to copy source wording.

## Memory

Memory is a world model, not stored prose. Persistent memory should retain entities, facts, relationships, events, places, time, media, provenance, uncertainty, participation, and durable preferences. Creative wording is ephemeral unless explicitly supplied as new reality.

A return visit must resolve remembered history before asking a human for information. New evidence changes the world; creative output changes only the presentation.

## Learning

Learning may adapt creative preference, pacing, lens preference, novelty pressure, or other bounded performance choices. Learning must never mutate source reality or create domain-specific cognition.

## Universal UX

The dashboard should let a person start with whatever reality they know. The interface must not require a rigid five-field story form before QRE can understand the input.

QRE may ask for one high-value missing concrete detail at a time. The user never needs to understand Movie, Frame, RealityGraph, Cognition, Lens, or Mouth.

Creative direction is optional:

- LET QRE DECIDE
- FUNNY
- ROMANTIC
- HORROR
- WILD

Never ask the user to invent the joke, ending, arc, tension, or creative performance.

## Business and network loop

A business supplies an event. QRE creates the experience. The recipient discovers the experience and may become a persistent QRE identity. Future businesses, people, places, products, events, and memories can connect to that identity through the same world model.

```text
BUSINESS
   ↓
EVENT / EXPERIENCE
   ↓
RECIPIENT DISCOVERS QRE
   ↓
IDENTITY / WORLD
   ↓
NEW BUSINESS / PERSON / PLACE / OBJECT
   ↓
NEW EVENT
   ↓
RICHER EXPERIENCE
```

This compounding network is a product objective, not a feature-specific story path.

## File governance

The canonical compiler implementation is exactly four files:

```text
apps/api/src/services/authorRealityGraph.ts
apps/api/src/services/authorCognition.ts
apps/api/src/services/authorCreativeRealizer.ts
apps/api/src/services/authorBrainCanonical.ts
```

All prior Author-only services, creative seed planning, Author-specific acceptance paths, and obsolete Author governance are removed. Runtime, persistence, scan, delivery, and generic learning infrastructure remain outside the Author boundary.

## Testing

The primary acceptance question is not whether an expected phrase appears. It is whether arbitrary human reality becomes a compelling experience without factual loss.

Tests must cover reality conservation, participant/place/time/relationship conservation, memory continuity, creative transformation, lens transformation, semantic movement, anti-caption behavior, no compiler leakage, adaptive reality questions, additive media/context handling, user-controlled addition ordering, and return continuation. Acceptance runs through the real canonical Author path.
