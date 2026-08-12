# Super Cog Memory Architecture

QRE's long-term memory is a governed world-state layer, not a bag of generated prose.

```text
PROMPT / EVENT / SCAN
        ↓
COGNITIVE UNDERSTANDING
        ↓
CONSERVATIVE PREMISE
        ↓
EXPERIENCE COMPILATION
        ↓
MEMORY VALIDATION
        ↓
ENTITY + FACT + RELATION + EVENT STORE
        ↓
RETRIEVAL
        ↓
NEXT COGNITIVE COMPILATION
```

## Four durable layers

- **Entities:** people, animals, places, organizations, events, objects, properties, services, experiences.
- **Facts:** assertions with confidence, provenance, temporal validity, visibility, and status.
- **Relations:** explicit graph edges connecting entities.
- **Events:** immutable observations that preserve what happened and when.

An append-oriented audit record records consolidation operations.

## Truth boundary

Creative realization is never automatically promoted into factual memory. Only conserved premise evidence with adequate confidence and non-creative provenance is eligible for durable fact storage.

Low-confidence or unsupported claims remain ephemeral until corroborated. Retractions and supersession are represented as state changes instead of destructive deletion.

## Tenant boundary

The first memory namespace is the QRE Asset. Authenticated memory reads and explicit writes verify ownership or account membership. Anonymous scans can contribute episodic scan events without gaining access to the stored memory graph.

## API

- `POST /experience/compile` with `{ assetId, prompt }` retrieves memory before compilation and consolidates newly observed premise material after success.
- `GET /experience/memory/:assetId` reads governed memory for an authorized principal.
- `POST /experience/memory/:assetId` accepts an explicit "remember this" statement without requiring a new experience blueprint.

## Deployment

```powershell
pnpm db:migrate
pnpm build
pnpm test:memory
```

## Next production layers

1. Owner correction and quarantine.
2. Retention and deletion/export policies.
3. Observable outcome/behavior learning.
4. Structured audit and correlation IDs.
5. Semantic/vector retrieval beside deterministic graph lookup at scale.

The invariant is simple:

> **QRE becomes more adaptive without allowing invented narrative to silently become world truth.**
