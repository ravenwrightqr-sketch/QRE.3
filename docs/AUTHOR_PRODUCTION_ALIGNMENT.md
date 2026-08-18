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

## ACCOMPLISHED ALIGNMENT

### Latent movie / thesis

The thesis acceptance suite now proves across unrelated probes that the movie can contain:

```text
establish → semantic turn → sealing evidence → supplied payoff
```

with:

```text
turnIsNotPayoff
carrierExists
sealingExists
carrierAndSealDistinct
payoffDependencyExists
counterfactualDependencyAboveFloor
```

all satisfied.

### Mouth endpoint

The Mouth now treats a supplied payoff endpoint as exact reality-owned output rather than a creative invitation.

### Anchor-collage rejection

Multi-signal realization now distinguishes grounded source anchors from actual semantic realization. `source-keyword collage` is a forbidden move and must not win through beam arithmetic.

### Beam boundary

Sequence optimization occurs after semantic validity. The beam is an optimizer, not an authority that can resurrect a semantically invalid line.

### Universal language alignment

Historical/domain-specific examples were removed from the active universal author paths that were found during the alignment sweep. Domain-specific acceptance cases remain tests, not production logic.

### Model configuration

The local runtime must resolve the configured Ollama model through `QRE_LOCAL_MODEL` / `QRE_AUTHOR_FAST_MODEL`. Never invent a second model identity such as `qre-local` when the configured model is otherwise available.

### Structured-output completion budget

Enterprise Mouth full mode now reserves a larger completion budget so candidate JSON has enough room to close. This complements bounded recovery rather than replacing it.

Current policy baseline:

```text
full      → numPredict 1536
model     → numPredict 1024
dev-fast  → numPredict 768
```

## CURRENT KNOWN PRODUCTION HARDENING ITEM

Structured candidate output must survive truncation without throwing away complete earlier beat entries.

Required behavior:

```text
valid complete JSON
→ parse normally

truncated JSON with complete early entries
→ salvage complete variantsByBeat entries
→ recover only missing beat orders

malformed response with no recoverable entries
→ bounded recovery generation

recovery also fails
→ deterministic evidence-locked fallback
```

This is the remaining transport/realization hardening boundary identified by the latest Ollama run.

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

Do not weaken gates to make tests green.

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

Once structured-output recovery and production-path acceptance are green, improve creative search rather than adding more language heuristics:

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
