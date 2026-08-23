# QRE The State Architecture

**Date:** 2026-08-22

## Canonical Rule

QRE does not build a separate engine for every product category or UI feature.

The universal primitive is **The State**: the identity-bearing world attached to one canonical asset, containing its capabilities, modes, experiences, current behavior, and eventually its authoritative history, measurements, and learned patterns.

```text
THE STATE
   ↓
identity
   ↓
capabilities + modes
   ↓
active mode + experiences
   ↓
real events
   ↓
history / measurements
   ↓
patterns + learning
   ↓
future adaptation + new story
```

The UI may expose those experiences and modes as buttons, controls, or workflows. The underlying engine remains universal.

## Domain-Neutral Model

The same architecture applies to any identity-bearing asset:

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

These are not separate engines. They are different capability/mode/experience configurations over The State.

The same model can represent a property, vehicle, business, physical QR Art, equipment, or another identity-bearing object.

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

## Canonical Contract

The contract lives at:

```text
packages/contracts/src/theState.ts
```

The canonical shape contains:

```text
identity
capabilities[]
modes[]
current
activeExperienceId
experiences[]
history[]
measurements[]
patterns[]
```

Capabilities answer **what the asset can do**.

Modes answer **what behavior can be activated**.

Current answers **what is happening now**.

History answers **what actually happened**.

Measurements answer **what was quantitatively observed**.

Patterns answer **what is derived from repeated observations**.

This separation is mandatory. `Dog Walk exists` is configuration; `Coco is currently walking` is live state; `Coco usually walks for 31 minutes` is a derived pattern.

## Persistence

The first configurable State slice is persisted on the existing `Asset` model:

```text
Asset.stateConfig Json?
```

Migration:

```text
packages/db/prisma/migrations/20260822235000_add_asset_state_config/migration.sql
```

The JSON document contains configuration/current state only. Durable history, measurements, and patterns should move to canonical event/data sources when those systems are implemented; do not turn `stateConfig` into an unbounded history log.

## Runtime Projection

The engine projection is:

```text
packages/engine/src/theState.ts
```

`buildTheState()` projects existing asset/experience data plus persisted State configuration into the canonical `TheState` contract. It does not invent facts.

`scanEngine()` includes that projection in the canonical `Experience.state` response.

## State Configuration API

Authenticated asset owners/account members can configure State through:

```text
GET    /api/state/:assetId
PATCH  /api/state/:assetId/config
POST   /api/state/:assetId/modes/:modeId/activate
POST   /api/state/:assetId/modes/:modeId/deactivate
```

### Example configuration

```json
{
  "capabilities": [
    {
      "id": "location",
      "label": "Location",
      "enabled": true
    },
    {
      "id": "story",
      "label": "Story",
      "enabled": true
    }
  ],
  "modes": [
    {
      "id": "normal",
      "label": "Normal",
      "enabled": true
    },
    {
      "id": "dog_walk",
      "label": "Dog Walk",
      "enabled": true,
      "metadata": {
        "location": true,
        "gps": {
          "required": true,
          "accuracyMeters": 50
        }
      }
    }
  ],
  "defaultModeId": "normal",
  "current": {
    "modeId": null,
    "status": "idle"
  }
}
```

A user can therefore configure a mode before it has ever happened. Activation changes `current`; actual events later become the authority for history and measurements.

## Story Connection

A configured mode can point to or select an existing experience through its metadata/configuration without creating a new domain engine.

For example:

```text
Dog Walk mode
   ↓
GPS / presence / event inputs
   ↓
current State changes
   ↓
real observations
   ↓
cinematic experience
   ↓
new history
   ↓
future patterns / adaptation
```

The story is allowed to become creative; the underlying State and provenance remain factual.

## IdentityState Boundary

QRE also has an author-side `IdentityState`. These are intentionally different concepts:

```text
The State
→ asset/identity world and experience continuity

IdentityState
→ author/cognition learning context used to shape the next experience
```

Do not collapse them into one object merely because both contain state-like information.

## Future Expansion Rule

Future capabilities may add durable relationships, authorized actors, current modes, history, measurements, and pattern derivation. Every new field must have:

```text
a canonical source of truth
        +
a real consumer
```

Do not create feature-specific engines such as `petEngine`, `groomerEngine`, or `surfboardEngine`. Build universal state/context primitives and let product surfaces compose experiences over them.
