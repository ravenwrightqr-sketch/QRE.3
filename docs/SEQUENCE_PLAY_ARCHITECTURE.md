# QRE SEQUENCE PLAY ARCHITECTURE

**Status:** CANONICAL DIRECTION
**Date:** 2026-08-15
**Branch:** `elite-universal-rebuild-v10`

## Why this exists

QRE does not produce a list of events and then decorate them with prose.

The experience is consumed as a sequence. Each cut changes what the viewer knows, expects, suspects, wants, or understands.

The old `LatentMovie` concept was too event-centric:

```text
actor + action + object + stateAfter
```

That describes chronology. It does not describe how the show plays.

## New separation

```text
REALITY GRAPH
  what exists / what happened / confidence
          ↓
WORLD MEANING
  significance / relationship / history / continuity
          ↓
SEQUENCE PLAY
  viewer-state transitions across cuts
          ↓
UNIVERSAL AUTHOR
  language realization
          ↓
CINEMATIC RUNTIME
```

### Reality is not sequence

A fact can be true and still deserve zero screen time.

### Sequence is not a template

There is no universal required order such as:

```text
hook → develop → turn → payoff
```

Those are possible roles, not mandatory beats.

The Brain chooses the smallest sequence that creates meaningful forward motion.

## The new mental model

A cut is valuable when it changes the viewer state.

```text
VIEWER BEFORE
   ↓
CUT
   ↓
VIEWER AFTER
```

The model should privately reason about:

- what is already known
- what is expected
- what remains unresolved
- what the viewer currently wants
- what just changed
- what the next cut could make possible
- whether the current device has become predictable

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

## Short cuts

Short cuts are not inherently better.

They work when they maximize information density and leave a useful gap.

```text
The monster appeared.
Pink bows everywhere.
```

The second line does not explain the first. It changes the viewer's model of the first.

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

QRE evaluates the sequence at three layers:

```text
TRUTH
Is this supportable?

MOVEMENT
Did the viewer state actually change?

CREATIVITY
Was the change specific and hard to predict?
```

A sequence that is truthful but produces no movement is not good.

A sequence with movement but invented facts is invalid.

A valid sequence that is obvious is unfinished.

## Current implementation target

The first production implementation uses `SequencePlay` from `@qre/contracts`.

The contract is intentionally semantic and flexible:

```text
SequencePlay
  → opening viewer state
  → ordered cuts
  → before/after viewer state
  → attention delta
  → next promise
  → payoff connection
  → continuity / anti-crutch / continuation
```

The model is free to use 2, 3, 4, or more cuts when justified. The sequence should earn its length.

## Next engineering move

1. Make universal cognition produce `SequencePlay` before prose.
2. Make the author realize `SequencePlay` into cuts.
3. Make the critic score viewer-state movement rather than phrase cleverness.
4. Make memory store sequence history, not only factual history.
5. Keep domain specialists outside the sequence logic.

## Definition of success

When a user gives QRE an ordinary input, the system should first discover:

> **What is the movie hiding in this reality?**

Then:

> **How should that movie play from cut to cut?**

Only then:

> **What words should appear on each cut?**

That is the core compiler direction.
