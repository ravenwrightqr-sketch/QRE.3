# QRE The State Architecture

**Date:** 2026-08-22

## Canonical Rule

QRE does not build a separate engine for every product category or UI feature.

The universal primitive is **The State**: the identity, active experience context, and collection of experiences attached to one canonical asset.

```text
THE STATE
   ↓
identity + experiences
   ↓
multiple experiences
   ↓
runtime events + memory + history
   ↓
learning
   ↓
future adaptation
```

The UI may expose those experiences as buttons, modes, or flows. The underlying engine remains universal.

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

These are not separate engines. They are different experiences attached to different states.

The same model can represent a property, vehicle, business asset, physical artwork, equipment, or another identity-bearing object.

## What The State Is Not

```text
TheState ≠ one feature
TheState ≠ one industry
TheState ≠ one UI mode
TheState ≠ MemorySnapshot
TheState ≠ cinematic runtime
TheState ≠ analytics persistence
```

`MemorySnapshot` is a runtime experience-memory capsule. Analytics is an observation/persistence plane. Cognition is the meaning/authoring plane. The State is the stable identity/experience container beneath those systems.

## Current Contract

The canonical contract is:

```text
packages/contracts/src/theState.ts
```

It currently contains:

```text
identity
activeExperienceId
experiences[]
```

The contract is intentionally small. Additional state/history capabilities should be added only when there is an authoritative data source and a real consumer.

## Runtime Projection

The engine projection is:

```text
packages/engine/src/theState.ts
```

`buildTheState()` projects the existing asset record and its authored experiences into the canonical `TheState` shape. It does not create domain-specific behavior and does not invent history.

## Canonical Experience Response

`Experience` now includes:

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

Future state capabilities may include durable history, relationships, authorized actors, current modes, or learned continuity, but those should attach to The State only when they are backed by canonical storage/contracts.

Do not create feature-specific engines such as `petEngine`, `groomerEngine`, or `surfboardEngine` to express those experiences. Build universal state/context primitives and let product surfaces compose experiences over them.
