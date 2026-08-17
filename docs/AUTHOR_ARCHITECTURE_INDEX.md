# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** CURRENT / CANONICAL
**Branch:** `author/enterprise-mouth-rewire`
**Primary reference:** `docs/AUTHOR_CURRENT_STATE.md`

Read `AUTHOR_CURRENT_STATE.md` first. This file is the architecture index; detailed historical experiments are not implementation authority.

## 1. MASTER RULE

> **NO GAPS IN THE PIPELINE.**

```text
ONE REALITY MODEL
ONE LATENT MOVIE SEARCH
ONE MASTER AUTHOR
ONE CANONICAL BEAT GRAPH
ONE MOUTH PATH
ONE ATTENTION EDITOR
ONE TRUTH / CUT GATE
ONE ACCEPTANCE PATH
```

Creative capability may multiply. Semantic authorities may not.

## 2. LIVE AUTHOR STACK

```text
SOURCE TRUTH
   ↓
REALITY GRAPH
   ↓
COGNITION / CHARACTER READ
   ↓
LATENT MOVIE SEARCH
   ↓
MOVIE DIFFERENTIATION
   ↓
BEAT DISCOVERY
   ↓
CANONICAL BEAT GRAPH
   ↓
VIEWER MOMENTUM / MAGNET
   ↓
MOUTH REALIZATION
   ↓
ATTENTION EDITOR
   ↓
TRUTH / CUT POLICY
   ↓
BOUNDED REPAIR
   ↓
FINAL SCENES
```

## 3. REALITY GRAPH

Owner: `apps/api/src/services/authorRealityGraph.ts`

Contract: `packages/contracts/src/experience/realityGraph.ts`

Owns evidence, events, entities, relationships, recurrence, sensory signals, unresolved tensions, and provenance.

RealityGraph does not create source truth. Creative hypotheses remain derived.

## 4. LATENT MOVIE SEARCH

Owners:

```text
apps/api/src/services/authorLatentMovieSearch.ts
apps/api/src/services/authorMovieDifferentiation.ts
```

The system must compare genuinely different movie hypotheses. Tone labels alone are not differentiation.

A selected movie is still a hypothesis, not concrete reality.

## 5. MASTER AUTHOR

Owner: `apps/api/src/services/authorBrainUniversal.ts`

This is the production author authority. It is responsible for sequence discovery, Beat Graph construction, viewer momentum, mouth orchestration, attention editing, final cut gating, and author diagnostics.

It must not contain domain-specific story branches or a duplicate cut validator.

## 6. CANONICAL BEAT GRAPH

Internal beat fields:

```text
order
role
gainKind
change
next
frontier
necessity
attentionFunction
setsUp
paysOff
creativeMove
nextBeatPullTarget
event/source IDs when available
```

Canonical attention functions:

```text
hook question turn escalation reframe callback payoff release
```

Canonical creative moves:

```text
contrast status_inversion understatement double_meaning
personification callback recontextualization implication none
```

Unknown planner metadata must be rejected or intentionally normalized. Silent fallback that falsifies the graph is prohibited.

## 7. VIEWER MOMENTUM / MAGNET

The Magnet Circle remains the sequence primitive:

```text
novelty
→ uncertainty
→ information value
→ attention
→ tension
→ information seeking
→ narrative engagement
→ next unresolved relationship
```

Magnet strength is not a substitute for good writing. It is an internal pressure model that helps select and score movement.

## 8. MOUTH + ATTENTION

The mouth receives the selected Beat Graph plus enough source evidence to realize it precisely.

The Attention Editor judges the realized lines. It does not become a second author.

Final truth/cut acceptance remains authoritative. Attention cannot override grounding.

## 9. RECOVERY

`apps/api/src/services/authorBeatPlanRecovery.ts` and `authorLatentMovieBeatAdapter.ts` are structural recovery/adaptation layers only.

They project an already-selected latent movie into the canonical Beat Graph shape. They must never invent an alternate story.

## 10. PRODUCTION ADAPTERS

`microBeatMouth.ts` and `cinematicAuthor.ts` are adapters/projections, not competing author brains.

## 11. TEST / ACCEPTANCE PATH

The Monster and broader acceptance suites exercise the same `authorBrainUniversal.ts` path.

A benchmark observes production behavior. It does not define production semantics.

## 12. HISTORICAL MATERIAL

Historical author experiments remain useful as evidence of discovered laws but are not current architecture authority.

For current implementation state, use:

`docs/AUTHOR_CURRENT_STATE.md`

For decisions and engineering prioritization, use:

`docs/AUTHOR_DECISION_LAW.md`
