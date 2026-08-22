# Super Cog Build Map

## Purpose

This is the working map for extending QRE without creating parallel brains, duplicate truth stores, or disconnected "smart" services.

The screen-level experience is the product. Every upstream subsystem exists to make that experience better while preserving reality.

## Canonical pipeline

```text
REAL LIFE
  ↓
INPUT / SCAN / UPDATE / LOCATION / INTERACTION
  ↓
REALITY TYPING
  ↓
MEMORY + EVENT GRAPH
  ↓
IDENTITY STATE
  ↓
DOMAIN COGNITION
  ↓
COGNITIVE STATE
  ↓
OPPORTUNITY SEARCH
  ↓
TRAJECTORY / MOVIE SEARCH
  ↓
SELECTED MOVIE
  ↓
OPTIONAL LENS
  ↓
ONE MOUTH CALL
  ↓
TRUTH / PROVENANCE GATE
  ↓
CINEMATIC PLAYOUT
  ↓
BEHAVIOR + OUTCOME
  ↓
AUTOMATIC LEARNING
  ↓
NEXT IDENTITY STATE
```

## Ownership map

### Contracts

Own canonical types and boundaries.

Path: `packages/contracts`

Do not put domain logic here.

### Memory

Own durable reality, facts, entities, events, relationships, and history.

Path: `apps/api/src/repositories/memoryRepository.ts` and related memory services.

Memory is the source of what actually happened. It is not responsible for deciding what is entertaining.

### IdentityState

Own the canonical cognitive snapshot assembled from existing truth and observed learning.

Path: `packages/contracts/src/cogauthor/identityState.ts`

Projection: `apps/api/src/services/authorIdentityState.ts`

IdentityState is a view, not a second database.

### Domain Cognition

Own context/mode interpretation and domain-specific cognitive opportunities.

Examples: pet social, living memory, service, business media, real estate, event, goal/vision.

It may interpret reality differently by mode, but it cannot manufacture facts.

### Super Cog / Movie Cognition

Own trajectory search, hypothesis generation, cognitive state, movie operations, payoff construction, and winner selection.

This is the central reasoning layer.

### Domain → Movie Bridge

Own domain-aware ranking of existing movie hypotheses.

Path: `apps/api/src/services/authorDomainMovieBridge.ts`

This bridge must remain a selector/ranker, not a second story generator.

### Mouth

Own language realization only.

The Mouth receives one selected movie/experience packet and renders it into language.

The Mouth must not decide reality, discover new facts, invent missing context, or independently rewrite the movie architecture.

### Truth / Provenance Gate

Own final rejection of unsupported realization.

Current validation is partly lexical/semantic. Next target is provenance-aware inference envelopes.

### Experience / Player

Own screen ordering, media, timing, transitions, audio, CTA, interaction, and actual display.

The player is where the user experiences the result.

### Analytics + Creative Learning

Own observed behavioral feedback and observed creative performance.

Examples: completion, abandonment, replay, CTA, errors, accepted/rejected patterns, autonomous winners/weaknesses.

Behavioral learning may influence future cognition but may not become invented reality.

## Hard rules

### 1. One brain

Never create a second universal brain for a new domain.

Add a domain profile/strategy to the shared cognitive substrate.

### 2. One truth

Reality comes from supplied user facts, persisted memory/events, verified location/presence, and observed system behavior.

### 3. No invented reality

Creative transformation may change meaning, framing, rhythm, tone, emphasis, or ordering where permitted.

It may not invent:

- people
- relationships
- places
- objects
- body details
- dialogue
- literal events
- chronology
- ownership
- commercial facts
- medical/legal facts
- motivations presented as facts

### 4. Learning is observation, not biography

QRE may learn from behavior and repeated supplied facts.

QRE may not infer unobserved identity facts merely because they are statistically plausible.

### 5. Every smart feature needs an acceptance surface

New cognition should get a focused acceptance test before it becomes canonical.

### 6. No dead smart helpers

A helper is not considered implemented until the canonical execution path consumes it.

### 7. Don't weaken gates to make a test green

Fix the cognition, packet, provenance, or realization instead.

### 8. Domain mode must be explicit

Domain selection should be automatic where possible. Users should not need to understand internal cognition terminology.

## Current status — 2026-08-21

### Green

- universal Author acceptance across tested domains
- differentiation
- creative budget handling
- reality typing
- domain cognition
- domain-driven movie bridge
- IdentityState contract
- IdentityState API projection compiles
- IdentityState wired into experience authoring path

### Product-level failures still intentionally open

- Pet Social remains below the quality floor in acceptance; current failures include unsupported physical/place expansion and insufficient character lift.
- Living Memory acceptance has produced an unsupported inference (`we never left the bar`) in a passing specialized test. Specialized acceptance must be tightened to the same hard reality law as the universal Author.
- Domain-movie lift currently reports the same `0.42` in pet, memory, and service acceptance; treat this as a placeholder signal until the metric is decomposed.

## Next build sequence

### A. Provenance-aware inference envelopes

Give each fact a type, provenance source, chronology, allowed semantic transformations, and forbidden expansions.

Carry that envelope through cognitive state → movie beat → Mouth → final validation.

This is the next global safety/quality upgrade.

### B. Character Movie Search

For pet/person/identity modes, search specifically over:

- trait tension
- preference leverage
- recurring activities
- social signatures
- persistent character details
- payoff relevance

A character movie must outperform a plain fact list while remaining grounded.

### C. Persistent Meaning Search

For memory/relationship modes, explicitly search for a supplied detail whose meaning changes after later supplied events.

The payoff must emerge from the supplied sequence, not invented relationship status.

### D. Goal / Vision Search

Treat goals and intentions as intent-state material.

Search for:

`goal → current reality → gap → progress → friction → next grounded opportunity`

The system should surface additional useful actions without inventing achievements or commitments.

### E. Context switching

The same identity should move between contexts without becoming different identities:

- pet: daycare / groomer / vet / walker / vacation / social / lost-found
- person: memory / goal / project / relationship / work / travel
- business: media / promotion / service / campaign / event
- property: listing / showing / renovation / service history

### F. Real product surface

User-facing flow should be:

`Create identity → enter simple facts → scan/use → add update → automatic memory → better next experience`

No learning dashboard is required for the user to benefit from learning.

## Quality metrics to mature

Replace placeholder lift with a decomposed score:

```text
baseline movie quality
+ domain-fit gain
+ grounded meaning gain
+ character/relationship gain
+ novelty gain
+ payoff gain
- repetition risk
- unsupported inference risk
```

Also track separately:

- truth preservation
- user engagement
- replay
- completion
- CTA action
- memory application
- return scans

## Commercial thesis

QRE should be sold as a persistent identity/experience engine, not as a generic AI writer.

Examples:

- living pet identity
- living memories
- goal and vision identity
- business identity
- property identity
- service history identity
- event identity

The QR/NFC is the physical doorway into the living identity.

The identity accumulates real life.

Super Cog turns that accumulated reality into the next experience.

## Build discipline

Before adding a feature:

1. Identify its canonical owner.
2. Identify the existing truth it consumes.
3. Identify the one integration seam where it becomes useful.
4. Add focused acceptance.
5. Run universal regression.
6. Update this map and the advancement log.

Do not merge a feature merely because its helper passes in isolation.
