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
MOVIE BEAT PLAN
  ↓
text beats + optional silent photo beats + CTA
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

## MovieBeatPlan

`MovieBeatPlan` is the canonical timeline decision object between authoring and the player.

It answers one question:

> **What exactly should play, in what order, and why?**

A plan contains:

- `text` beats produced by the Mouth
- `photo` beats selected from existing media evidence
- optional `cta` as the terminal action
- source IDs for traceability
- per-beat reason for selection
- duration hints
- attention roles
- silent-media enforcement
- auto vs manual presentation mode
- selected media IDs
- estimated runtime

The player consumes the plan; the player does not decide which evidence belongs in the movie.

## Media organization

Default mode is **auto**.

Cognition may organize an unordered media dump using available evidence such as:

- observed timestamps
- explicit before/after labels
- service-stage labels
- media role (`evidence`, `memory`, `photo_beat`)
- chronology
- relevance to the selected movie

A deterministic media organizer is intentionally kept outside the database and storage layer. It only chooses a playable plan from supplied media; it does not mutate historical truth.

### Example: groomer

```text
MEGA DUMP
before Coco
bath complete
after Coco
blue bow incident
final after photo
```

QRE can produce:

```text
TEXT
Coco came in nervous.

PHOTO
before

TEXT
The bath changed everything.

PHOTO
after

TEXT
Then Coco found the blue bow.

PHOTO
blue-bow evidence

TEXT
Coco left looking fabulous.

PHOTO
final after

CTA
Want to keep Coco's story?
```

The groomer does not need to manually arrange the media.

If a human explicitly wants a different order, the Dashboard becomes the override surface.

## Default organization vs Dashboard override

The default product behavior is **Cognition organizes the experience**.

Users do not need to manually arrange a timeline just to get a good result.

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

## Implementation checkpoint

The canonical `MovieBeatPlan` contract, deterministic media-to-plan organizer, and acceptance test are now in the author stack.

The planner is intentionally pure and storage-agnostic. It prefers chronology and explicit before/after evidence, keeps photo beats silent, supports a default five-text-beat attention unit, and allows an explicit CTA at the end.

The remaining runtime seam is to have the existing experience assembly consume `MovieBeatPlan` as the single timeline owner instead of independently mapping authored scenes. That is the next integration target.

## Non-negotiable boundaries

1. IdentityState is the accumulated world model.
2. CognitiveAuthorContext is the canonical author packet.
3. Super Cog decides what is interesting and what movie should happen.
4. Mouth renders the selected movie; it does not invent the world.
5. MovieBeatPlan is the single timeline decision object.
6. Provenance gates final authored output.
7. Photos are evidence and cinematic beats, not generated prose.
8. Player owns exact visual presentation.
9. Five-ish text beats are the default attention unit; accumulated experiences may be longer.
10. Cognition organizes by default; Dashboard is the explicit override.
11. All meaningful new interactions feed memory and analytics.
12. The system must remain one universal brain with domain cognition, not separate domain brains.
