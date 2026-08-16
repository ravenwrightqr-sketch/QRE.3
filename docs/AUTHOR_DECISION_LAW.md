# QRE AUTHOR — DECISION LAW

**Status:** CANONICAL  
**Purpose:** Prevent QRE's author architecture from growing without producing a measurable creative improvement.

## The Law

> **Every new component must demonstrably improve at least one of: discovery, differentiation, momentum, truth, or sentence quality. Otherwise we do not build it.**

QRE is not currently constrained by a lack of architecture. The highest-leverage problem is making the existing brain **decisive**: notice the strongest relationship, choose a genuinely different movie, know how the sequence should move, preserve reality, and turn that decision into excellent lines.

## Five Required Quality Dimensions

### 1. Discovery

Does the change cause QRE to notice a relationship, implication, contrast, callback, character trait, or possibility that the previous system missed?

**Pass evidence:** a before/after case where the new system discovers materially better source-grounded material.

### 2. Differentiation

Does the change cause competing candidates to represent genuinely different interpretations of the same world rather than stylistic rewrites of one idea?

**Pass evidence:** candidate movies differ in premise, relationship, trajectory, or payoff—not merely tone words.

### 3. Momentum

Does the sequence make the viewer want the next cut?

For each cut ask:

```text
What does the viewer know now?
What changed?
What do they expect next?
What remains unresolved?
Why does the next cut need to exist?
```

**Pass evidence:** removing a cut damages the sequence, or the next cut creates a meaningful new viewer state.

### 4. Truth

Does the change preserve source reality while allowing creative framing?

```text
FACT → CANONICAL TRUTH
INFERENCE → CREATIVE INTERPRETATION
UNKNOWN → UNKNOWN
```

**Pass evidence:** no invented people, actions, objects, locations, dates, dialogue, outcomes, or identity claims.

### 5. Sentence Quality

Does the final mouth produce a materially better line?

Judge the actual viewer-facing output—not the planner, graph, metrics, or JSON.

A stronger sentence is typically:

- more specific
- less explanatory
- more characterful
- more surprising
- more compressed
- more imageable
- more emotionally or comically precise
- more connected to the chosen movie

**Pass evidence:** human-readable before/after output where the improvement is visible without inspecting internal metadata.

## The Critical Rule

**Internal sophistication does not count unless it survives into the mouth.**

These are not sufficient by themselves:

```text
more graph relations
higher discovery score
more candidate metadata
more beat fields
more regex filters
more templates
more cognitive labels
more elaborate prompts
```

If the final writing does not improve, the component has not demonstrated value.

## Development Loop

```text
ONE HYPOTHESIS
      ↓
ONE SURGICAL CHANGE
      ↓
ONE REAL ACCEPTANCE RUN
      ↓
READ THE ACTUAL SEQUENCE + CUTS
      ↓
COMPARE BEFORE / AFTER
      ↓
KEEP OR KILL
      ↓
RECORD THE LEARNING
```

Do not change seven systems and then guess what helped.

## Current Priority Order

When choosing the next engineering change, prefer this order:

1. **Sentence quality** — if the mouth is weak, fix the path that produces the line.
2. **Momentum** — if lines are individually good but the sequence is dead, fix viewer-state movement.
3. **Discovery** — if the sequence has nothing interesting to work with, improve relationship discovery.
4. **Differentiation** — if all movies feel alike, improve creative competition and attack.
5. **Truth** — always a hard constraint; creative gains never justify factual invention.

Truth is a floor, not a tradeable score.

## Pass 3 — Mouth Grounding Law

The current highest-leverage failure is downstream of discovery: the Mouth can receive a valid semantic beat but still write a generic line because the realization payload does not contain enough source material to realize that beat precisely.

**Pass 3 rule:** the Mouth must be given the concrete source world needed to write the selected beat, and every realized line must remain anchored to that world.

The realization payload should carry, at minimum:

```text
prompt
lens
subject
place
facts
source moments
memory
trajectory
reality graph / beat source event IDs
selected beat
previous realized lines
```

The Mouth is not allowed to solve missing source material by inventing atmosphere, setting, action, objects, outcomes, or emotional events.

### Pass 3 failure signature

These are evidence of a failed realization path:

```text
valid beat → generic line
valid source → invented imagery
valid movie → unrelated sentiment
valid event → unsupported setting
```

For example, a source containing `Coco / returned / happy / fun / bows / balls / ties / male` should not suddenly produce an unsupported image such as a sunset or an invented homecoming scene.

### Pass 3 acceptance test

A successful run should show:

1. the chosen movie survives into the beat plan;
2. the beat retains source event IDs where available;
3. the Mouth receives the source evidence for that beat;
4. the line uses at least one concrete source-grounded element or a clearly grounded relationship;
5. the line does not merely paraphrase the planner;
6. cut policy accepts the line without weakening truth;
7. the final sequence is materially better to a human reader.

**Do not add another brain for this. Do not add a template. Do not add domain-specific prose. Fix the existing path from selected beat → source evidence → Mouth → cut policy.**

## What We Are Explicitly NOT Doing

Do not solve weak creativity by automatically adding:

- another domain-specific brain
- another fixed template
- another permanent beat count
- another emotional arc
- another pile of phrase bans
- hardcoded subject behavior
- more metadata that never reaches the mouth
- complexity whose only proof is that the architecture looks more sophisticated

The universal brain should become better at **choosing**, not merely better at producing more intermediate artifacts.

## Acceptance Standard

A meaningful author change should be evaluated against multiple benchmark classes, not only one Coco prompt:

```text
COCO              universal character baseline
COCO-RETURN       living memory / changed-meaning callback
MARIA             ordinary service / no invention
HORROR            genre reframing
RAVE              radically different energy
SPARSE            little source material / truth discipline
```

The change passes only if it improves the intended dimension without materially regressing truth or another core dimension.

## Definition of Rapid Advancement

We are winning when this happens:

```text
ordinary source
   ↓
QRE notices something specific
   ↓
QRE chooses a strong interpretation
   ↓
QRE knows what the viewer should experience next
   ↓
QRE cuts aggressively
   ↓
QRE writes a line we would not have predicted from the raw prompt
   ↓
truth remains intact
   ↓
payoff feels earned
```

The goal is not a larger author system.

**The goal is a more decisive author.**
