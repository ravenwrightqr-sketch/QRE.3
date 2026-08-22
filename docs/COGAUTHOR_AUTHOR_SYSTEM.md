# QRE CogAuthor + Master Author System

## Purpose

This document is the canonical working map for the current cognitive/authoring architecture. It exists to prevent duplicate brains, stale V2/V3 implementations, motif piles, disconnected cognition layers, and accidental architectural drift.

The product goal is simple:

> Given real-world input, QRE should produce a short, screen-by-screen play-out that feels specific, surprising, emotionally intelligent, causally coherent, and worth continuing until the payoff.

The downstream CTA, subscription, dog tag, business conversion, and memory loop depend on the play-out being excellent first. The current engineering priority is the cognition and Mouth that create that play-out.

---

## Canonical ownership

### CogAuthor / COG

CogAuthor is the canonical semantic cognition system.

It answers:

- What is literally true?
- Who and what are involved?
- What relationships exist?
- What changed?
- What emotional meaning is present?
- What opportunities exist in the situation?
- What might this experience become?
- Which interpretation is strongest?
- What state changes can the experience support?
- What can be remembered, learned, or evolved later?

The canonical contract lives under `packages/contracts/src/cogauthor/`.

Do not create a second truth system beside CogAuthor.

### Master Author

The Master Author converts cognition into a short cinematic/text-film trajectory.

It answers:

- What is the best play-out for this specific reality?
- What should the viewer know now?
- What should the viewer want to know next?
- What changes from cut to cut?
- Where does tension rise, redirect, resolve, or pay off?
- Which realization earns the ending?

The current canonical API-side implementation is `apps/api/src/services/authorBrainUniversal.ts`.

There is one Author. Do not create `authorBrainUniversalV2`, `authorBrainUniversalV3`, domain writers, or parallel runtime authors.

### Mouth

The Mouth is the language realization layer.

It does not invent the world.

It receives an already-chosen trajectory and turns it into short lines/screens. It is allowed to change framing, rhythm, emphasis, implication, and wording without changing underlying reality.

The current Mouth remains a single local-model call with a deterministic truth/quality gate around its output.

---

## Core law

> Do not hardcode the pattern. Build the conditions that let the pattern emerge.

Creativity is not random weirdness.

Creative output should be:

`reality + valid inference + meaningful transformation`

A surprising invention is useful only when it expresses something latent in the experience and changes what can happen next.

---

## Truth boundary

Reality is closed.

Observed facts remain facts.
Derived interpretations remain derived.
Hypotheses remain hypotheses.
Creative realizations never become observed facts merely because the Mouth said them.

The creative layer may change interpretation, not history.

Examples:

- Good: an ordinary event becomes framed as a negotiation.
- Good: a restored room is described as if it can finally breathe.
- Bad: inventing a surveillance camera, stranger, gun, relationship, room, object, or literal event that the source never supplied.

The correct architecture is therefore:

`observed → derived → hypothesized → realized`

with no reverse contamination.

---

## The play-out target

QRE's output is not conventional prose.

Each line is effectively a screen/cut in a short text-film.

A strong cut can be extremely simple:

- `Almost.`
- `Eyebrow up.`
- `Negotiations resumed.`
- `A twist in the script.`
- `Peace was temporary.`

These work when they change the viewer's read or create a reason to continue.

The target is an attention loop:

`answer → new tension → answer → new tension → payoff`

A line does not need to add a new physical event every time. It can redirect interpretation, increase uncertainty, create implication, or reframe something already established.

---

## Current cognitive flow

The current Author-side cognition is intentionally compact:

`AuthorBrainTruth`
→ `atomic reality facts`
→ `relationships`
→ `competing movie hypotheses`
→ `best trajectory`
→ `Master Author paths`
→ `one Mouth call`
→ `truth/attention gate`
→ `SequencePlay`

The current movie-cognition bridge is:

`apps/api/src/services/authorMovieCognition.ts`

It is a small internal compiler component, not a second brain.

---

## Reality analysis

The cognitive layer builds atomic facts from the existing Author input:

- `facts`
- `sourceMoments`
- `memoryContext`
- `trajectory`
- `presenceSummary`

It ranks concrete details using lightweight signals such as:

- action
- state
- recurrence
- contrast
- concrete token novelty
- ending relevance

Fact ranking alone is not sufficient. The important improvement is relationship reasoning.

---

## Relationship reasoning

The current movie-cognition layer now creates lightweight relationships between supplied facts.

Supported relationship types:

- `chronology` — ordered concrete events form a chain
- `transition` — one event changes or tests a previously established state
- `contrast` — two details oppose or change the prior read
- `overlap` — later detail shares concrete material with an earlier one
- `recurrence` — a detail/state returns
- `continuation` — explicit continuation or causal language connects events

This is deliberately not a giant graph service.

It is a small internal relation model that gives the Author enough structure to reason about why two ordinary facts belong together.

The important question is no longer:

> Which fact is most interesting by itself?

It is:

> Which relationship between facts creates the strongest possible trajectory?

This is especially important for mundane domains. A towel is rarely the story. The relationship between checkout time, cleaning, return timing, and the expected finished state can be the story.

---

## Latent movie search

The Author should not select genres first.

It should discover possible transformations from the supplied situation.

Current semantic operations include:

- `contrast`
- `reframe`
- `reversal`
- `amplification`
- `echo`
- `enclosure`
- `reveal`
- `implication`

These are operations, not motif tables.

A motif such as a feather, haunted room, Italian restaurant, or bow is not architecture. Those are examples/tests that should emerge only when the situation supports them.

The system should search for several interpretations, score them, and select the strongest one.

---

## What makes a good movie hypothesis

A strong candidate has:

- concrete source evidence
- a meaningful relationship between events
- a real expectation
- a useful deviation
- a causal consequence
- a reason for escalation
- payoff potential
- novelty without arbitrary world invention
- low repetition risk

The winning hypothesis is not “the funniest style.”

It is the strongest interpretation that the supplied reality permits.

---

## Trajectory memory

The compiler must maintain temporary story state while constructing the sequence.

Conceptually:

```text
established facts
established states
unresolved questions
used transformations
emotional progression
setups
payoffs
```

This is not durable user memory. It is transient compiler state.

Its main purpose is to answer:

> Given everything that has already happened in this play-out, what is now possible that was not possible before?

That prevents fact-parade writing and repeated treatment of the same material.

---

## State transitions

An escalation must change the state of the story, not merely be labeled `escalation`.

Preferred internal shape:

`state A → operation/event → state B → consequence → state C`

Bad:

`beat.kind = escalation` while the text simply repeats an earlier fact.

This is why a simple line such as `So far, so good.` can be useful: it creates an apparent resolution that can immediately become unstable.

---

## Attention editor

The current Author already calculates attention-related metrics such as novelty, status change, next-beat pull, and cinematicity.

The principle behind them is more important than any individual formula:

> After this screen, is there a reason to continue?

A line that only describes, repeats, restates, or decorates should usually be cut.

A line that changes interpretation, creates tension, pays off a setup, or creates a concrete unanswered question is valuable even when the language is extremely simple.

---

## Semantic creativity

The creative layer should ask:

1. What is literally happening?
2. What is really happening emotionally or relationally?
3. What latent possibility is already present?
4. What consequence could naturally follow?
5. What realization would make the preceding sequence click?

The invention is good when it expresses the meaning.

Example pattern:

`connection → privacy → world feels private`

This is semantic creativity.

Random creativity looks like:

`connection → feather appears → chair moves → unrelated strange event`

Random novelty is not the target.

---

## Domain intelligence

Domain understanding should come from world models, not prose styles.

Examples:

### Housekeeping

Useful ontology:

- rooms
- surfaces
- objects
- accumulation
- disorder
- before/after
- restoration
- hidden evidence
- inhabitant behavior

### Grooming

Useful ontology:

- animal behavior
- care
- appearance
- personality
- owner/pet relationship
- grooming transformation
- misbehavior
- agency

### Weddings

Useful ontology:

- ritual
- relationship
- family
- place
- time
- memory
- promise
- legacy
- photographs

The cognitive machinery remains shared.

No domain-specific Author should be created just to obtain domain flavor.

---

## CogAuthor contract already provides the semantic foundation

The canonical `packages/contracts/src/cogauthor/index.ts` already contains the concepts needed to grow the system cleanly:

- `CognitiveClaimStatus`
- `CognitiveEvidence`
- `CognitiveClaim`
- `CognitiveAssumption`
- `ExperienceHypothesis`
- `CognitiveBeatDirective`
- `CognitiveExperienceRealization`
- `CognitiveExperiencePlan`
- `CognitiveCreativeLearning`
- `CognitiveAnalyticsSignal`
- `CognitiveEntityState`
- `CognitiveRelationshipState`
- `CognitiveMindState`
- `CognitiveExperienceState`

Do not duplicate these concepts in new contract families unless the existing contracts genuinely cannot express the need.

The eventual architecture should converge toward CogAuthor being the canonical source of semantic cognition, with Author consuming that cognition to compile the short play-out.

---

## Long-term architecture

```text
RAW REALITY / PROMPT
        ↓
COGAUTHOR
  world understanding
  claims
  entities
  relationships
  emotions
  opportunities
  hypotheses
        ↓
AUTHOR
  latent movie search
  trajectory
  attention loop
  state changes
  payoff
        ↓
MOUTH
  short line realization
        ↓
TRUTH + ATTENTION GATE
        ↓
SEQUENCEPLAY
        ↓
CINEMATIC RUNTIME / PLAYER
```

The upstream Cog should eventually supply richer structured cognition directly instead of Author recreating it internally. Until that seam is stable, `authorMovieCognition.ts` is the deliberately small bridge.

---

## One-model-call rule

The current Author architecture intentionally keeps the Mouth to one local model call.

QRE should do as much cognition as possible deterministically and structurally before the Mouth call.

The model is the language realization layer, not the sole planner.

Do not solve a weak cognitive representation by adding repeated model calls unless there is a demonstrated production need.

---

## Current acceptance principles

The Author should reject output that:

- invents unsupported people
- invents unsupported places
- invents unsupported relationships
- invents unsupported body details
- invents unsupported literal events
- mechanically replays facts
- duplicates lines
- violates endpoint requirements
- uses obvious meta-language
- uses generic stock sentiment
- explains instead of dramatizing
- fails to create forward pull

The system should prefer:

- specific reality
- meaningful transformation
- tension
- implication
- contrast
- reframe
- callback
- concise screen-sized language
- earned payoff

---

## What not to build

Do not create:

- `authorBrainUniversalV2.ts`
- `authorBrainUniversalV3.ts`
- domain-specific Authors
- separate comedy/romance/horror brains
- giant motif tables as the primary creative engine
- random novelty injectors
- redundant truth systems
- parallel parser/runtime stacks
- a pile of disconnected cognition services

When a new need appears, first ask whether it belongs in the existing CogAuthor contract, the Master Author, the Mouth, or the existing gate.

Prefer one small extension at the correct boundary over another subsystem.

---

## Development rule

Keep the system organized while it gets smarter.

Every change should answer:

1. Which existing component owns this responsibility?
2. Can the new behavior be implemented as a pure function or small module?
3. Does it reuse existing contracts?
4. Does it preserve the one canonical Author?
5. Does it preserve the truth boundary?
6. Does it make the play-out measurably better?
7. Can the behavior be demonstrated with a small acceptance case?

If the answer requires a new "V2" brain, stop and redesign the seam.

---

## Immediate priority

The Mouth is already capable of producing interesting micro-lines. The immediate priority is to make the cognition increasingly better at choosing the trajectory that deserves those lines.

The next progression is:

`facts → relationships → expectations → latent opportunity → competing trajectories → selected trajectory → Mouth → attention/truth gate`

Then, when that is strong and stable, fold the temporary movie-cognition bridge deeper into CogAuthor rather than expanding the bridge into a second cognitive system.

---

## Product north star

The play-out should be so specific and compelling that the viewer wants the next experience before the explicit CTA has to sell it.

For a pet:

> I want one of these for my dog.

For a business:

> I want this for my customers.

For a memory:

> I want to see that moment this way again.

The product mechanism underneath can change later.

The creative engine must earn that reaction first.

---

## Current branch work

The relationship-aware movie-cognition work is being developed on the `qre/supercog-reality-movie-author` branch before final integration into the production Author branch.

The current implementation remains deliberately small and domain-neutral.
