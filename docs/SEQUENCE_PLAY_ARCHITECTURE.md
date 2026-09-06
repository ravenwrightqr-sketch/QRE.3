# QRE SEQUENCE PLAY ARCHITECTURE

**Status:** CANONICAL DIRECTION
**Date:** 2026-09-05
**Branch:** `build/universal-author-local`

## Why this exists

QRE does not produce a list of events and then decorate them with prose.

The experience is consumed as an ordered composition. The primary authored story carries the semantic experience. Context and media enrich that experience without shrinking or fragmenting the story.

Each story cut should change what the viewer knows, expects, suspects, wants, or understands. A contextual or media addition can support that movement, but it does not count as an authored semantic beat merely because it exists.

## Separation

```text
REALITY GRAPH
  what exists / what happened / confidence / provenance / media / context
          ↓
WORLD MEANING
  significance / relationship / history / continuity
          ↓
SEQUENCE PLAY
  viewer-state transitions across the authored story
          ↓
UNIVERSAL AUTHOR
  language realization
          ↓
EXPERIENCE COMPOSITION
  story + additive media/context/actions in one ordered experience
          ↓
CINEMATIC RUNTIME
```

### Reality is not sequence

A fact can be true and still deserve zero authored language.

Time, GPS, place context, photographs, video, receipts, links, and similar material remain available to the experience. They do not automatically become story beats.

### Sequence is not a template

There is no universal required order such as:

```text
hook → develop → turn → payoff
```

Those are possible roles, not mandatory beats.

The story earns its own length from meaningful semantic movement. It is never shortened merely to make room for media or metadata.

## The new mental model

A story cut is valuable when it changes the viewer state.

```text
VIEWER BEFORE
   ↓
STORY CUT
   ↓
VIEWER AFTER
```

The system should privately reason about:

- what is already known
- what is expected
- what remains unresolved
- what the viewer currently wants
- what just changed
- what the next cut could make possible
- whether the current device has become predictable

These reasoning signals must not leak into customer-facing language.

## Attention trajectory

The target is:

```text
CUT 1
  ↓
new information
  ↓
new expectation
  ↓
CUT 2
  ↓
meaning shifts
  ↓
CUT 3
  ↓
consequence / discovery / payoff
```

The exact trajectory depends on the material.

Examples:

```text
ordinary → strange → implication → reveal
ordinary → ridiculous → escalation → absurd payoff
safe → strange → uncertain → threat → escape
known → contradiction → reframe → realization
character → challenge → unexpected choice → consequence
```

These are search shapes, not templates.

## Story length

There is no universal story beat count.

A thin input may deserve three excellent cuts. A rich reality may deserve ten, twenty, or more. A wedding, travel record, major event, or other media-rich experience is not required to become short because it also contains many photographs.

A product tier may limit media count, storage, processing, or other resource usage. Those limits must not become hidden creative constraints on the story.

## Additive experience material

Experience composition has separate additive material:

```text
STORY
  ↓
+ GEO / PLACE
+ TIME / DATE
+ PHOTO / VIDEO
+ MAP
+ RECEIPT / LINK
+ ACTION
+ OTHER CONTEXT
```

Additions may be positioned before, between, after, or alongside story cuts.

Example:

```text
GEO / ARRIVAL
STORY
STORY
PHOTO
STORY
VIDEO
STORY
GEO / DEPARTURE
```

A business location may naturally open and close an experience. Before/after photos may surround a real semantic change. A photograph can live beside the beat whose meaning it supports. None of these additions consumes a story beat.

The frontend may permit users to reorder additions. User ordering changes presentation order, not reality truth and not the selected Movie.

## Short cuts

Short cuts are not inherently better.

They work when they maximize information density and leave a useful gap.

```text
The monster appeared.
Pink bows everywhere.
```

The second line does not explain the first. It changes the viewer's model of the first.

The same principle applies to long cuts: length is justified when it carries more semantic movement, not because QRE needs to fill a quota.

## Subject gravity

The subject remains the temporary star after identity is established.

The author may stop naming the subject while continuing to show the subject's world.

```text
subject established
    ↓
subject remains present
    ↓
name becomes optional
    ↓
attention goes to what changes
```

## Entity use

Other entities are not automatically characters.

A provider, owner, employee, customer, partner, object, place, or service can appear only when its presence changes the subject's world in a meaningful way.

The data model may say `owner`.

The movie may never use the word `owner`.

## Creative freedom boundary

The author may:

- compress
- reorder
- juxtapose supplied facts
- reframe known details
- exploit established contradictions
- build implication from known history
- change the meaning of a callback
- select what stays offscreen

The author may not invent new reality merely because the sequence needs another beat.

## Quality model

QRE evaluates the authored story at three layers:

```text
TRUTH
Is this supportable?

MOVEMENT
Did the viewer state actually change?

CREATIVITY
Was the change specific and hard to predict?
```

Then QRE evaluates composition:

```text
STORY INTEGRITY
Did additions enrich rather than replace the story?

COMPOSITION
Are media/context placed usefully without forcing story compression?
```

A sequence that is truthful but produces no movement is not good.

A sequence with movement but invented facts is invalid.

A valid sequence that is obvious is unfinished.

A rich experience with lots of media is not a better experience merely because it contains more media.

## Current implementation

`SequencePlay` from `@qre/contracts` models the semantic attention trajectory before language realization. Experience composition then combines the authored story with additive materials.

The model is free to use 2, 3, 4, or more story cuts when justified. The story should earn its length.

## Definition of success

When a user gives QRE an ordinary input, the system should first discover:

> **What is the movie hiding in this reality?**

Then:

> **How should that movie play from cut to cut?**

Then:

> **What words should appear on those cuts?**

Then:

> **What supporting media and context make the experience richer without taking anything away from the movie?**

That is the current compiler direction.
