# QRE COG AUTHOR CONTEXT — CANONICAL

## Purpose

This document defines the canonical path from a user's one-shot mega dump to a grounded, adaptive cinematic experience and the universal learning loop that makes the next experience richer.

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
text beats + optional silent photo beats + optional business CTA
  ↓
EXPERIENCE SERVICE RENDERING
  ↓
SequencePlay / cinematic runtime
  ↓
scan / replay / contribution / update
  ↓
UNIVERSAL LEARNING WRITE-BACK
  ↓
MEMORY + ANALYTICS + CREATIVE LEARNING
  ↓
stronger IDENTITY STATE
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
- optional `cta` as the terminal business action
- source IDs for traceability
- per-beat reason for selection
- duration hints
- attention roles
- silent-media enforcement
- auto vs manual presentation mode
- selected media IDs
- estimated runtime

The **Author Movie Pipeline** now produces the `MovieBeatPlan` immediately after the universal author selects/accepts the movie.

The existing `experienceService` consumes that plan and renders it into the runtime experience. It no longer independently decides the author timeline.

```text
SUPER COG
  ↓
MOUTH / AUTHOR RESULT
  ↓
AUTHOR MOVIE PIPELINE
  ↓
MOVIE BEAT PLAN       ← SINGLE TIMELINE OWNER
  ↓
EXPERIENCE SERVICE    ← RENDERER / ADAPTER
  ↓
PLAYER
```

The player consumes the resulting runtime beats; the player does not decide which evidence belongs in the movie.

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

CTA (only when explicitly configured)
BOOK AGAIN
```

Without an explicit business CTA, the movie simply lands on its ending/personality surface; the core story does not become an advertisement.

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

## Ending architecture

The story payoff, personality landing, portal action, and business CTA are distinct concepts.

Default:

```text
STORY PAYOFF
   ↓
tiny visual pause
   ↓
optional QRE personality landing
```

Only add an action when there is a real destination or explicit business configuration:

```text
business plan + configured CTA
→ business CTA

real portal exists
→ portal action

otherwise
→ no sales CTA required
```

The default QRE personality pool is intentionally short, strange, and non-SaaS. Examples include:

```text
The End, Never.
Never Ending Story.
Oops. I Did It Again.
Build...
Naturally.
Again?
For Now.
Obviously.
There It Is.
Alive.
```

These are personality landings, not generic conversion buttons.

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

## Universal learning loop

Learning is not a dashboard the user must study.

The system treats accepted user input and legitimate experience outcomes as identity-scoped evidence.

```text
new user input
→ reality typing / provenance
→ memory projection
→ identity-scoped memory write-back
→ AUTHOR_INPUT_ACCEPTED analytics signal
→ stronger IdentityState on next load
→ richer CognitiveAuthorContext
→ new movie selection
```

Runtime outcomes extend the same loop:

```text
rendered experience
→ scan / replay / contribution / save / completion / rejection
→ memory + analytics + creative learning
→ stronger identity state
→ better movie selection
→ better next experience
```

The universal learning coordinator is `authorLearningLoop.ts`. It deliberately reuses the existing `MemoryRepository` and `AnalyticsRepository` rather than creating a second persistence system.

Learning is identity-scoped by `assetId` and user-scoped where available. One user's pet, business, memorial, property, event, or personal world must never leak into another identity.

Learning changes future selection and significance; it must not rewrite historical evidence merely because a pattern was inferred.

## Implementation checkpoint

The following author stack is now wired and acceptance-covered:

- `CognitiveAuthorContext`
- `MovieBeatPlan`
- deterministic media-to-plan organizer
- `authorMoviePipeline`
- `experienceService` consumption of `MovieBeatPlan`
- silent photo beats
- default auto organization
- manual Dashboard override
- optional terminal business CTA
- explicit user endpoint authority
- provenance gate
- universal learning coordinator contract + acceptance

The next integration target is post-play outcome write-back: scan, replay, contribution, save/completion, and creative feedback should all feed the same identity-scoped learning path so future `CognitiveAuthorContext` becomes measurably richer.

## Acceptance sequence

```text
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build
pnpm --filter @qre/api author:cognitive-context
pnpm --filter @qre/api author:movie-beat-plan
pnpm --filter @qre/api author:movie-pipeline
pnpm --filter @qre/api author:full-circle
pnpm --filter @qre/api author:learning-loop
pnpm --filter @qre/api author:fast
```

`author:full-circle` proves the current author-to-timeline seam for a Coco-style scenario: full cognitive context, media evidence, five text beats, silent photo beats, no default CTA, explicit business CTA override, and manual Dashboard override.

`author:learning-loop` proves identity-scoped memory write-back, the accepted-input analytics signal, visibility of new evidence in the next memory summary, and cross-identity isolation.

## Non-negotiable boundaries

1. IdentityState is the accumulated world model.
2. CognitiveAuthorContext is the canonical author packet.
3. Super Cog decides what is interesting and what movie should happen.
4. Mouth renders the selected movie; it does not invent the world.
5. MovieBeatPlan is the single timeline decision object.
6. ExperienceService renders the plan; it does not choose a competing author timeline.
7. Provenance gates final authored output.
8. Photos are evidence and cinematic beats, not generated prose.
9. Player owns exact visual presentation.
10. Five-ish text beats are the default attention unit; accumulated experiences may be longer.
11. Cognition organizes by default; Dashboard is the explicit override.
12. Business CTAs are opt-in; default experiences do not become ads.
13. Accepted user input and legitimate runtime outcomes feed identity-scoped memory, analytics, and learning.
14. Learning may change future selection but never silently overwrite historical reality.
15. The system must remain one universal brain with domain cognition, not separate domain brains.
