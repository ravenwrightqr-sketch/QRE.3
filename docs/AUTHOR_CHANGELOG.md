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

## 2026-08-15 — Fast Author Lab Performance Pass

### Observation

The new single-case fast lab is functioning correctly, but a real Ollama generation still took **54.543s** for MARIA and produced only one accepted beat (`Laundry Love`).

This proves the bottleneck is now the **single model inference itself**, not the full-suite loop or repair retries.

### Changes

The local model runtime now:

- keeps the Ollama model warm with `keep_alive` (default `10m`)
- caps fast-mode generation with `num_predict: 192`
- uses slightly lower fast-mode temperature (`0.75`)
- exposes the configured model name in the fast test output
- makes the fast lab remain a real model test rather than replacing cognition with a fake fixture

### Important Finding

A fast suite that still requires one cold Ollama model load can remain slow. The next run should therefore be compared against a second consecutive fast run while the model is warm.

If the second run remains near the same latency, the next optimization target is model selection/runtime configuration rather than author code.

### Creative Finding

`MARIA → Laundry Love` is not an acceptable living-memory sequence merely because it is short and grounded. The fast lab exposed a deeper issue: **one accepted beat is not evidence of creative success**.

The fast harness therefore remains a development probe, not a quality gate.

### Next Hypothesis

Run the same fast case twice with the warm model. If latency drops substantially, keep the warm-model workflow. If not, inspect the configured Ollama model and add a clearly configurable fast-model path without changing the production/default model.

The creative target remains unchanged: faster iteration must not mean weaker authorship.
