# Super Cog Advancement Log

## 2026-08-21 — Domain-Driven Movie Layer

### What changed

Super Cog now has a dedicated domain-to-movie selection bridge at `apps/api/src/services/authorDomainMovieBridge.ts`.

The bridge combines:

`Reality typing → Domain Cognition Profile → existing Movie Cognition → domain-aware hypothesis lift → selected movie`

It does not create a second brain. It ranks the existing movie hypotheses using domain tensions, opportunities, and mode-specific operation fit.

### Why

The universal Author suite is green across the tested domains, but pet-social was still failing on quality rather than factuality. Domain Cognition could correctly identify:

- identity: poodle
- traits: fierce, friendly
- preference: loves bacon
- social preference: loves other dogs
- activity: long walks at night
- tension: fierce ↔ friendly

The missing step was allowing that structured knowledge to influence movie selection.

### New acceptance

`pnpm --filter @qre/api author:domain-movie`

This exercises pet-social, living-memory, and service modes through the domain-to-movie bridge.

### Commercial direction

The product target remains:

`user enters facts → Super Cog discovers the strongest grounded movie → Mouth realizes it → screen-by-screen experience → optional CTA`

The same brain supports living memories, pet social, service media, business media, real estate, events, and exact-data modes.

### Non-negotiable

Domain cognition may increase meaning, tension, attention, and character specificity. It may never manufacture provenance, people, relationships, places, objects, body details, dialogue, literal events, chronology, or commercial facts.

### Next canonical integration

Wire `selectDomainDrivenMovie()` directly into the canonical Author execution path so the selected domain-aware hypothesis becomes the actual movie packet consumed by the one-Mouth renderer.

That integration is deliberately separated from the bridge so the large canonical cognition file can be patched safely rather than overwritten blindly.
