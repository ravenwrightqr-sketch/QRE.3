# QRE AUTHOR ENTERPRISE MASTER

Canonical working map for the Universal Author / Enterprise Realization Engine.

## 1. Core pipeline

```text
EVIDENCE
  -> RealityGraph
  -> RealityEnvelope
  -> Character + Lens
  -> MeaningSpine
  -> Movie Competition
  -> Beat Graph
  -> Realization Slots
  -> Strategy Lattice
  -> Model Candidates
  -> Evidence-aware Quality
  -> Deterministic Grounded Fallback
  -> Sequence Beam
  -> Repair Objectives
  -> Bounded Revision
  -> Cumulative Meaning
  -> Creative Critique
  -> Safety
  -> Final Mouth
```

Qwen proposes language. QRE owns reality, meaning, strategy constraints, scoring, budgets, sequence selection, repair, safety, and acceptance.

## 2. Reality truth layer

`authorRealityGraph.ts` and `authorRealityEnvelope.ts` define the source-truth boundary.

The envelope can contain:

- atomic events and source IDs
- supplied terms and phrases
- supplied actions and states
- opening and endpoint events
- carrier events
- graph relations
- unresolved tensions
- recurring signals
- sensory signals

Interpretation may change the reading of evidence. It may not silently manufacture evidence.

## 3. Hard truth boundary

Never authorize a concrete:

- person
- object
- location
- action
- physical reaction
- dialogue
- sound
- outcome
- chronology
- environmental detail

merely because a domain normally contains it.

A grooming receipt does not authorize scissors, clippers, salon, groomer, leash, kennel, dryer, table, shampoo, tail movement, etc. unless supplied. The same rule applies to weddings, restaurants, real estate, memories, events, and every other domain.

## 4. Meaning Spine

`authorMeaningSpine.ts` converts approved beats and source evidence into deterministic meaning obligations.

A spine beat can carry source events, target events, relation kinds and strength, inherited evidence, and realization obligations.

Middle beats must execute relationships, not merely repeat endpoint facts.

## 5. Realization Slots

`authorMouthRealizationSlot.ts` makes each approved beat a bounded creative job. A slot carries:

- meaning kind
- realization mode
- source/target labels
- source event IDs
- relation kinds and strength
- inherited evidence
- obligations
- forbidden moves
- candidate count

Contrast, reframe, callback, and payoff slots forbid naming the operation instead of performing it.

## 6. Realization Strategy Lattice

`authorRealizationStrategyLattice.ts` deterministically selects safe strategies:

1. contrast
2. status inversion
3. understatement
4. double meaning
5. callback
6. implication
7. personification
8. recontextualization
9. compression
10. reversal

Explicit intent such as `creativeMove: contrast` is authoritative. The model operates inside the approved strategy space.

## 7. Character and lens

`authorCharacterLensEngine.ts` derives a private authoring interpretation from supplied traits, recurring signals, object relationships, contradictions, status posture, and emotional posture.

Canonical lenses:

- comedy
- romance
- horror
- tenderness
- nostalgia
- chaos
- fierce
- absurd
- dramatic
- quiet
- custom

Character and lens affect framing and realization without overriding source truth.

## 8. Character x lens x movie

The same evidence must support different readings while RealityEnvelope remains invariant.

```text
SAME REALITY
  -> character read A -> movie A -> realization A
  -> character read B -> movie B -> realization B
  -> character read C -> movie C -> realization C
```

## 9. Movie competition

`authorMovieCompetition.ts` and latent-movie systems support competing interpretations and dominance. A movie must compete globally, not win merely because individual lines are grammatical.

Counterfactual authoring may ask which supplied detail would create the strongest center of gravity or which alternative reading is more surprising, while never changing reality.

## 10. Candidate generation

`authorMouthCandidateSearch.ts` asks the local model for language variants only.

The model must not:

- re-plan the movie
- invent beats
- explain strategy
- emit planning metadata
- invent concrete reality
- name an operation such as "the contrast" or "the payoff"

Candidate generation is intentionally broader than final acceptance.

## 11. Evidence-sensitive realization

Concrete verbs are evidence-sensitive.

```text
supplied action
  -> exact wording
  -> safe universal linguistic equivalent
  -> unsupported new action
```

Example: supplied `came in` can support a natural equivalent such as `arrived`; it cannot authorize unrelated physical actions such as `snatched`, `wagged`, `grabbed`, `waved`, or `trembled` without evidence.

This prevents both over-strict lexical matching and unsafe synonym expansion.

## 12. Grounded fallback

`authorMouthGroundedFallback.ts` provides deterministic, evidence-locked candidates when model coverage is incomplete.

It is not another planner. It reuses supplied event phrases and safe relationships, consumes no model call, and exists so an incomplete model batch cannot make an otherwise easy case unrecoverable.

## 13. Mouth quality adapter

`authorMouthQualityAdapter.ts` combines raw candidate scores with evidence-aware language evaluation.

It evaluates grounding, meaning execution, transition coverage, graph relation support, naturalness, fragment risk, keyword assembly, analytic language, supported action/entity risk, invention risk, endpoint priority, and creative continuity.

Raw model invention risk remains diagnostic. Acceptance risk is re-derived from the evidence-aware language gate so safe linguistic equivalents are not punished merely because wording differs.

## 14. Beat-role-aware scoring

Hook / arrival / establishment beats primarily establish supplied reality and do not require a middle-beat relationship.

Turn / reframe / contrast / callback beats must execute supported relationships between multiple signals when the beat requires them.

Payoff / release beats prioritize the supplied endpoint and accumulated meaning rather than generic praise.

## 15. Sequence beam

`authorMouthSequenceBeamSearch.ts` selects complete sequences rather than independent winning lines.

It evaluates cumulative cohesion, novelty, repetition, transitions, setup/payoff linkage, meaning continuity, finality, and overall score.

## 16. Cumulative meaning

`authorCumulativeMeaning.ts` enforces the sequence law:

```text
line 1 establishes
  -> line 2 changes the reading
  -> line 3 recontextualizes earlier evidence
  -> final line pays off the accumulated meaning
```

Independent receipt-caption behavior is forbidden when the movie requires cumulative structure.

## 17. Repair system

`authorMouthRepairPlanner.ts` turns failures into deterministic repair objectives with `critical`, `high`, and `medium` priorities.

Repair targets include weak grounding, weak meaning, incomplete transition coverage, analytic language, keyword assembly, invention risk, poor compression, and endpoint failure.

## 18. Creative critique and surprise

`authorCreativeSearch.ts` evaluates obviousness, genericness, grounded surprise, and whether a stronger supplied relationship was missed.

A candidate is not excellent merely because it passes safety. The target is the strongest grounded alternative.

## 19. Enterprise orchestration

`authorEnterpriseMouth.ts` is the canonical orchestration boundary. It:

1. canonicalizes beats
2. builds RealityEnvelope
3. builds MeaningSpine
4. builds RealizationSlots
5. builds enterprise intelligence
6. generates model candidates
7. performs one batched recovery when needed
8. scores and adapts candidates
9. adds deterministic fallback candidates
10. selects with beam search
11. creates repair objectives
12. performs bounded revision when permitted
13. evaluates safety
14. evaluates cumulative meaning
15. emits creative critique and grounded surprise

## 20. Runtime budgets

`authorEnterpriseMouthPolicy.ts` defines bounded modes.

### dev-fast

```text
max model calls: 2
primary: 1
batched recovery: 1
revision: 0
variants/beat: 3
```

### model

```text
max model calls: 1
primary: 1
recovery: 0
revision: 0
```

### full

```text
max model calls: 3 nominal
primary: 1
recovery: 1
revision: 1
```

### no-model

```text
max model calls: 0
```

No per-beat model calls are allowed. Deterministic fallback consumes zero model calls.

## 21. Adaptive model routing

`authorModelRouter.ts` can use event density, relations, tensions, contradictions, and modalities to allocate deeper reasoning only when justified.

Goal: easy cases stay cheap; difficult cases earn more search.

## 22. Persistent memory and profiles

Enterprise authoring is designed to remember:

- successful motifs
- rejected patterns
- character evolution
- preferred lenses
- strategy preferences
- recurring objects and signals
- prior interpretation changes
- per-asset style preferences

Persistence belongs above pure helpers in the existing DB truth layer.

## 23. Versioning and audit

The target version chain is:

```text
Reality version -> Movie version -> Beat version -> Realization version
```

Audit diagnostics should answer which evidence supported a line, which movie/strategy won, which candidates lost, which gate rejected them, what repair was applied, and how many model calls were spent.

## 24. Multimodal intelligence

`authorMultimodalEvidence.ts` normalizes text, image, document, timeline, geo, memory, and scan evidence into a common evidence model.

### Images

Visual observations may become RealityGraph evidence. Visual context must be distinguished from model interpretation and invented context.

### Documents / receipts

Receipts, invoices, service records, reports, and notes become structured evidence events.

### Timelines

Explicit timestamps and supported ordering may be preserved. Fake chronology is forbidden.

### Geo

Coordinate and place signals are evidence. Location never authorizes invented events that supposedly occurred there.

## 25. Geo enterprise layer

The geo system currently supports point normalization, segment construction, repeated-location detection, distance measurement, trace-quality scoring, and evidence-safe temporal/spatial relationships when supported.

Observed self-check:

```text
QRE GEO ENTERPRISE SELF-CHECK: PASS
points=3
segments=2
repeatedSpots=1
distanceMeters=15.12
quality=excellent
```

## 26. Memory and callbacks

Repeated scans and memories can make a recurring detail structurally significant.

Target behavior:

```text
memory A: detail X
memory B: new context
memory C: callback to X with changed meaning
```

Repetition should become characterization or recontextualization rather than duplicate captions.

## 27. Safety and quality floor

JSON validity alone is never PASS.

Acceptance requires, when relevant:

- complete beat coverage
- grounding floor
- semantic execution
- invention ceiling
- language quality
- compression
- sequence quality
- cumulative meaning
- safety
- endpoint payoff
- budget compliance

## 28. Acceptance and self-checks

`authorEnterpriseMouthAcceptanceMatrix.ts` provides cross-domain fixtures such as service, wedding, restaurant, real estate, horror memory, and romantic memory. The matrix checks universal invariants rather than industry templates.

Current clean realization self-check shape:

```text
ENTERPRISE REALIZATION SELF-CHECK: PASS
spineBeats=3
strategyOptions=5
lensFit=0.9
complexity=0.189
movieAlternatives=2
cumulativeMeaning=0.752
matrixCases=6
fastMaxCalls=2
fullMaxCalls=3
```

Current clean geo self-check shape:

```text
QRE GEO ENTERPRISE SELF-CHECK: PASS
points=3
segments=2
repeatedSpots=1
distanceMeters=15.12
quality=excellent
```

## 29. Current live-model issue

The production TypeScript surface is compiling and the deterministic enterprise self-checks pass. The remaining performance frontier is live candidate generation.

The most recent observed Qwen acceptance run returned variants only for beat 1. Because complete beat coverage was absent, sequence selection received no complete candidate pool and the acceptance result was:

```text
expected 4 lines, received 0
beam 0 < 0.32
```

This is a model-output coverage / realization-performance problem, not a TypeScript architecture problem.

The deterministic grounded fallback was added specifically to make incomplete model batches recoverable without another model call.

## 30. Development commands

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build
pnpm --filter @qre/web build
pnpm exec tsc -p apps/api/tsconfig.tests.json --noEmit
pnpm exec tsx apps/api/author-enterprise-realization-selfcheck.ts
pnpm exec tsx apps/api/author-geo-enterprise-selfcheck.ts
```

Live mouth acceptance:

```powershell
pnpm exec tsx apps/api/author-enterprise-mouth-acceptance.ts "Dog grooming service receipt" "Coco" "poodle|nervous|fierce|cool|came in nervous|got a bath|stole a blue bow|left looking fabulous" "came in nervous|got a bath|stole a blue bow|left looking fabulous"
```

Ollama setup:

```powershell
$env:QRE_LOCAL_MODEL="qwen2.5vl:7b"
$env:QRE_AUTHOR_FAST_MODEL="qwen2.5vl:7b"
curl.exe http://127.0.0.1:11434/api/tags
```

## 31. Enterprise roadmap

### Author actually intelligent

- strategy lattice
- deterministic strategy selection
- character model
- lens engine
- character x lens x movie interaction
- persistent author memory
- per-asset creative profile
- deterministic reproducibility
- versioned authoring
- audit trail
- model-agnostic authoring
- model router
- cost/latency controller
- adaptive search budget
- parallel candidate generation
- multi-movie competition
- movie-level beam search
- counterfactual authoring
- creative surprise engine
- cumulative meaning
- longitudinal character arc
- cross-memory callback engine
- authorial style memory
- creative self-critique
- search-until-dominated

### Enterprise completion standard

The author should produce language that is:

- true
- specific
- character-aware
- lens-aware
- cumulative
- surprising without hallucinating
- concise
- natural
- domain-neutral
- auditable
- reproducible where configured
- cost-bounded
- latency-bounded

## 32. Final law

QRE is not `prompt -> LLM -> prose`.

It is:

```text
reality
 -> relationships
 -> character interpretation
 -> lens
 -> competing movies
 -> meaning
 -> beat obligations
 -> realization strategy
 -> language candidates
 -> grounded fallback
 -> evidence/language/truth scoring
 -> sequence beam
 -> repair
 -> creative critique
 -> cumulative meaning
 -> safety
 -> mouth
```

The model is replaceable. The QRE authoring intelligence above it is the durable system.