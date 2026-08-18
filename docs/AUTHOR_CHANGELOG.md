# QRE Author Changelog

This is the permanent experimental memory for the QRE Author.

Historical entries remain below, but the latest **CURRENT TRUTH** section overrides stale implementation claims.

## Working Rules

- Trace the full influence graph before changing author/cognition/compiler behavior.
- One canonical change at a time.
- Run the real Ollama runtime after meaningful changes.
- Inspect raw output, validated output, and production-path output.
- Learn general mechanisms, not phrase blacklists.
- Never weaken quality gates to make tests green.
- After 2–4 meaningful experiments, update this file and the architecture index.
- **Creative capability may multiply. Author authorities may not.**

---

## CURRENT TRUTH — 2026-08-18

### Whole-author alignment pass — IN PROGRESS / CANONICAL CONTRACTS CONVERGED

The recent failures exposed a structural issue: QRE had the right cognitive concepts in multiple modules, but semantic contracts were not being enforced consistently at every downstream boundary.

The canonical path is now treated as:

```text
SOURCE TRUTH
→ RealityGraph
→ Latent Movie Search
→ Latent Story Thesis
→ Meaning Spine
→ Realization Slot
→ Candidate Generation
→ Candidate Semantic Gate
→ Sequence Beam
→ Critic / Repair
→ Attention / Sequence Arc
→ Final Cut
```

A stage may interpret information from the preceding stage, but it may not silently replace that stage's authority.

### Discovery: semantic contracts were dying between modules

The major discovered failure was:

```text
RealizationSlot
  correctly contained:
    obligations
    relationKinds
    sourceLabels
    targetLabels
    forbiddenMoves

but downstream candidate selection treated those fields as prompt decoration
rather than executable constraints.
```

This created the failure mode:

```text
supplied fact A
+
supplied fact B
+
graph relation exists
=
"meaningful" candidate
```

without proving that the sentence actually performed the relationship.

### Candidate semantic boundary — HARD

`authorMouthQualityAdapter.ts` now enforces semantic eligibility before sequence optimization.

A candidate is rejected when it violates the canonical contract through:

```text
weak grounding
weak meaning
weak semantic transition
incomplete transition coverage
keyword / anchor collage
analytic realization language
language gate failure
non-exact supplied endpoint
high invention risk
question leakage
```

An empty valid pool is an explicit recovery signal. Invalid language is never silently promoted just because it is the only remaining candidate.

### Payoff authority — HARD

The final supplied endpoint is no longer a creative suggestion.

For payoff / release slots:

```text
supplied endpoint
→ exact realization
→ no prefix
→ no suffix
→ no appended earlier evidence
→ no replacement ending
```

Earlier lines earn the ending. The ending itself is reality-owned.

### Grounded fallback — serialization safety net only

`authorMouthGroundedFallback.ts` is now explicitly a bounded serialization fallback.

It may:

```text
compress supplied evidence
connect already-supplied state/action signals
serialize the exact supplied endpoint
```

It may not:

```text
invent an interpretation as fact
create a second author
concatenate source labels into a fake sentence
prepend material before the endpoint
append material after the endpoint
```

### Universal language gate — ENTITY NEUTRAL

`authorMouthLanguageGate.ts` no longer contains domain-specific emotional / object examples.

It now evaluates language structurally:

```text
naturalness
fragment risk
keyword assembly
analytic language
unsupported concrete language
supported action/entity risk
question leakage
```

One-word supplied anchors remain legal language rather than being rejected simply for being short.

The unsupported-concrete calculation was also corrected so unsupported concrete terms are actually counted instead of being filtered out by the detection predicate.

### Latent Movie → Beat adapter — repaired contract

`authorLatentMovieBeatAdapter.ts` now preserves endpoint authority when projecting the selected movie into Beat Graph semantics.

In particular:

```text
converge → turn
payoff   → payoff
payoff.paysOff → [candidate.payoff]
```

The adapter does not invent a new attention category that does not exist in the Beat Graph contract.

### Critic — aligned to cognition instead of wording alone

`authorMouthCritic.ts` now explicitly distinguishes:

```text
grounded candidate
vs.
semantically realized candidate
```

A relational candidate that merely lists two supplied anchors is considered `anchor_collage` rather than successful realization.

A payoff candidate that does not exactly equal the supplied endpoint is `non_exact_endpoint` and cannot be accepted.

### Repair Planner — hard failures propagate

`authorMouthRepairPlanner.ts` now treats:

```text
non-exact endpoint
semantic-contract-invalid
```

as critical repair conditions.

Repair instructions remain bounded language objectives; they do not become a second creative authority.

### Sequence Arc Gate — universalized

`authorSequenceArcGate.ts` is now entity-neutral and rejects structural failures such as:

```text
anchor collage
weak meaning transition
generic summary
weak setup continuity
weak final payoff
weak final transformation
```

Historical domain-specific vocabulary is not part of sequence semantics.

### Adapter invariant

`authorLatentMovieBeatAdapter`, `authorMeaningSpine`, `authorMouthRealizationSlot`, `authorMouthQualityAdapter`, `authorMouthCandidateSearch`, `authorMouthSequenceBeamSearch`, `authorMouthCritic`, and `authorMouthRepairPlanner` must preserve the same semantic meaning across the boundary.

The adapter is not allowed to downgrade a semantic contract into free text.

### Master Author remains the authority

`authorBrainUniversal.ts` remains the sole upstream creative authority for the universal author path.

The recent pure-universal acceptance suite remains green with unrelated reality probes. No domain-specific author branch is permitted to re-enter the cognitive path.

### Proven cognitive milestones

```text
Pure Universal Cognition          PASS / 1.0
Pure Latent Story Thesis          PASS / 1.0 / 4 of 4 probes
Endpoint closure                  PASS
Carrier / sealing distinction     PASS
Counterfactual dependency         PASS
Ollama local runtime              PASS / qwen2.5vl:7b
```

### New engineering law

> **A cognitive concept is not real until every downstream consumer enforces the same contract.**

This is now a permanent QRE author law.

The system must not contain a clever Meaning Spine whose constraints disappear when candidates reach the Mouth.

---

## CURRENT TRUTH — 2026-08-15

### One brain / one path / one acceptance harness / guarded

The author architecture is now intentionally consolidated:

```text
PRODUCTION
experienceService
→ microBeatMouth / cinematicAuthor adapters
→ authorBrainUniversal

ACCEPTANCE
author-acceptance-suite
→ authorBrainUniversal
```

Both paths enter the **same Master Author**.

### Architecture drift guard

`scripts/verify-author-architecture.mjs`

The guard is now part of the repository build and CI path.

It fails when it detects:

```text
missing Master Author
missing canonical acceptance harness
legacy author files reintroduced
legacy author test pile reintroduced
acceptance imports a bridge instead of the Master Author
production imports deleted author paths
Master Author recreates a local validCut() validator
Master Author stops importing the canonical authorCutPolicy
```

The root build begins with:

```text
pnpm author:guard
```

CI runs the same guard before package builds.

This means architectural drift is now a **machine-enforced failure**, not a memory task.

### Master Author

`apps/api/src/services/authorBrainUniversal.ts`

This is the only Goal-1 creative author authority.

The Master Author now carries:

```text
Magnet Circle
Subject Continuity
Information Frontier
Sequence Necessity
Canonical Cut Policy evaluation
```

It must remain a living intelligence core: expand it when a general creative law is discovered; never reintroduce domain-specific or benchmark-specific author branches.

### MAGNET CIRCLE — CANONICAL SEQUENCE PRIMITIVE

QRE's universal creative invariant is not a prose style. It is the **MAGNET CIRCLE** inside `ViewerMomentum`:

```text
FACT
→ NOVELTY
→ UNCERTAINTY
→ INFORMATION VALUE
→ ATTENTION
→ TENSION
→ INFORMATION SEEKING
→ NARRATIVE ENGAGEMENT
→ DISCOVERY / REFRAME / PAYOFF
→ NEW UNCERTAINTY
↺
```

The shared contract exposes `MagnetCircle`, and the Master Author computes it for every sequence transition.

Diagnostics expose:

```text
magnetAverage
magnetPeak
magnetFloor
magnetCutsMeasured
```

The magnet is the invariant; creative style is downstream realization. Comedy, horror, romance, swagger, mystery, tenderness, absurdity, and other lenses can realize the same cognitive magnet differently.

### SUBJECT CONTINUITY + INFORMATION FRONTIER

Once the viewer knows the subject, the subject remains active in working memory.

```text
SUBJECT ESTABLISHED
→ PERSISTENT SUBJECT-SPACE
→ SPEND WORDS ON THE INFORMATION FRONTIER
```

The author should reference the subject again only when that reference itself carries information. Otherwise the next cut should spend its language on the newest valuable edge of the viewer's model.

The `InformationFrontier` contract tracks:

```text
known
frontier
novelty
uncertainty
informationValue
tension
nextNeed
```

The canonical cut policy measures:

```text
subjectReferenceCost
frontierValue
```

This is a universal law, not a Coco-specific rule.

### Production adapters

`apps/api/src/services/microBeatMouth.ts`

- projection/runtime adapter only
- no independent author
- no fixed creative beat count

`apps/api/src/services/cinematicAuthor.ts`

- rendering adapter only
- no independent author
- no critique/repair author loop
- no fixed creative beat count

### Canonical acceptance harness

`apps/api/author-acceptance-suite.ts`

Cases currently preserved:

```text
COCO
COCO-RETURN
MARIA
HORROR
RAVE
```

Run with:

```powershell
pnpm author:fast -- COCO
```

The harness calls `authorBrainUniversal` directly. There is no test-only author bridge and no test-only creative prompt enrichment.

### Deleted author junk

Removed:

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/authorBrainMomentum.ts
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
apps/api/src/services/authorFastCore.ts
apps/api/src/services/creativeRelationOps.ts
```

### Deleted test junk

Removed the accumulated one-off API author benchmark scripts.

The single replacement is:

```text
apps/api/author-acceptance-suite.ts
```

### Upstream cognition remains authoritative

Keep and evolve:

```text
packages/engine/src/cognition/universalMind.ts
packages/engine/src/cognition/worldModel.ts
packages/engine/src/cognition/significanceEngine.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/mindState.ts
```

These provide world understanding, significance, creative candidate search, planning, and learning. They are upstream cognition, not competing mouths.

### Cut policy convergence — COMPLETE

`apps/api/src/services/authorCutPolicy.ts` is now the **single semantic cut evaluator**.

`authorBrainUniversal.ts` no longer owns a duplicate `validCut()` implementation. The Master Author passes candidate cuts through the canonical policy with prior-cut context and exposes rejection reasons for diagnostics.

The canonical evaluator owns:

```text
groundedness
novelty
implication
explanation
question leakage
invention risk
repetition
compression
subject reference cost
information frontier value
```

### Core creative laws

```text
identity is baseline
truth ≠ attention
source state ≠ plot instruction
emotion ≠ automatic story arc
creative interpretation ≠ invented event
questions belong in hidden cognition
provider/service is usually stage context
subject/world gravity
persistent subject-space after establishment
information frontier outranks identity repetition
compressed impact > word-count fetish
one cut = one attention moment
next cut must earn itself
recurrence requires evidence
sparse world → smaller invented-world surface
magnet strength > beat count
remove a cut → if the information-seeking trajectory weakens, it mattered
creative style is downstream realization, not the universal objective
```

### Test integrity invariant

> **The test must not influence the production path, and the production path must not use a different author from the test.**

A benchmark is an observer. The Master Author is the authority.

### Next engineering target

Now that the path and semantic judge are converged, the next intelligence pass is **creative search**:

```text
WORLD FACTS
→ RELATION GRAPH
→ MULTIPLE MAGNET CANDIDATES
→ COUNTER-OBVIOUS ATTACK
→ MAGNET RANKING
→ SEQUENCE
→ THEATRICAL REALIZATION
```

The objective is not better wording first. The objective is to discover the highest-value information frontier before realizing it as language.

After that, evolve `creativePolicy.ts` away from domain-specific prose templates toward reusable creative operations that search the Magnet Circle instead of choosing wording first.

---

## HISTORICAL ENTRIES

Older experiments are retained as evidence of discovered creative laws. They are not implementation authority.

Key durable findings include:

- QRE is splicing film, not writing a conventional paragraph.
- Two-word cuts can be powerful when they carry high implied context.
- Shortness itself is not the objective.
- A fact can be true without earning an attention cut.
- Emotional states are evidence, not automatic plot structure.
- Generic transformation arcs are a common failure mode.
- Service providers are usually stage context rather than protagonists.
- Questions belong in hidden cognition unless they are supplied source language.
- Sparse inputs should produce tighter creative implication rather than fabricated backstory.
- Returning chapters must change meaning rather than replay earlier chapters.
- Older benchmark phrases are historical evidence only and must never be treated as production templates.

See:

`docs/QRE_AUTHOR_GOAL.md`
`docs/AUTHOR_ARCHITECTURE_INDEX.md`
`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`
`docs/QRE_MAGNET_CIRCLE.md`
