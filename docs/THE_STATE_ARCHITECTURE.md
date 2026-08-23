# QRE The State Architecture

**Date:** 2026-08-22

## Canonical Rule

QRE does not build a separate engine for every product category or UI feature.

The universal primitive is **The State**: the identity-bearing world beneath experiences, including what the identity can do, what mode is active, what has happened, what has been measured, and what patterns have been learned.

```text
THE STATE
│
├── identity
├── capabilities
├── modes
├── current state
├── experiences
├── history
├── measurements
└── learned patterns
        ↓
   live experiences / stories
        ↓
   new events + memory
        ↓
   stronger future state
```

The UI may expose capabilities as buttons, modes, or flows. The underlying engine remains universal.

## Domain-Neutral Model

The same architecture applies to any asset or identity:

```text
ANIMAL
→ social
→ lost mode
→ care
→ vacations
→ trips
→ memories
→ rewards
```

```text
SURFBOARD
→ trips
→ beaches
→ sessions
→ repairs
→ photos
→ owners
→ memories
```

These are not separate engines. They are different experiences, capabilities, and state transitions attached to different identities.

The same model can represent a property, vehicle, business asset, physical artwork, equipment, or another identity-bearing object.

## State vs Fact vs Story

The State is the universal container, but its fields have different authority levels:

```text
configured capability
≠
current state
≠
observed history
≠
derived measurement
≠
learned pattern
≠
creative story
```

For example:

```text
Dog Walk capability exists
        ≠
Coco is walking now
        ≠
Coco walked yesterday
        ≠
Coco usually walks at 6 PM
        ≠
"Coco owns the evening route"
```

The first is configuration. The second is current state. The third is observed history. The fourth is a derived pattern. The fifth is creative realization.

The architecture must never promote a creative realization into factual truth.

## The State Can Run a Story While State Changes

A mode can simultaneously change state, collect real-world events, and drive an experience.

```text
activate mode
    ↓
current state changes
    ↓
real-world events arrive
    ├── location
    ├── duration
    ├── activity
    └── other evidence
    ↓
state/history/measurements evolve
    ↓
cognition + runtime build a grounded story
    ↓
new experience outcome
    ↓
future state / learning
```

This means a physical QR Art object can be both a persistent identity anchor and a live story surface.

## What The State Is Not

```text
TheState ≠ one feature
TheState ≠ one industry
TheState ≠ one UI mode
TheState ≠ MemorySnapshot
TheState ≠ cinematic runtime
TheState ≠ analytics persistence
TheState ≠ a second author
```

`MemorySnapshot` is a runtime experience-memory capsule. Analytics is an observation/persistence plane. Cognition is the meaning/authoring plane. The State is the stable identity/context container beneath those systems.

## Canonical Contract

The canonical contract is:

```text
packages/contracts/src/theState.ts
```

It currently defines:

```text
TheStateIdentity
TheStateCapability
TheStateMode
TheStateCurrent
TheStateExperience
TheStateHistoryEntry
TheStateMeasurement
TheStatePattern
TheState
```

The base runtime projection populates identity and available experiences from the existing asset/experience records. Capability slots, modes, history, measurements, and learned patterns are present as universal contract surfaces but remain empty until QRE has an authoritative source and a real consumer for them.

## Runtime Projection

The engine projection is:

```text
packages/engine/src/theState.ts
```

`buildTheState()` projects the existing asset record into the canonical `TheState` shape. It does not create domain-specific behavior and does not invent history, measurements, or learning.

## Canonical Experience Response

`Experience` includes:

```text
state: TheState | null
```

Therefore the production scan path becomes:

```text
physical/digital asset
        ↓
The State
        ↓
active experience + available experiences
        ↓
scan runtime
        ├── moments
        ├── GeoStory
        ├── cinematic scenes
        ├── MemorySnapshot
        ├── delivery
        └── receipt when applicable
```

This keeps identity continuity above any single experience while preserving the existing runtime boundaries.

## Future Expansion Rule

Future state capabilities may connect to durable relationships, active modes, activity measurements, history, rewards, care, trips, or learned habits, but each must be backed by canonical storage/contracts and an actual event or user configuration source.

Do not create feature-specific engines such as `petEngine`, `groomerEngine`, or `surfboardEngine` to express those experiences. Build universal state/context primitives and let product surfaces compose experiences over them.
