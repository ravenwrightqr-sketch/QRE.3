# Super Cog Memory Architecture

## Purpose

QRE is a universal experience compiler with a durable world-state layer. A prompt is not treated as a template request; it is evidence about a subject, people, places, objects, events, relationships, goals, and desired change.

The memory loop is:

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

## Memory is not generated prose

Durable memory is split into four semantic layers:

- **Entities** — people, animals, places, organizations, events, objects, properties, services, experiences.
- **Facts** — observed or high-confidence derived assertions with confidence, provenance, temporal validity, visibility, and status.
- **Relations** — explicit graph edges such as ownership, participation, occurred-at, belongs-to, created-by, or related-to.
- **Events** — immutable observations that preserve what happened and when.

An append-only audit record records memory consolidation operations.

## Truth boundary

Creative realization is never automatically promoted into factual memory. Only conserved premise evidence with adequate confidence and non-creative provenance is eligible for durable fact storage.

Low-confidence or unsupported claims should remain ephemeral until corroborated. Retractions and supersession are represented as state changes instead of destructive deletion.

This is intentional: a hallucinated memory can become future ground truth and compound across later interactions. Confidence, provenance, quarantine, and replay are therefore first-class controls.

## Tenant boundary

The first memory namespace is the QRE Asset. Memory retrieval and writes are scoped to an `assetId`; authenticated user identity is retained on write/audit paths. This gives every physical/digital QRE object its own evolving world.

The architecture can later add account-level and user-level namespaces without changing the cognitive compiler contract.

## Current API

### Compile with memory

`POST /experience/compile`

```json
{
  "assetId": "asset-id",
  "prompt": "My grandfather gave me this watch and I want its story to keep growing."
}
```

When `assetId` is present, QRE retrieves durable memory before cognition and consolidates newly observed premise material after successful compilation.

### Read memory

`GET /experience/memory/:assetId`

### Explicitly remember

`POST /experience/memory/:assetId`

```json
{
  "prompt": "This is Max, our ten-year-old poodle. He loves the beach."
}
```

This path updates memory without creating a new experience blueprint.

## Deployment

Apply the durable memory migration before using asset-scoped memory:

```powershell
pnpm db:migrate
pnpm build
pnpm test:memory
```

The migration uses PostgreSQL tables and indexes and does not require Prisma Client models for the runtime adapter. The engine remains Prisma-free; persistence is an API repository concern.

## Enterprise direction

The next production hardening layers are:

1. **Authorization** — verify the authenticated principal owns or is authorized for the asset before memory reads/writes.
2. **Retention** — add configurable retention/expiration by memory type and tenant policy.
3. **Quarantine** — route low-confidence or conflicting facts into a non-authoritative state.
4. **Audit export** — expose immutable memory audit events to the existing analytics/observability pipeline.
5. **Semantic retrieval** — add embeddings/vector search beside deterministic entity/relation lookup when the corpus becomes large enough to justify it.
6. **Outcome learning** — record completion, contribution, return, conversion, and explicit user feedback as outcome/behavior facts rather than treating raw analytics as truth.
7. **Human correction** — allow an authorized owner to confirm, edit, retract, or promote a memory with full provenance.

The invariant remains:

> **QRE can become more adaptive without allowing invented narrative to silently become world truth.**
