# QRE AUTHOR COGNITIVE AUDIT

Status: CURRENT / ENGINEERING MEMORY
Branch: `author/enterprise-realization-engine`

## Purpose

This document records architectural findings discovered while tracing the Universal Author end-to-end. It is an implementation memory, not a story template.

The rule is:

> A successful example teaches QRE a reusable cognitive law; it does not become hardcoded story logic.

## Current north star

```text
USER REALITY
  -> REALITY GRAPH
  -> EVIDENCE FEATURES
  -> RELATION / TENSION DISCOVERY
  -> CHARACTER + LENS READ
  -> LATENT MOVIE COMPETITION
  -> SEMANTIC TRAJECTORY
  -> CANONICAL BEAT GRAPH
  -> MEANING SPINE
  -> REALIZATION SLOTS
  -> STRATEGY SEARCH
  -> MOUTH CANDIDATES
  -> TRUTH / MEANING / LANGUAGE CRITIC
  -> SEQUENCE SEARCH
  -> REPAIR
  -> FINAL EXPERIENCE
```

## Finding 1 — Coco is calibration evidence, not a template

The Coco example demonstrates a quality bar: QRE should discover why supplied details become a satisfying little movie. The reusable algorithm is not the literal sequence.

The intended behavior is:

```text
ordinary supplied reality
  -> discover salient relationship
  -> discover tension / contradiction
  -> discover semantic change
  -> discover a later detail that strengthens or seals the reading
  -> land on the supplied ending of that source sequence
```

A different reality must be free to produce a completely different latent movie.

## Finding 2 — The Mouth cannot be the latent-story discoverer

The Mouth should realize an approved semantic job. Prompting Qwen with a hand-written interpretation such as state -> attitude -> concrete action is a hidden template and causes parroting instead of discovery.

The canonical semantic job must originate upstream in cognition / movie search and travel through the Meaning Spine and Realization Slots.

## Finding 3 — One semantic thread, not duplicated interpretations

The same discovered meaning must survive every boundary:

```text
RealityGraph
 -> Movie
 -> semantic change
 -> Beat Graph
 -> Meaning Spine
 -> Slot
 -> Mouth
```

Lower layers must not silently re-infer a different meaning from the same raw evidence.

## Finding 4 — Lexical vocabularies are features, not semantic authorities

Action/state/time/recurrence lexical recognition can be useful as weak evidence features.

It must never become:

```text
keyword category -> therefore story meaning
```

Especially prohibited are domain/object lists used to decide what is inherently important, such as lists of specific objects or industries.

## Finding 5 — RealityGraph is the first upstream authority to harden

`authorRealityGraph.ts` previously contained a sensory/object vocabulary that made certain words inherently "sensory" or important. That biases all downstream cognition toward historical examples.

The graph should derive candidate salience from evidence structure:

- explicit provenance
- recurrence
- relation density
- shared distinctive tokens
- explicit temporal structure
- explicit relational language
- entity density / observation specificity
- endpoint participation

Lexical classes remain weak signals only.

## Finding 6 — `authorCognition.ts` is currently too template-like

The cognition layer contains direct domain/entity pattern routing and hard-coded creative frames. Examples include explicit service, wedding, moving, dog/poodle, horror, luxury, and object vocabulary branches.

These are implementation debt. Cognition should consume graph-derived evidence features and discover generic mechanisms such as:

- contradiction
- status pressure
- recurrence
- recontextualization potential
- relationship density
- unexpectedness
- endpoint pressure
- sealing potential

The specific story interpretation must be earned from the supplied evidence.

## Finding 7 — Latent Movie Search needs evidence gravity, not object vocabulary

`authorLatentMovieSearch.ts` contains a concrete-detail vocabulary list and lens-specific mechanism biases. These are useful as historical heuristics but are not sufficient as a universal author.

Target search model:

```text
movie quality
 = evidence gravity
 + character/lens fit
 + relationship strength
 + semantic change
 + endpoint dependency
 + surprise / information value
 + distinctiveness
 - truth risk
 - repetition
```

A lens should bias the search, not dictate which relation type wins.

## Finding 8 — Endpoint means source-derived landing, not a universal phrase

The author's final beat must respect the actual supplied ending of the current source sequence. A phrase from one example is never a universal ending rule.

The author should discover why the supplied ending lands.

## Finding 9 — Meaning Spine must preserve Beat Graph change

The Beat Graph's `change`, `next`, or `frontier` is the semantic movement discovered upstream. The Meaning Spine must carry that movement directly into its obligations rather than replacing it with generic prose about a beat kind.

This is the bridge:

```text
selected movie
 -> beat.change
 -> spine change
 -> realization obligation
 -> slot
 -> mouth
```

## Finding 10 — Acceptance must diagnose cognition separately from prose

We need diagnostics that distinguish:

```text
BAD COGNITION
- weak or obvious movie
- weak relationship
- no meaningful semantic change
- endpoint independent of path

GOOD COGNITION / BAD MOUTH
- strong latent movie
- strong change
- strong endpoint dependency
- weak language realization
```

The acceptance path should eventually report the cognitive thread before evaluating prose.

## Enterprise learning loop

The durable author should accumulate reusable evaluation knowledge from failures without memorizing domain-specific stories:

```text
candidate
 -> failure pattern
 -> generalized cognitive/language failure
 -> reusable detector
 -> future search bias
```

Examples:

```text
"keyword assembly with no relationship"
"endpoint copied without earned setup"
"relationship named rather than performed"
"later detail unused as recontextualization"
"generic praise replacing evidence"
```

## Permanent laws

1. No domain-specific story branches in the universal author.
2. No example-specific semantic recipes in the Mouth.
3. No object vocabulary deciding salience by itself.
4. Lexical heuristics are features, never authorities.
5. One canonical semantic interpretation travels downstream.
6. QRE discovers the movie; the model proposes language.
7. The endpoint is source-derived and sequence-specific.
8. Acceptance must measure latent-story quality separately from prose quality.
9. Rejected candidates should teach reusable failure patterns.
10. Every new layer must answer: who owns this decision, and can another layer silently contradict it?

## Acceleration order

```text
1. Harden RealityGraph evidence features.
2. Remove template-like cognition routing.
3. Harden latent movie competition.
4. Carry semantic change through the Beat Graph and Meaning Spine.
5. Introduce one canonical semantic thread if existing contracts cannot carry it cleanly.
6. Make Attention / Repair an active search controller.
7. Make evaluation memory reusable and domain-neutral.
8. Tune the Mouth only after cognition is demonstrably strong.
```
