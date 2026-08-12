# Super Cog — Next Level Plan

## North star

QRE is a universal experience compiler, not a story-template generator.

A prompt can describe any subject or world: a person, animal, relationship, wedding, rescue, event, business, home, object, place, service, memorial, journey, identity, or fictional world. The compiler should understand the evidence, choose the right experience mechanics, realize concrete presentation, and then improve future experiences from trusted history.

## Current architecture

```text
PROMPT
  ↓
COGNITIVE UNDERSTANDING
  ↓
EVIDENCE + PREMISE + RELATIONS
  ↓
COGNITIVE PLAN
  ↓
UNIVERSAL EXPERIENCE COMPILER
  ↓
FLOW / MOMENTS / CINEMATIC RUNTIME
  ↓
SCAN / PARTICIPATION / OUTCOMES
  ↓
GOVERNED LONG-TERM MEMORY
  ↺
```

The engine remains database-agnostic. The API owns persistence through repository adapters. Shared semantic/runtime types live in `@qre/contracts`.

## Implemented in this phase

- Added typed long-term memory contracts for entities, facts, relations, events, provenance, confidence, visibility, and status.
- Added conservative memory compilation from the canonical cognitive premise.
- Prevented `creative_realization` evidence from becoming durable factual memory.
- Added animal/property/event/object/organization-aware entity classification.
- Added PostgreSQL durable memory graph tables and indexes.
- Added append-oriented memory audit records.
- Added tenant-aware memory authorization through asset ownership/account membership.
- Added memory retrieval before experience compilation.
- Added memory consolidation after successful compilation.
- Added an explicit `remember` API path that updates memory without compiling a new experience.
- Added episodic scan events to durable memory without treating scan behavior as world truth.
- Added memory compiler acceptance coverage.
- Removed credential-bearing database logging from API startup.

## Enterprise invariants

### 1. Truth is not prose

Narrative realization can be imaginative. Durable facts cannot silently inherit that imagination.

### 2. Provenance is mandatory

Every durable fact has source, confidence, observation time, visibility, and status.

### 3. History is not overwritten

Facts can be superseded or retracted. Events remain replayable. Audit records remain append-only.

### 4. Memory is tenant-scoped

The first namespace is the QRE Asset. Account membership and ownership are checked before authenticated memory reads/writes.

### 5. Analytics are signals, not truth

A scan, click, completion, or return is evidence of behavior. It is not automatically a fact about a person or world.

## Next hardening sequence

### A. Close the remaining realization failures

- `test:semantic-realization`: living-memory payoff must express the canonical semantic action.
- `test:concrete-experience`: agency/prestige mechanic must reach observable participant choice language.

These are language-boundary defects, not architecture defects.

### B. Make memory influence cognition more directly

Memory retrieval currently supplies trusted context to the universal compiler. The next step is to expose high-confidence memory facts and relations as explicit cognitive evidence so repeated interactions can change hypotheses, progression, relationship framing, and future evolution without replacing prompt authority.

### C. Add outcome learning

Persist explicit outcomes such as completed, contributed, returned, shared, redeemed, booked, purchased, corrected, rejected, and owner-confirmed. Outcomes become `outcome`/`behavior` facts only when their source is observable or explicitly supplied.

### D. Add correction and quarantine

Owners should be able to confirm, edit, retract, privatize, quarantine, and restore memory with full provenance.

### E. Add semantic retrieval at scale

Keep deterministic graph lookup as the authority. Add embeddings/vector retrieval beside it when memory volume warrants semantic search. Vector similarity is a retrieval aid, not the truth layer.

### F. Add operational controls

- structured audit events
- retention policies
- deletion/export workflows
- rate limiting on memory writes
- request correlation IDs
- memory latency/rejection metrics
- production CORS configuration
- CI build + cognition acceptance matrix

## Definition of Super Cog readiness

A single physical QRE should accumulate a durable, trustworthy world over time:

```text
"This is Max."
      ↓
Max = animal / poodle
      ↓
Max belongs to family
      ↓
Max has memories, places, people, events
      ↓
next scan retrieves the trusted history
      ↓
experience changes because Max has history
      ↓
new verified events extend the history
      ↓
owner can correct or retract anything
```

The same mechanism must work for a wedding, house, rescue, business, event, artwork, vehicle, memorial, service, relationship, or fictional world without adding a new hard-coded compiler architecture for each domain.
