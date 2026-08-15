# QRE Author Changelog

This file is the permanent experimental memory for the QRE author system.

It records author experiments, hypotheses, observed outputs, benchmark changes, decisions, and next hypotheses so creative progress is not lost between iterations.

## Working Rules

- Change one meaningful author behavior at a time whenever practical.
- Run the real Ollama author runtime after each meaningful change.
- Inspect the actual generated sequences, not only pass/fail status.
- Keep regression tests for behavior that must remain stable.
- Keep creative benchmarks focused on qualities rather than memorizing exact prose.
- Record why a rule exists when we discover it.
- A green test is necessary, but creative quality is the actual target.
- Never weaken a benchmark merely to make the suite green.

---

## 2026-08-15 — Creative Competition + Sequence Safety

Commit: `d7082e85f76b7728a287117910dd781c327b1cfb`

### Hypothesis

The author already has useful world understanding and creative operators, but it was allowing one weak interpretation to flow directly into drafting. The result was fact serialization (`hates bows`, `loves treats`) and generic fallback prose. Separately, strict validation could collapse a failed generation to zero beats.

### Changes

Updated `apps/api/src/services/cinematicAuthor.ts` to strengthen the existing architecture without adding a second brain or a new product category.

1. **Creative competition is now an explicit planning instruction.**
   - The planner must privately generate genuinely different interpretations.
   - It is instructed to compete across character comedy, contradiction, status inversion, tenderness, ritual, identity, mystery, escalation, understatement, transformation, sensory immersion, and callback where justified.
   - Candidates are explicitly attacked for genericity, repetition, unsupported claims, weak visuality, predictability, explanation, or insufficient material for the requested cuts.
   - The selected direction is treated as a champion rather than a first-draft idea.

2. **Creative history is now more strongly injected into planning and critique.**
   - `memoryContext`, `creativeLearningContext`, and `trajectory` are passed through the planner/drafter/critic more deliberately.
   - Prior motifs are treated as history that should evolve or be subverted instead of automatically replayed.

3. **The mouth now receives a real creative problem.**
   - The drafting prompt carries the champion angle/hidden movie, attention goal, emotional engine, sequence jobs, operators, constraints, and payoff.
   - Static facts are explicitly discouraged unless their placement changes the next cut.
   - The mouth is told to transform facts through relationship, contrast, implication, character, tension, or consequence rather than merely list them.

4. **Paragraph chopping is explicitly attacked.**
   - The author is told that one JSON item is one cut-sized thought with a distinct dramatic job.
   - The critic now checks whether line breaks merely disguise one chronological summary.

5. **Generic fallback language is now locally blocked.**
   - Added `Still here`, `Something changes`, `Then it shifts`, and `See you next time.` to the generic-language gate.

6. **Generation now gets three candidate attempts.**
   - We do not blindly accept the first syntactically valid model result.
   - Candidates are sized and locally gated before acceptance.

7. **Zero-beat collapse is prevented.**
   - If generation fails, the pipeline attempts explicit recovery through repair.
   - If later quality gates fail, the existing non-empty sequence is preserved rather than replaced with `[]`.

8. **Target beat count is enforced more deliberately.**
   - Candidates are fit to the selected target count instead of allowing an accidental fifth beat to survive a four-beat direction.

### Important Boundary

This is intentionally **not** a hardcoded Coco solution.

We are strengthening the universal author mechanism: competition → attack → champion → realization → critique → repair.

### Expected Effect

For Coco, the system should move away from:

```text
Coco. The one and only.
hates bows
loves treats
Coco leaves a mark.
```

toward a sequence whose underlying logic is closer to:

```text
character identity
→ resistance / conflict
→ changed negotiation
→ earned status/payoff
```

without requiring those exact words.

For living memories, the same mechanism should allow a wedding, rave, dog adventure, service visit, object history, or later chapter to discover a different angle from the same universal Brain.

### Test Status

**CODE CHANGE APPLIED. REAL OLLAMA BENCHMARK STILL REQUIRED.**

The GitHub-connected environment cannot execute the user's local Ollama runtime, so no claim of green output is made here.

### Next Test

Run locally:

```text
pnpm exec tsx .\\author-creative-superstar-suite.ts
pnpm exec tsx .\\author-mouth-quality-suite.ts
```

Inspect the full COCO, COCO-RETURN, MARIA, HORROR, and RAVE sequences. Record the actual outputs and verdict here before making the next author change.

### Next Hypothesis

If the outputs still serialize facts after the champion angle is supplied, the missing intelligence is not the mouth. It is candidate-beat realization: the planner must express the chosen contradiction as explicit beat jobs before prose generation.

---

## 2026-08-15 — Establish Author Experiment Memory

### Context

The current `cinematicAuthor` already contains the intended architecture: `CreativeDirection`, hidden premise, operators, affordances, hard constraints, planning, drafting, critique, repair, and local gating.

The current work is to make those layers actually exercise their intelligence instead of relying on the final mouth to rescue weak planning.

### What We Observed

The author can already discover useful creative structure. The creative-superstar preflight produced:

- `ATTENTION: personality_contrast`
- `CONTRADICTIONS: tenderness vs resistance`
- `OPERATORS: sensory_hook, personification, contrast, status_inversion, comic_turn, callback, payoff`
- `RHYTHM: JOLT → JOLT → JOLT → PAYOFF`

This is the right kind of latent understanding. The problem is that the useful contradiction/operator plan is not consistently surviving into the realized beats.

### COCO Failure

The generated sequence included:

- `Coco. The one and only.`
- `hates bows`
- `loves treats`
- `Coco leaves a mark.`

The system is therefore serializing facts instead of turning relationships between facts into a cinematic sequence.

The desired distinction is:

- **FACT:** `Coco hates bows.`
- **CHARACTERIZED BEAT:** `Bows? Absolutely not.`
- **RELATIONAL BEAT:** the bow becomes a negotiation.
- **TURN:** treats change the terms.
- **PAYOFF:** Coco leaves with her status intact.

The exact wording is not the benchmark. The underlying transformation is.

### COCO-RETURN Failure

The returning-chapter run produced five beats when four were expected and included weak/static material such as:

- `Bath is quicker today`
- `Pink bow offered again`
- `Coco walks out proud`
- `Bath faster, bow pink`
- `Coco loves treats`

This shows that callback information exists but is not yet being converted into a strong evolving relationship between the previous chapter and today's update.

### MARIA / HORROR / RAVE Failures

One author-mouth run produced generic fallback material such as:

- `Still here`
- `Something changes`
- `Then it shifts`
- `See you next time.`

A subsequent run over-rejected candidates and produced zero beats for Maria and Horror, with Rave also failing to complete cleanly.

This revealed a second architectural problem: validation/repair must not be allowed to collapse an experience to zero beats.

### Current Failure Model

There are three distinct quality levels that must not be conflated:

1. **Semantic validity** — the beat is grounded and factually supportable.
2. **Cinematic movement** — the beat changes the story state or meaningfully advances what we are watching.
3. **Creative quality** — the beat is distinctive, surprising, characterful, and worth seeing as the next cut.

For example:

`Coco loves treats.`

can be semantically valid while still being weak cinematic material.

The author needs to discover relationships such as:

`resistance → conflict → changed terms → status/payoff`

rather than merely outputting:

`fact → fact → fact → generic payoff`.

### Architectural Hypothesis

The missing seam is between latent creative planning and beat realization.

The intended path is:

```text
WORLD FACTS
    ↓
UNDERSTANDING
    ↓
LATENT MOVIE DISCOVERY
    ↓
CANDIDATE BEATS
    ↓
CINEMATIC MOVEMENT GATE
    ↓
SEQUENCE
    ↓
MICRO-BEAT MOUTH
    ↓
CRITIC / REPAIR
```

The cinematic movement gate should distinguish static facts from beats that perform an actual story operation such as introduction, character behavior, opposition, escalation, reversal, recontextualization, callback, or payoff.

The contradiction/operator information already discovered by the author should feed candidate generation and selection rather than remain planning metadata.

### Safety Invariant

Validation may reject a candidate, but it must never destroy the whole experience.

The author pipeline must preserve the required beat count through repair/replacement/degradation rather than ending with `BEATS: 0`.

Conceptually:

```text
candidate
  ↓
validate
  ↓
repair
  ↓
replacement candidate if needed
  ↓
controlled fallback only as last resort
  ↓
required beat count
```

### Benchmark Policy

The current author benchmarks are the proving ground, not obstacles to be weakened.

Primary creative cases:

- COCO
- COCO-RETURN
- MARIA
- HORROR
- RAVE

The benchmark should measure creative properties and invariants rather than require memorized lines.

Regression expectations include things such as:

- correct beat count
- grounding of supplied facts
- preservation of supplied timestamps when relevant
- meaningful callbacks on returning chapters
- rejection of generic filler
- distinct cinematic beats

Creative expectations include:

- personality contrast
- contradiction exploitation
- operator diversity
- cinematic movement
- escalation or reversal where appropriate
- earned payoff
- subject-centered storytelling
- short, screen-ready micro-beats

### Iteration Protocol

For fast author development:

```text
change ONE meaningful behavior
        ↓
run real Ollama runtime
        ↓
inspect planner + actual sequence
        ↓
run benchmark suite
        ↓
record result here
        ↓
commit coherent change
        ↓
form next hypothesis
```

The objective is not merely `FAILURES: 0`.

The objective is an author that repeatedly produces grounded sequences where the next beat creates genuine curiosity: **I want to see the next cut.**

### Initial Verdict

**PARTIAL / CONTINUE**

The author is demonstrating real creative planning signals, especially contradiction and operator discovery, but those signals are not yet reliably realized as cinematic beats. The mouth is also being asked to compensate for planning weaknesses, and the current validation/repair path can over-reject into zero beats.

### Next Hypothesis

Connect contradiction + selected creative operators to candidate beat realization, while introducing explicit cinematic-movement evaluation and a hard no-zero-beat invariant.

Do not solve this by adding more generic movement words or by hardcoding desired Coco prose.

---
