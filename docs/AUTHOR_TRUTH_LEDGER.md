# QRE AUTHOR — TRUTH LEDGER HISTORICAL MILESTONE

**Status:** HISTORICAL / LESSON PRESERVED
**Original milestone:** 2026-08-15
**Current authority:** `docs/AUTHOR_CURRENT_STATE.md`, `docs/AUTHOR_ARCHITECTURE_INDEX.md`, and `docs/AUTHOR_WIRING_MAP.md`

> This document preserves the engineering lesson discovered during the truth-ledger milestone. Its historical implementation references must not be treated as the current code path.

## What we tested

The fast COCO author repeatedly produced:

- subject re-introduction
- provider characters that were not established
- inferred emotions
- comma-packed multi-shot sentences
- invented physical events and object placements
- padded sequences made to satisfy a target beat count

## What we learned

A bag of strings is not enough for an enterprise creative compiler.

The author needs to distinguish:

```text
IDENTITY
FACT
SOURCE MOMENT
MEMORY
TRAJECTORY
PREFERENCE
PRESENCE
```

Those categories have different authority.

### Canonical truth principle

```text
identity truth
     ↓
observed facts
     ↓
supplied source moments
     ↓
memory / continuity
     ↓
presence / runtime context
     ↓
creative preference
```

Preferences can guide creativity but can never become facts.

## Durable canonical rule

**Creative freedom may transform meaning, but may not create new reality.**

Allowed:

```text
compression
juxtaposition
reframing
implication
callback
understatement
escalation from established material
object personification when clearly figurative
```

Not allowed without evidence:

```text
new people
new staff
new dialogue
new physical actions
new object placement
new locations
new outcomes
new weather
new relationships
new private emotions
```

## Why this matters

The target is not a more restrictive author.

The target is an author that becomes **more inventive because the world model is stronger**.

The model should spend its intelligence asking:

> What is the most interesting thing already hiding here?

rather than:

> What extra event can I invent to make this feel like a story?

## Historical implementation milestone

The original implementation used an author-side `sourceLedger` and an earned-cut constraint. Those were stepping stones toward the current typed source-truth / RealityGraph architecture.

The old `authorBrain.ts` implementation referenced by the original milestone is **retired** and is not part of the current production author path.

The current architecture instead routes through:

```text
SOURCE TRUTH / PROVENANCE
   ↓
REALITY GRAPH
   ↓
COGNITION
   ↓
LATENT MOVIE SEARCH
   ↓
MOVIE DIFFERENTIATION
   ↓
MASTER AUTHOR
   ↓
MOUTH
   ↓
FINAL EXPERIENCE SCENES
```

See the live references:

```text
docs/AUTHOR_CURRENT_STATE.md
docs/AUTHOR_ARCHITECTURE_INDEX.md
docs/AUTHOR_WIRING_MAP.md
docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md
```

## What survived the milestone

The following rules remain canonical:

```text
reality is immutable
creative interpretation is not evidence
identity is not a plot instruction
emotion is evidence, not an automatic story arc
sparse input should reduce invented-world surface
truth is necessary but truth alone is not attention
one cut should represent one attention moment
sequence meaning must accumulate
```

These principles now live in the current author/cognition architecture rather than in the retired implementation that first demonstrated them.
