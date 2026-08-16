# QRE AUTHOR — LATENT MOVIE SEARCH

**Status:** ACTIVE / CANONICAL
**Date:** 2026-08-15
**Branch:** `qre/latent-movie-search-v1`
**Purpose:** Preserve the engineering truth for the layer between Reality and the Author's beat trajectory.

> **Reality is immutable. A movie is a hypothesis about how that reality could play.**

## 1. WHY THIS FILE EXISTS

QRE was repeatedly producing planning labels instead of movie moves:

```text
Discover Coco's backstory.
Coco's feelings.
The unexpected.
Show transformation.
```

Those are analysis labels. They do not tell the system what should happen to the viewer from cut to cut.

The missing intelligence is a search layer that asks:

```text
Given exactly what happened,
what different movies are latent inside those relationships?
```

This file is the detailed reference. Do not replace this architecture with a prompt, a template list, or a domain-specific branch.

## 2. CANONICAL PIPELINE

```text
SOURCE INPUT
    ↓
REALITY GRAPH
    ↓
LATENT MOVIE CANDIDATE SEARCH
    ↓
COGNITION
    ↓
TRAJECTORY SEARCH
    ↓
MAGNET / CUT NECESSITY
    ↓
SENTENCE CUTS
    ↓
MOUTH
```

The graph owns **what exists and how supplied evidence relates**.

Latent Movie Search owns **competing interpretations of those relationships**.

Cognition owns **which interpretation is useful for the current authoring context**.

Trajectory owns **the viewer-state path**.

The Mouth owns **language realization only**.

## 3. CONTRACTS

Canonical shared types live in:

```text
packages/contracts/src/experience/realityGraph.ts
packages/contracts/src/experience/latentMovie.ts
```

`RealityGraph.latentMovieCandidates` is derived data only. It must never be treated as source evidence.

`LatentMovieCandidate` contains:

```text
id
lens
anchorEventIds
supportingRelationKinds
trajectory
payoff
unresolvedQuestion
evidence
hypothesis
truthRisk
novelty
specificity
informationValue
uncertainty
attentionPotential
consequencePotential
callbackPotential
compressionPotential
repetitionRisk
score
```

A candidate is a **hypothesis**, never a fact.

## 4. SEARCH STRATEGY

The first implementation is deliberately deterministic. It does not ask an LLM to invent a complete story.

It searches the graph for:

```text
CONTRAST
RECURRENCE / RECONTEXTUALIZATION
CHANGE
CONVERGENCE
SENSORY SPECIFICITY
RELATION DENSITY
```

Then it competes across domain-neutral lenses:

```text
comedy
romance
horror
sentimental
absurd
neutral
```

The requested lens can prioritize a branch, but the underlying RealityGraph does not change.

## 5. SAME REALITY / DIFFERENT MOVIE

Given:

```text
Mike and Joe met.
Luigi's.
They talked until closing.
They connected.
```

The graph remains identical.

A comedy candidate can search for:

```text
ordinary meeting
→ prolonged conversation
→ social absurdity / status contrast
→ payoff
```

A romance candidate can search for:

```text
meeting
→ shared attention
→ connection
→ changed meaning
```

A horror candidate can search for:

```text
ordinary place
→ unusually persistent conversation
→ closing-time boundary
→ normality becomes strange
```

Those are different interpretations of the same supplied world. The lens cannot add a door slam, kiss, confession, disappearance, or other event unless the source actually supplies it.

## 6. TRUTH BOUNDARY

The candidate layer may change:

```text
framing
attitude
juxtaposition
withholding
emphasis
metaphor
personification
meaning
lens
sequence order when chronology permits it
```

It may not create:

```text
people
places
dates
dialogue
physical actions
outcomes
relationships
emotions presented as facts
```

If a candidate needs an unsupported event to work, its truth risk must rise or the candidate must be discarded.

## 7. TRAJECTORY SHAPE

A candidate is not a paragraph. It is a compact semantic path.

Example:

```text
ESTABLISH
  ↓
CONTRAST
  ↓
REFRAME
  ↓
ESCALATE / CONVERGE
  ↓
PAYOFF
```

Every trajectory step contains:

```text
operation
eventIds
viewerChange
nextQuestion
```

The `nextQuestion` is private cognition. It is not viewer-facing prose.

## 8. SCORING

Candidate scoring is intentionally multi-dimensional.

```text
novelty
specificity
information value
uncertainty
attention potential
consequence potential
callback potential
compression potential

minus

repetition risk
truth risk
```

No single metric defines creativity.

The important distinction is:

> **A strong candidate is a strong trajectory hypothesis, not a strong sentence.**

## 9. MAGNET RELATIONSHIP

Magnet is downstream of candidate discovery.

A candidate should create the raw material for:

```text
NOVELTY
×
UNCERTAINTY
×
INFORMATION VALUE
×
ATTENTION
×
TENSION
×
INFORMATION SEEKING
×
NARRATIVE ENGAGEMENT
```

The future trajectory scorer can use the candidate's semantic dimensions before language exists.

That is preferable to trying to infer whether a finished sentence is interesting after the fact.

## 10. WHY DETERMINISTIC FIRST

The first candidate search is deterministic because we need to know whether the representation itself is powerful.

If an LLM is allowed to generate the candidate movie immediately, we cannot tell whether an improvement came from:

```text
better representation
better search
better prompt
luck
```

The deterministic layer gives QRE a stable search substrate.

Later, a model can propose additional hypotheses, but QRE should still validate them against the graph and score them through the same contract.

## 11. LLM ROLE AFTER THIS LAYER

The model should eventually become one search operator, not the architecture.

Possible future role:

```text
RealityGraph
    ↓
Deterministic candidate generation
    ↓
LLM hypothesis expansion
    ↓
Graph-grounding validator
    ↓
Trajectory search
```

This is how QRE avoids the trap of:

> "Try a better prompt."

## 12. WHAT THIS KILLS

The following patterns are explicitly non-canonical:

```text
frontier = "What is the hidden movie?"
change = "Discover the character's backstory"
necessity = "Show transformation"
next = "Build anticipation"
```

Those are placeholders for cognition, not cognition itself.

They may still appear in diagnostics when tracing legacy model behavior, but they are not valid semantic representations.

## 13. DOMAIN NEUTRALITY

There is no groomer movie engine.

There is no wedding movie engine.

There is no horror movie engine.

There is one search system over reality relationships.

Domain specialists may eventually contribute:

```text
domain vocabulary
domain constraints
domain actions
domain opportunities
```

They must not replace the universal Reality → Movie search.

## 14. ACCEPTANCE REQUIREMENTS

Every candidate search implementation must prove:

```text
same RealityGraph → multiple lenses
same facts → different candidate ranking
no invented chronology
no unsupported events promoted to evidence
candidate evidence points to graph events
truth risk is explicit
trajectory is structured
payoff does not require a new fact
```

The canonical acceptance harness is:

```text
apps/api/author-acceptance-suite.ts
```

It now prints the candidate field before the live Author run.

## 15. NEXT ENGINEERING STEP

The next layer is **trajectory-level search**.

```text
candidate A
    ↓ expand
    ↓ score
    ↓ prune

candidate B
    ↓ expand
    ↓ score
    ↓ prune

candidate C
    ↓ expand
    ↓ score
    ↓ prune

BEST COMPLETE TRAJECTORY
```

The scorer must evaluate the whole sequence, not isolated lines.

## 16. DEFINITION OF DONE

Latent Movie Search is successful when sparse reality such as:

```text
Coco, returned, happy, fun, bows, balls, ties, male
```

does not become a checklist.

Instead QRE should expose multiple grounded possibilities, for example:

```text
recurrence
+ concrete objects
+ expectation violation
+ character/status relationship
→ candidate movie
```

Then the next layer chooses the trajectory that makes the viewer want the next cut.

The exact wording is downstream.

The **movie discovery is the intelligence.**
