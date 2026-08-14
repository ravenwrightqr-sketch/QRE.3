# QRE Universal Cognitive Compiler

## Status

Canonical clean rebuild. Legacy cognition/compiler generations were intentionally purged. The public cognitive entry point is `packages/engine/src/cognition/universalMind.ts`.

## Permanent invariant

**MORE IMAGINATIVE, NEVER LESS FAITHFUL.**

QRE may creatively perform supplied reality, but it must not erase, contradict, or silently fabricate the world the user supplied.

## Canonical cognitive path

`prompt → world model → memory resolution → significance/change → state-aware creative search → critic → experience planner → ExperienceMoment[] → CinematicScene[] → evolved mind state`

The cognitive core is universal. It is not an industry classifier, template selector, or collection of domain story engines.

## Layer boundaries

### World model

`worldModel.ts` is the durable semantic substrate for cognition. It records identity, entities, participants, events, states, relationships, places, time, history, evidence, and concrete details.

### Memory resolver

`memoryResolver.ts` determines whether current language connects to existing context. One strong match resolves, multiple plausible matches produce one targeted question, and unresolved references remain explicit uncertainty rather than fabricated facts.

### Significance engine

`significanceEngine.ts` identifies recurrence, relationships, change, temporal importance, location recurrence, and continuation opportunities. It now consumes prior cognitive state so a returning entity, place, or relationship can become more significant on later compilations.

### Creative policy

`creativePolicy.ts` searches multiple candidate performances using universal creative moves: contrast, specificity spotlight, causal consequence, anticipatory tension, midpoint escalation, personification, atmosphere, understatement, and lens-specific framing. These are mechanisms, not noun or industry branches.

Accepted/rejected feedback and preferences alter candidate ranking. The same world can therefore be performed differently without changing the underlying evidence.

### Experience critic

`experienceCritic.ts` is a hard gate between imagination and output. Candidates are rejected or heavily penalized when they lose high-value evidence, leak cognitive terminology, or fall into generic interchangeable prose.

### Mind state

`mindState.ts` is the canonical pure state transition layer. It tracks compile count, recurring entity appearances, places, relationships, states, event history, accepted/rejected creative feedback, successful lenses, avoided patterns, and novelty pressure. The state enters the next compile and is evolved after the current compile.

Persistence remains outside the pure engine. The API/runtime may store and reload the canonical `CognitiveMindState` contract.

### Experience planner

`experiencePlanner.ts` decides what deserves an experience unit and how the sequence should move. It does not assume a fixed number of moments.

`ExperienceMoment` is a runtime atom, not a cognitive atom.

## Universal world substrate

The same substrate can represent people, pets, relationships, businesses, physical QR assets, collectibles, events, products, family history, and ongoing memories. These are capability examples, never compiler branches.

## Identity and participant conservation

**Identity is conserved independently of grammatical subject.** `Alex and Sam went back...` means two identities participating in one event. Participants must survive entity discovery, event binding, relationship graph, evidence, creative ranking, and ExperienceMoment payload construction.

## Detail and evidence conservation

Concrete nouns and details inside state clauses are evidence too. Creative candidates cannot win merely because they sound better. If a candidate discards a high-salience participant, object, detail, place, time, recurrence, duration, or outcome, it loses the ranking competition.

Invented experiential details are explicitly marked with `creative_realization` provenance and surfaced on the resulting experience payload.

## Adaptive / learned boundary

The pure cognitive engine consumes and emits memory context, creative preferences, accepted/rejected feedback, adaptive questions, discoveries, learning signals, provenance, and `CognitiveMindState`. This gives QRE a deterministic stateful policy loop today while leaving persistence and future model training outside the pure engine.

## State and memory model

A durable entity accumulates:

`identity + relationships + events + state + locations + media + history`

A later compile can therefore notice recurrence, returning places, repeated events, shared experiences, state changes, strengthened relationships, and accumulated creative preferences.

## Runtime boundary

`ExperienceMoment` is the canonical experience atom. The cognitive layer decides what the experience is. The cinematic runtime executes it. The scan engine resolves and runs it. Runtime must not become another brain.

## Acceptance gate

Primary gate:

`pnpm --filter @qre/engine test:universal-mind`

The acceptance suite now requires:

- reality fidelity
- participant/entity preservation
- detail/evidence conservation
- causality and sequencing
- temporal intelligence
- memory resolution and ambiguity handling
- relationship continuity
- creative lens variation
- universal creative-move generation
- dynamic moment sizing
- novelty pressure
- provenance for invented detail
- state recurrence across compiles
- feedback-driven learning
- no cognitive leakage
- no robotic generic realization
