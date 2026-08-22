# Super Cog — Provenance-Aware Reality Plan

## Purpose

Protect the universal QRE reality law at the cognitive boundary:

> QRE may derive meaning and relationships from supplied reality. QRE may not invent reality.

This layer does not create another brain. It gives every reality fact an explicit semantic envelope that can travel with cognition and later constrain movie realization.

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

`IdentityFact.provenance` is optional and can now carry the provenance envelope without breaking existing callers.

### API utility

`apps/api/src/services/authorRealityProvenance.ts`

Creates provenance from the existing reality typing system and specializes recurring activity semantics such as `long walks at night` into `activity`.

### Acceptance

`pnpm --filter @qre/api author:provenance`

The acceptance verifies that activities, events, places, and traits receive different permissions while invention classes remain forbidden.

## Next canonical integration

The next safe step is to attach `RealityProvenance` to every `IdentityFact` created by `authorIdentityState.ts`.

Then carry the provenance into movie cognition:

`IdentityFact → RealityFact → trajectory candidate → movie beat → Mouth packet`

The final truth gate should be able to reject a realization because it exceeds the semantic envelope, even when the raw keyword validator does not recognize the invention.

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
