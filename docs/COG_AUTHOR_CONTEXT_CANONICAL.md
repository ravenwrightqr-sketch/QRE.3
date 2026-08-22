# QRE COG AUTHOR CONTEXT — CANONICAL

## Purpose

This document defines the canonical path from a user's one-shot mega dump to a grounded, adaptive cinematic experience.

The UI does not require the user to understand the internal structure. They can provide a messy dump of facts, memories, locations, updates, goals, photos, and instructions. Cognition organizes it.

## Canonical loop

```text
MEGA DUMP
  ↓
reality typing / evidence extraction
  ↓
MEMORY + GEO + PRESENCE + ANALYTICS + CREATIVE LEARNING + DOMAIN COGNITION + MEDIA
  ↓
IDENTITY STATE
  ↓
COGNITIVE AUTHOR CONTEXT
  ↓
SUPER COG
  ↓
movie hypotheses / tension / state change / callbacks / payoff
  ↓
selected movie trajectory
  ↓
MOUTH
  ↓
provenance + quality gate
  ↓
text beats + optional silent photo beats
  ↓
SequencePlay / cinematic runtime
  ↓
scan / replay / contribution / update
  ↓
MEMORY + ANALYTICS
  ↓
next experience is richer
```

## CognitiveAuthorContext

`CognitiveAuthorContext` is the structured packet that keeps IdentityState from being flattened into unrelated strings before cognition.

It preserves:

- IdentityState
- Geo semantic role and time
- Presence and return state
- Behavioral analytics
- Domain cognition
- Creative learning
- Provenance facts
- Media evidence
- Explicit user creative instructions
- Default text beat target
- Silent-photo rule
- Presentation authority mode

Existing flattened `AuthorBrainTruth` fields remain during migration for compatibility.

## Default organization vs Dashboard override

The default product behavior is **Cognition organizes the experience**.

Users do not need to manually arrange a timeline just to get a good result.

```text
MEGA DUMP
  ↓
Cognition classifies
  ↓
Cognition orders by evidence, chronology, recurrence, state change, and attention
  ↓
Cognition selects the strongest text/photo sequence
```

The Dashboard is the intentional override surface.

A user can enter the Dashboard when they want to explicitly control layout, ordering, grouping, or presentation.

```text
AUTO MODE
→ cognition owns organization

MANUAL MODE
→ dashboard owns explicit arrangement
```

Manual arrangement is an instruction and does not rewrite the underlying historical evidence.

## Five-ish attention unit

Five is the default text attention unit because the experience is designed as rapid cinematic cuts:

```text
beat 1 → cut
beat 2 → cut
beat 3 → cut
beat 4 → cut
beat 5 → payoff
```

Five is not the lifetime limit.

A persistent QRE asset can accumulate more material over time. Photos, guest contributions, new service events, memories, chapters, and updates can extend the experience.

The default short sequence should remain fast even when the accumulated world becomes large.

## Photo beat rule

Photos are first-class cinematic beats, not captions.

A photo beat:

- has media evidence
- may extend the sequence beyond the default text beat target
- has no generated words by default
- does not get a fictional caption
- lets the player decide layout, crop, transition, and exact presentation
- may contain text only when that text is actually part of the source image/media

The cognition layer chooses whether a photo is worth the attention slot. The player owns presentation.

### Example: service / groomer dump

A groomer can drop photos and service facts in any order:

```text
before Coco
bath complete
blue bow incident
after Coco
another before photo
final after photo
```

Cognition may recognize the service domain, timestamps, before/after relationships, recurring motifs, and strongest visual evidence and automatically organize the movie as:

```text
TEXT: Coco came in nervous.
PHOTO: before
TEXT: The bath changed the whole mood.
PHOTO: after
TEXT: Then Coco found the blue bow.
PHOTO: blue-bow evidence
TEXT: Coco left looking fabulous.
PHOTO: final after
```

The groomer does not have to manually sort the photos.

When explicit ordering is important, the groomer can use the Dashboard override.

## User authority vs reality authority

Two different things must never be conflated:

### Observed reality

Must be grounded in supplied evidence. The model may not invent a new person, place, object, private fact, relationship, literal event, body detail, or chronology.

### User-authorized creative instruction

The user may explicitly authorize a creative endpoint, framing, or requested line. That instruction is not a model inference and must not be treated as a hallucinated fact.

Example:

```text
Reality:
"the DJ changed the song"
"everyone moved to the floor"
"the couple stayed up front"

User instruction:
Final line: Nobody wanted the night to end.
```

The Mouth must reproduce an explicitly authorized endpoint exactly when requested, while remaining grounded everywhere else.

## Domain neutrality

No separate brain should be created for groomers, lawyers, weddings, restaurants, memorials, artists, real estate, mechanics, etc.

Each domain contributes typed evidence and domain-specific cognitive opportunities to the same universal author system.

Examples:

```text
pet → identity + personality + care history + social behavior
service → receipt facts + status change + customer attention
law → case facts + chronology + procedural milestones + professional promotion
wedding → event state + guest contribution window + memories + media
memorial → sensitive memory + tribute media + careful provenance
person → identity + relationships + goals + evolving life history
```

## Contribution lifecycle

A persistent QR may temporarily open a contribution mode.

```text
QR OPEN
  ↓
guests / staff / family contribute
  ↓
evidence + media captured
  ↓
provenance recorded
  ↓
cognition recomputes world state
  ↓
new movie opportunities appear
  ↓
QR CLOSES contribution window
  ↓
world remains readable and replayable
```

This supports weddings, events, memorials, travel, parties, service follow-ups, pet updates, and other time-bounded collaborative experiences.

## Learning loop

Learning is not a dashboard the user must study.

The system learns automatically from legitimate signals:

```text
event
→ rendered experience
→ scan / replay / contribution / save / completion / rejection
→ memory + analytics + creative learning
→ stronger identity state
→ better movie selection
→ better next experience
```

Learning changes future selection, not historical reality.

## Non-negotiable boundaries

1. IdentityState is the accumulated world model.
2. CognitiveAuthorContext is the canonical author packet.
3. Super Cog decides what is interesting and what movie should happen.
4. Mouth renders the selected movie; it does not invent the world.
5. Provenance gates final authored output.
6. Photos are evidence and cinematic beats, not generated prose.
7. Player owns exact visual presentation.
8. Five-ish text beats are the default attention unit; accumulated experiences may be longer.
9. Cognition organizes by default; Dashboard is the explicit override.
10. All meaningful new interactions feed memory and analytics.
11. The system must remain one universal brain with domain cognition, not separate domain brains.
