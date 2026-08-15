# QRE SEQUENCE PLAY MODEL

**Status:** ACTIVE
**Branch:** `elite-universal-rebuild-v10`

## The central idea

QRE does not author isolated sentences.

QRE authors a **sequence that plays**.

The mouth is the final realization. The Brain must first decide what the viewer experiences from cut to cut.

## Why the current LatentMovie is insufficient

The current event model is useful as a reality representation:

```text
fact
actor
object
place
stateBefore
stateAfter
order
```

But that is not yet a movie model.

A movie is not:

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

QRE should add a domain-neutral **SequencePlay** layer between world cognition and language realization.

Conceptually:

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
```

Sequence Play is not a screenplay template.

It is the internal model of **what each cut does to attention**.

## What each cut needs to know

Each internal sequence step should be able to represent:

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

Most of these are internal signals. They do not need to appear in the final text.

## The critical distinction

Reality events answer:

> What happened?

Sequence Play answers:

> **Why should this be the next thing the viewer sees?**

The author answers:

> **What is the best way to express that cut?**

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

The rhythm comes from **information pressure**, not word count.

## Why two-word cuts can be powerful

```text
The monster appeared.

Pink bows everywhere.
```

The second line does not merely continue the first.

It **reframes it**.

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

The actual operations should be discovered from the world rather than hardcoded as a universal five-beat template.

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

## Sequence memory

For returning experiences, Sequence Play should also know:

```text
what the viewer already saw
what motif has been used
what expectation the previous chapter created
what can return with changed meaning
what should be avoided as a repeated crutch
```

Therefore a returning chapter is not simply a longer event list.

It is a **new attention trajectory built on an existing audience memory**.

## QRE definition of a successful sequence

```text
CUT 1
↓
viewer understands the world
↓
CUT 2
↓
viewer notices something unexpected
↓
CUT 3
↓
viewer wants to resolve or reinterpret it
↓
CUT 4
↓
payoff changes the meaning of the earlier cuts
```

The sequence can end earlier when the experience is complete.

It can continue when the unresolved state is strong enough to earn another cut.

## Engineering consequence

The next major architecture should not be another prose filter.

It should be a **Sequence Play Engine** that takes a `LatentMovie` and produces a ranked attention trajectory before the author writes any words.

That is the missing middle layer.
