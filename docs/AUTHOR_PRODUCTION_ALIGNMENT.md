# QRE Author · Production Alignment Ledger

This file is the permanent operating log for the universal Author.

Its purpose is to prevent the team from solving the same failure more than once and to keep cognition, realization, validation, and deployment on one trajectory.

## CURRENT TARGET

Production objective:

```text
SUPPLIED REALITY
→ STRUCTURED REALITY GRAPH
→ EVIDENCE RELATIONS
→ LATENT MOVIE SEARCH
→ LATENT STORY THESIS
→ MEANING SPINE
→ REALIZATION SLOTS
→ LANGUAGE CANDIDATES
→ SEMANTIC VALIDATION
→ SEQUENCE BEAM
→ CRITIC / REPAIR
→ FINAL EXACT ENDPOINT
```

The Author must remain universal. Domain examples are evidence for acceptance tests, never architecture.

## HARD LAWS

### Reality owns facts

No author stage may invent a concrete person, object, location, action, reaction, chronology, sound, or outcome.

### Cognition owns meaning

The latent movie, thesis, spine, and realization slot determine what changes between beats. The Mouth supplies language only.

### Grounding is not meaning

A sentence can contain supplied facts and still fail the cognitive job. Keyword overlap must never substitute for semantic movement.

### One beat = one cognitive job

A beat must earn its place by advancing the viewer model. Fact collage is not a realization.

### Endpoint authority is absolute

If reality supplies the ending, the final realization is that supplied endpoint. Previous beats earn it; they do not get appended to it.

### Beam optimizes valid candidates

The beam must not use sequence arithmetic to rescue a candidate already rejected for semantic invalidity, invention, endpoint violation, or forbidden realization behavior.

### Recovery is bounded

Primary generation may fail. Recovery should salvage complete structured entries and regenerate only missing beats. Do not multiply model calls just because one response was malformed.

### Transport failure is not cognitive failure

Truncated JSON, malformed structured output, or model transport errors are recovery conditions. They must not erase already-generated valid beats.

### Universal means entity-neutral

No active author authority may depend on Coco, grooming, wedding, restaurant, cannabis, horror, or any other domain-specific vocabulary. Domains belong in supplied evidence and optional external knowledge, not in the author core.

### One authority per responsibility

Creative capability may multiply. Author authorities may not.

```text
Reality authority        → RealityGraph / RealityEnvelope
Movie authority          → Latent Movie search
Thesis authority         → Latent Story Thesis
Meaning authority        → Meaning Spine
Job authority            → Realization Slot
Language authority       → Mouth Candidate Search
Sequence authority       → Mouth Beam
Judgment authority       → Critic / Cut Policy / Sequence Gate
```

## VERIFIED GREEN LAYERS

The following acceptance layers have already reached green during this build cycle:

```text
TypeScript contract build             PASS
TypeScript engine build               PASS
TypeScript API build                  PASS
API test typecheck                    PASS
pureUniversalCognitionAcceptance      PASS · 4/4
pureLatentStoryThesisAcceptance       PASS · 4/4
```

The latent thesis gate proved the universal structure:

```text
establish → semantic turn → sealing evidence → supplied payoff
```

with carrier, sealing, endpoint dependency, distinctness, and counterfactual checks satisfied across unrelated realities.

## MOUTH HARDENING COMPLETED

The Mouth path now enforces:

```text
exact supplied payoff endpoint
source-keyword collage rejection
semantic invalidity before beam optimization
universal fallback boundaries
shared realization-slot semantics
bounded repair/recovery
```

## STRUCTURED-OUTPUT HARDENING

The latest Ollama failure was transport-level: the model response ended before the JSON document closed.

The reproducible fix is now tracked as:

```text
scripts/harden-author-production-transport-v1.mjs
```

The hardener is designed to:

```text
1. preserve complete variantsByBeat objects from truncated model output;
2. let the existing bounded recovery path request only missing beat orders;
3. preserve valid early candidates instead of converting the entire response to an empty batch;
4. align the local Ollama fallback with qwen2.5vl:7b when no explicit model is configured.
```

The enterprise Mouth completion budget is also raised so structured candidate JSON has enough room to close without creating unbounded calls:

```text
full      → numPredict 1536
model     → numPredict 1024
dev-fast  → numPredict 768
```

The performance law remains bounded: primary + recovery + revision at most three calls in full mode.

## CURRENT TRAJECTORY

The author is now intentionally organized around one invariant path:

```text
REALITY
→ RELATIONS
→ LATENT MOVIE
→ THESIS
→ MEANING SPINE
→ REALIZATION SLOT
→ CANDIDATE
→ SEMANTIC CONTRACT
→ BEAM
→ CRITIC
→ REPAIR
→ EXACT PAYOFF
```

When debugging, identify the first boundary where an invariant is lost. Do not repair downstream symptoms before restoring that upstream contract.

## DEBUGGING DISCIPLINE

Never rerun an unchanged test and call it progress.

For every failure:

```text
1. Identify the exact boundary that failed.
2. Determine which contract was lost.
3. Change the narrowest responsible authority.
4. Rebuild/type-check.
5. Run the changed behavioral gate.
6. Record the discovered law here.
```

Do not weaken quality gates to make tests green.

## ACCEPTANCE LADDER

Use this order after meaningful author changes:

```text
contracts build
engine build
api build
API test typecheck

pureUniversalCognitionAcceptance
pureLatentStoryThesisAcceptance
enterprise mouth acceptance
production-path acceptance
```

A green upstream cognition gate does not prove a green Mouth. A green Mouth gate does not prove a green production path.

## DO NOT REINTRODUCE

```text
hardcoded domain branches
benchmark-specific prose templates
emotion → automatic plot transformations
fact concatenation presented as meaning
endpoint embellishment
independent fallback authors
second model identity names
per-test author logic
copying old architecture back into the live path
```

## NEXT INTELLIGENCE TARGET

Once the structured-output recovery path is green on the real Ollama run, stop adding language heuristics and return to creative search:

```text
WORLD FACTS
→ RELATION GRAPH
→ MULTIPLE MAGNET CANDIDATES
→ COUNTER-OBVIOUS ATTACK
→ INFORMATION FRONTIER RANKING
→ LATENT MOVIE
→ THESIS
→ REALIZATION
```

The objective is to discover the most valuable meaning before rendering it.
