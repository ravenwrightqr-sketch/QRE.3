# QRE AUTHOR BEAT RECOVERY · DETAILED REFERENCE

**Status:** ACTIVE

**Purpose:** preserve a valid semantic movie when the local model fails to return a parseable beat-plan JSON payload.

## Non-negotiable creative law

> **NO HARD-CODED CREATIVE BEHAVIOR.**
>
> Recovery may normalize semantic decisions already discovered upstream. It may not invent domain-specific prose, canned jokes, subject-specific behavior, hidden facts, or alternate story logic.

## Canonical boundary

```text
REALITY
  ↓
LATENT MOVIE SEARCH
  ↓
MOVIE DIFFERENTIATION
  ↓
COGNITION
  ↓
BEAT-DISCOVERY MODEL
  ↓
[PARSE / NORMALIZE]
  ↓
[RECOVER FROM SELECTED LATENT MOVIE IF MODEL FORMAT FAILS]
  ↓
MAGNET / SEQUENCE
  ↓
MOUTH
  ↓
CUT POLICY
```

The recovery layer is **not another author**. It is a semantic projection from an already-selected `LatentMovieCandidate` into the canonical `BeatPlan` shape.

## Why this exists

A previous acceptance run reached:

```text
REALITY GRAPH GREEN
LATENT MOVIE SEARCH GREEN
MOVIE DIFFERENTIATION GREEN
COGNITION GREEN
BEAT PLAN PARSE FAILED
BEATS: 0
FINAL SCENES: 0
```

The failure was a model serialization failure, not a failure to discover a movie. Destroying the valid upstream movie because JSON formatting failed is an unnecessary coupling between model syntax and QRE execution.

## Recovery source

Recovery reads only the selected `LatentMovieCandidate` and the canonical `RealityGraph`.

It may carry forward:

- candidate premise / hypothesis
- candidate evidence
- trajectory operation
- trajectory viewer change
- trajectory next question
- candidate payoff
- trajectory event IDs that still exist in the RealityGraph

It may not create:

- new people
- new objects
- new actions
- new locations
- new dates
- new outcomes
- domain-specific jokes
- replacement story beats unrelated to the selected movie

## Operation normalization

The trajectory already contains semantic operations. Recovery maps those operations into canonical viewer roles and gain kinds.

```text
establish    → arrival / new_fact
contrast     → reframe / reframe
recur        → callback / callback
reframe      → reframe / reframe
escalate     → escalation / escalation
converge     → discovery / discovery
reveal       → discovery / discovery
consequence  → consequence / consequence
payoff       → payoff / payoff
```

These are execution vocabulary mappings, not creative instructions.

## Validation boundary

Recovered plans still pass through the existing beat-plan normalizer before entering SequencePlay.

That preserves the same rejection boundary used for model-produced plans.

A recovery path must never become a validation bypass.

The resulting mouth text must still pass the canonical `evaluateCut` gate.

## Diagnostics

The Universal Author should expose:

```text
beatPlanRetries
beatPlanParseFailed
beatPlanRecovered
beatCount
sequenceCutsAttempted
sequenceCutsRejected
rejectionReasons
finalScenes
```

A healthy recovery run should make it obvious that the model failed structurally while QRE successfully preserved the upstream movie.

## One-time migration

The repository includes:

```text
scripts/apply-author-beat-recovery.mjs
```

It is intentionally a guarded migration. It refuses to rewrite `authorBrainUniversal.ts` unless its expected canonical anchors are present.

Run from the repository root:

```text
node scripts/apply-author-beat-recovery.mjs
```

Then build and run the universal acceptance suite.

## Acceptance target

The original failure:

```text
beatPlanParseFailed: true
beatCount: 0
finalScenes: 0
```

must become either:

```text
beatPlanRecovered: true
beatCount: > 0
sequenceCutsAttempted: > 0
```

or a truthful rejection later in the pipeline if the recovered semantic movie itself cannot survive validation.

The goal is **not** to guarantee scenes. The goal is to remove a meaningless dependency between valid creative cognition and model JSON formatting.

## What this does not solve

Recovery does not replace:

- beat-plan quality
- Magnet quality
- Sequence necessity
- Mouth realization
- Cut policy
- model latency
- candidate differentiation

Those remain separate engineering surfaces.

## Next experiment

After wiring recovery, run the same Coco acceptance input and compare:

```text
model beat plan
vs.
recovered beat plan
vs.
final approved scenes
```

Then test unrelated realities. If recovery improves reliability without producing generic or invented scenes, keep it canonical.
