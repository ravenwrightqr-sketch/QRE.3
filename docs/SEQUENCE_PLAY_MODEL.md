# QRE SEQUENCE PLAY MODEL

**Status:** ACTIVE / CANONICAL
**Date:** 2026-09-05
**Branch:** `build/universal-author-local`

## The central idea

QRE does not author isolated sentences or force every reality into the same number of beats.

QRE authors a **primary story that plays**. The story owns the semantic experience. Photos, video, geo, time, maps, receipts, links, and other contextual material are additive experience elements and must never make Cognition shorten or weaken that story.

## Why event lists are insufficient

An event model can represent:

```text
fact
actor
object
place
stateBefore
stateAfter
order
```

But a movie is not:

```text
thing happened
thing happened
thing happened
```

A movie is:

```text
viewer knows X
↓
cut adds Y
↓
viewer predicts Z
↓
cut violates or sharpens Z
↓
meaning changes
↓
new question forms
↓
payoff lands
```

## The sequence layer

QRE should maintain a domain-neutral `SequencePlay` layer between world cognition and language realization.

```text
WORLD TRUTH
    ↓
EVENT / MEMORY GRAPH
    ↓
SIGNIFICANCE
    ↓
SEQUENCE PLAY
    ↓
AUTHOR MOUTH
    ↓
EXPERIENCE COMPOSITION
```

Sequence Play is not a screenplay template. It is the internal model of what each **story cut** does to attention.

## Story beats versus additions

A critical invariant:

```text
STORY BEAT ≠ MEDIA ADDITION
STORY BEAT ≠ GEO ADDITION
STORY BEAT ≠ TIMESTAMP DISPLAY
STORY BEAT ≠ MAP / RECEIPT / LINK
```

These additions may appear in the final ordered experience, but they do not consume story capacity.

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

The story in this example has four story beats, even though the composed experience has eight ordered elements.

Cognition must choose four story beats because four are justified by the story, not because two media items were reserved. It must also be free to choose six, ten, twenty, or more when the reality earns that length.

## What each story cut needs to know

Each internal story step should be able to represent:

```text
knownBefore
newInformation
attentionChange
openLoop
expectation
reframe
characterPressure
worldPressure
energy
novelty
callback
payoffPotential
continuationPressure
```

Most of these are internal signals. They do not need to appear in final text.

## The critical distinction

Reality events answer:

> What happened?

Sequence Play answers:

> **Why should this be the next story cut?**

The author answers:

> **What is the best way to express that cut?**

Experience composition answers:

> **What media, context, and actions should accompany the story without weakening it?**

These are different jobs and must not collapse into one prompt.

## Sweet-spot rhythm

The author should not force a fixed beat count.

The sequence should find its own cadence.

Possible cadence:

```text
micro-hit
→ image
→ reveal
→ micro-hit
→ escalation
→ payoff
```

Or:

```text
image
→ contradiction
→ tiny callback
→ payoff
```

Or:

```text
short
→ short
→ longer reveal
→ short
```

The rhythm comes from information pressure, not word count and not media count.

## Media-rich experiences

A wedding, vacation, pet history, major event, or other rich input may contain dozens of photographs or other media items.

Those items do not cause the story to become shorter.

Launch tiers may limit:

```text
media count
storage
processing
AI generation
render complexity
```

Those are product-resource controls, not creative beat limits.

## Before / after media

Cognition may identify a meaningful semantic change and associate media with it.

Example:

```text
BEFORE PHOTO
STORY: supplied problem / state
STORY: change
AFTER PHOTO
STORY: resulting meaning
```

The photographs support the story. They do not replace the story.

## Contextual openings and endings

A business or place experience may naturally use context as an opening or closing element:

```text
GEO / ARRIVAL
STORY
STORY
STORY
GEO / DEPARTURE
```

The geo elements are part of the final experience order, but they are not story beats.

## User-controlled composition

The frontend may expose an ordered experience timeline and allow the user to move additive elements.

User reordering changes presentation order only. It must not alter:

```text
source reality
provenance
selected Movie
story wording authority
```

## Why two-word cuts can be powerful

```text
The monster appeared.

Pink bows everywhere.
```

The second line does not merely continue the first. It reframes it.

The viewer supplies part of the connection.

That gap is attention.

## What a weak sequence does

```text
Coco barks.
Coco sees bow.
Coco gets treat.
Coco wags.
Coco leaves.
```

Every line is merely another event.

Nothing changes what the viewer expects.

## What a stronger sequence seeks

```text
establish
→ disturb
→ reframe
→ escalate
→ pay
```

The actual operations must be discovered from the world rather than hardcoded as a universal five-beat template.

## Character continuity

The subject should remain psychologically present even when its name disappears.

This means the sequence can use:

```text
attitude
choice
resistance
preference
relationship to an object
callback
consequence
```

The mouth should prefer:

> **new information with implied subject**

over:

> **subject name + narrated action**

when identity is already established.

## World fidelity

Sequence Play may rearrange emphasis, juxtapose known facts, compress time, and create implications.

It may not invent physical events.

Allowed:

```text
reframe a known detail
juxtapose two known facts
return to a known motif
change the meaning of a known object
compress a known sequence
```

Not allowed:

```text
invent a new person
invent a new action
invent a new outcome
invent a new physical event
invent a new relationship
```

## QRE definition of a successful sequence

```text
STORY CUT 1
↓
viewer understands something
↓
STORY CUT 2
↓
viewer notices something unexpected
↓
STORY CUT 3
↓
meaning shifts / tension rises / callback lands
↓
STORY CUT 4+
↓
payoff or earned continuation
```

Then optional experience additions enrich the presentation:

```text
+ photo
+ geo
+ video
+ map
+ timestamp
+ action
```

The sequence can end earlier when the story is complete. It can continue when the reality earns another story cut.
