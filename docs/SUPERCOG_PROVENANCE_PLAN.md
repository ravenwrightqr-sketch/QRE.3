# Super Cog — Provenance-Aware Reality Plan

## Purpose

Protect the universal QRE reality law at the cognitive boundary:

> QRE may derive meaning and relationships from supplied reality. QRE may not invent reality.

This layer does not create another brain. It gives every reality fact an explicit semantic envelope that can travel with cognition and constrain movie realization.

## Current implementation

### Contract

`packages/contracts/src/cogauthor/realityProvenance.ts`

Defines:

- typed fact category
- source
- confidence
- permitted semantic transformations
- forbidden expansions

### Identity State

`IdentityFact.provenance` is optional and carries the provenance envelope without breaking existing callers.

### API utility

`apps/api/src/services/authorRealityProvenance.ts`

Creates provenance from the existing reality typing system and specializes recurring activity semantics such as `long walks at night` into `activity`.

### Runtime gate

`apps/api/src/services/authorProvenanceGate.ts`

Provides a reusable gate that checks authored lines against the provenance envelope and rejects unsupported place, object, person, body-detail, chronology, and private-fact expansions.

### Acceptance

`pnpm --filter @qre/api author:provenance`

Verifies the semantic permission taxonomy.

`pnpm --filter @qre/api author:provenance-gate`

Verifies grounded lines pass while deliberate invented-place, invented-object, invented-person/relationship cases fail.

## Canonical wiring status

The provenance contract and gate are implemented and tested independently.

The final production seam remains:

`IdentityFact.provenance → movie beat → Mouth packet → provenance gate`

That integration must happen before provenance is considered complete.

## Example

### Supplied

`talked until close`

### Allowed

- chronology
- compression
- significance
- callback
- meaning derived from the supplied interaction

### Forbidden

- invented relationship status
- invented destination
- invented continued presence
- invented private event

Therefore:

`talked until close → we never left the bar`

must be rejected.

## Design rule

Do not weaken a validator to make a generated output pass. Upgrade provenance, cognitive context, or generation constraints instead.
