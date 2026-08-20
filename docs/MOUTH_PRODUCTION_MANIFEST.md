# QRE MOUTH · PRODUCTION MANIFEST

## Purpose

This document is the operational source for the universal Mouth production path.
It records active ownership, invariants, legacy quarantine, and the production test strategy.

## Canonical Runtime

```text
REALITY GRAPH
  ↓
REALITY ENVELOPE
  ↓
COGNITION / LATENT MOVIE
  ↓
MEANING SPINE
  ↓
REALIZATION SLOTS
  ↓
CANONICAL MOUTH GENERATION
  ↓
CANDIDATE NORMALIZATION + TRUTH SCORING
  ↓
DETERMINISTIC SEQUENCE BEAM
  ↓
ATTENTION EDITOR
  ↓
CUT POLICY
  ↓
SEQUENCE ARC / PAYOFF GATE
  ↓
FINAL SCENES
```

## Active Files

| File | Status | Owns |
|---|---|---|
| `authorBrainUniversal.ts` | CANONICAL | end-to-end Author orchestration |
| `authorMouthRealizationSlot.ts` | CANONICAL | semantic realization boundary |
| `authorMouthCandidateSearch.ts` | CANONICAL | generation, normalization, scoring, repair |
| `authorMouthSequenceBeamSearch.ts` | CANONICAL | sequence selection; no meaning invention |
| `authorAttentionEditor.ts` | CANONICAL | whole-sequence editorial evaluation |
| `authorCutPolicy.ts` | CANONICAL | final line legality and contextual repetition gate |
| `authorSequenceArcGate.ts` | CANONICAL | sequence accumulation and terminal payoff contract |
| `authorRealizationStrategyLattice.ts` | SUPPORT / PROMOTION TARGET | realization-strategy selection |

## Non-Canonical / Legacy

The following must not become a second production author path:

- `authorEnterpriseMouth.ts` — alternate/non-canonical orchestration; mine capabilities, do not wire as production Author.
- `authorEnterpriseMouth` acceptance harness — acceptance diagnostics only.
- `authorMouthMonster.ts` — legacy/experimental Mouth implementation; not a production dependency.
- `author-mouth-probe.ts` — probe/experiment; never a production dependency.
- old integration scripts for Enterprise Mouth — historical tooling unless explicitly revived and revalidated.

Legacy files may remain in the repository while they provide reference value, but production wiring must not import them.

## Production Invariants

### Truth

`NEW LANGUAGE IS NOT NEW REALITY.`

The model may change phrasing, rhythm, attitude, status framing, implication, and genre flavor. It may not invent unsupported concrete events, people, places, props, actions, reactions, sounds, chronology, dialogue, or outcomes.

### Sequence

- exact duplicate language cannot occupy two non-terminal cuts in one beam path;
- evidence reuse is legal when the line changes meaning or advances a relationship;
- weak semantic candidates remain available when they are truthful and legal so the Beam can compare complete trajectories;
- the Beam never creates a missing meaning.

### Endpoint

A supplied endpoint selected by the upstream Author is sovereign.
A terminal payoff/release is permitted to land a supplied fact even when that fact is also present in the source reality.
Terminal payoff is not required to create a new frontier or another middle-beat semantic transition.

### Realization Viability

A semantic beat should only survive as a final cut when it can be realized distinctly enough to advance the sequence. The system must prefer trajectory repair/compression over fake duplicate captions.

## Diagnostics

The canonical acceptance harness must expose:

- candidate-pool counts;
- realization texts;
- per-cut policy metrics/reasons;
- global rejection reasons;
- beam score;
- sequence-arc diagnostics;
- endpoint exactness;
- final scene count.

## Fast Test Strategy

Use a two-tier loop.

### Tier 1 · Replay

Capture candidate batches from the model and replay them without model generation while tuning:

- candidate scoring;
- Beam selection;
- duplicate suppression;
- Cut Policy;
- Sequence Arc.

This makes deterministic changes cheap and repeatable.

### Tier 2 · Cross-domain generation

Only regenerate language when the generation contract changes. Required domain families include:

- dog grooming;
- dog daycare;
- animal shelter;
- rescue service;
- living dog tag / pet memory;
- wedding;
- family/living memory;
- restaurant / hospitality;
- real estate;
- event / venue;
- personal story;
- romance;
- comedy;
- horror / dark;
- abstract concept;
- business / product.

The tests should evaluate the same universal invariants rather than domain-specific wording.
