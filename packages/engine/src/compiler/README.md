# QRE Universal Cognitive Compiler

## Status

Canonical clean rebuild. Legacy cognition/compiler generations were intentionally purged. The public cognitive entry point is `packages/engine/src/cognition/universalMind.ts`.

## Permanent invariant

**MORE IMAGINATIVE, NEVER LESS FAITHFUL.**

QRE may creatively perform supplied reality, but it must not erase, contradict, or silently fabricate the world the user supplied.

## Canonical cognitive path

`prompt → world model → memory resolution → significance/change → creative policy → critic → experience planner → ExperienceMoment[] → CinematicScene[]`

The cognitive core is universal. It is not an industry classifier, template selector, or collection of domain story engines.

## Layer boundaries

### World model

`worldModel.ts` is the durable semantic substrate for cognition. It records identity, entities, participants, events, states, relationships, places, time, history, evidence, and concrete details.

The parser may use broad linguistic cues, but those cues are extraction aids only. They are never permission to create domain-specific behavior.

### Memory resolver

`memoryResolver.ts` determines whether current language connects to existing context.

- one strong match → resolve it
- multiple plausible matches → ask one targeted question
- no usable match → ask for the missing reality

Memory is world evidence, not a separate story generator.

### Significance engine

`significanceEngine.ts` identifies recurrence, relationships, change, temporal importance, location recurrence, and continuation opportunities. It produces attention signals but does not write prose.

### Creative policy

`creativePolicy.ts` generates multiple readings of the same world. Creative lenses are policies, not domain templates.

The same world may therefore be performed as comedy, horror, romance, mystery, wild, or neutral without changing the underlying facts.

Future learned policy can use accepted/rejected outputs and creative preferences to alter ranking without adding domain branches.

### Experience critic

`experienceCritic.ts` is a hard gate between imagination and output.

Candidates are rejected or heavily penalized when they lose high-value evidence, leak cognitive terminology, or fall into generic interchangeable prose.

### Experience planner

`experiencePlanner.ts` decides what deserves an experience unit and how the sequence should move. It does **not** assume a fixed number of moments.

Moments are dynamically sized around attention, significance, causality, change, payoff, and available evidence.

`ExperienceMoment` is a runtime atom, not a cognitive atom.

## Universal world substrate

The same substrate can represent:

- people
- pets
- relationships
- businesses
- physical QR assets
- collectibles
- anime conventions
- cards
- cars
- guitars
- surfboards
- hotel rooms
- restaurant tables
- weddings
- raves
- tickets
- public entities
- family history
- ongoing memories

These are examples used for acceptance and capability testing. They must **never** become compiler branches.

## Identity and participant conservation

**Identity is conserved independently of grammatical subject.**

`Alex and Sam went back...` means two identities participating in one event. It must never become one actor named `Alex and Sam`, nor may either participant disappear during clause splitting or realization.

Participants must survive:

`entity discovery → event binding → relationship graph → evidence → creative ranking → ExperienceMoment payload`

Relationships are first-class world facts. Repeated events can strengthen, extend, or reveal relationships over time.

## Detail and evidence conservation

Concrete nouns and details inside state clauses are evidence too.

- `the chairs were circled around us` → `chairs` is conserved
- `the lights went out` → `lights` is conserved
- `the teapot has been in the family for forty years` → `teapot`, `family`, and `forty years` are conserved

Creative candidates cannot win merely because they sound better. If a candidate discards a high-salience participant, object, detail, place, time, recurrence, duration, or outcome, it loses the ranking competition.

## Creative exemplar rule

Extreme showcase examples are **tests and learning exemplars, never runtime rules**.

A Coco example teaches the desired capability of personification/comedic agency; it does not teach a `Coco` branch.

An anime example teaches entity + event + collection + social memory; it does not create an anime engine.

A wedding example teaches long-lived memory and relationship continuity; it does not create a wedding compiler.

The goal is to learn **general cognitive mechanisms from examples**, not memorize topics.

## Adaptive / learned boundary

The pure cognitive engine may consume and emit:

- memory context
- creative preferences
- accepted/rejected feedback
- adaptive questions
- discoveries
- learning signals
- provenance

Persistence and actual model training remain outside the pure engine. The architecture is intentionally ready for a learned ranking/policy layer later without requiring a rewrite of the world model or runtime.

## State and memory model

A durable entity is expected to accumulate:

`identity + relationships + events + state + locations + media + history`

New events should update the world rather than merely append prose. Future compilation can therefore notice repeated people, repeated places, returning to meaningful places, recurring events, shared experiences, unusual intersections, state changes, and relationships strengthened by repetition.

## Runtime boundary

`ExperienceMoment` is the canonical experience atom. The cognitive layer decides what the experience is. The cinematic runtime executes it. The scan engine resolves and runs it. Runtime must not become another brain.

## Acceptance gate

Primary gate:

`pnpm --filter @qre/engine test:universal-mind`

Passing TypeScript is necessary but not sufficient. The mind must demonstrate:

- reality fidelity
- participant/entity preservation
- detail/evidence conservation
- causality
- temporal intelligence
- memory resolution
- ambiguity handling
- relationship continuity
- creative lens variation
- dynamic moment sizing
- novelty
- sequencing
- learning signals
- no cognitive leakage
- no robotic generic realization

## Documentation rule

Every meaningful cognition/compiler change updates this README in the same change and records the reasoning principle, invariant, and acceptance expectation it introduced or strengthened.
