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

## 2026-08-15 — Character-First Rapid-Attention Author

### What we learned

- QRE is **not writing a novel**. It is creating rapid attention loops: grab → develop → grab → turn → payoff.
- Beat length is not the objective. A two-word beat can be excellent when it carries high information and attitude; a longer beat is correct when its creative job requires it.
- The correct optimization is **dramatic information density + next-cut pressure**, not minimum word count.
- `Bows? Again?` is useful because it immediately creates a question. It is the beginning of a sequence, not a complete story by itself.
- Different follow-up directions can be different movies. The author must choose a champion angle and keep the whole sequence loyal to it.
- The character is the center of gravity. The input/event/service is the world the character experiences.
- Character-first does **not** mean repeating `Coco` every beat. Character presence can come from attitude, decisions, reactions, implications, callbacks, and consequences.
- `Coco is a poodle` is a true fact but is not automatically the strongest creative opportunity.
- `Coco sniffs a bow` is an observation, not automatically a reason to continue watching and not an earned ending.
- Generic AI-cinematic language (`quick zoom`, `final shot`, `eyes widen`, etc.) is not a substitute for creative movement.
- Boring jobs such as housekeeping, pool cleaning, grooming, maintenance, or delivery are valid material. The author should find the human angle inside the actual work without fabricating events.
- Grounded reality is hard: never infer gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, weather, or physical events absent from the source.

### Architecture change

Added `apps/api/src/services/authorFastCore.ts` as a dedicated rapid development path:

```text
WORLD / FACTS
      ↓
CHARACTER + CONTEXT
      ↓
COMPETING CREATIVE ANGLES
      ↓
ATTACK / CHOOSE CHAMPION
      ↓
ANGLE + TENSION + MOVEMENT + PAYOFF
      ↓
RAPID-ATTENTION DRAFT
```

It performs one real planning generation followed by one real drafting generation. The purpose is fast cognitive iteration, not production repair.

`apps/api/author-fast-suite.ts` now uses this path and reports the selected angle, tension, payoff, beat count, and raw model output.

`cinematicAuthor.ts` was also strengthened with character-first, evidence-gated instructions and champion-angle fields.

### Current author rules

1. **Character first.**
2. **Reality first.** No unsupported factual invention.
3. **Attention repeats.** Every cut should create a reason for the next cut.
4. **One champion angle per sequence.** Do not mix competing movies.
5. **Length follows the creative job.** Never force two-word beats; never pad them either.
6. **No mechanical subject repetition.**
7. **No fake cinematography.**
8. **Boring reality is usable.** Find the human angle without fabricating events.
9. **Payoff belongs to the character/angle.** No generic farewell.
10. **History matters.** Reuse can be callback; repetition without evolution is failure.

### Benchmark evidence behind these rules

- Maria's timestamp/room list proved that fact preservation alone creates a receipt, not a living memory.
- Coco's `hates bows / loves treats` output proved that semantic facts can still be weak cinematic beats.
- Generic `Still here / Something changes / Then it shifts / See you next time` proved connective filler must be rejected.
- Repeated model outputs invented groomer actions and gendered pronouns. These are now explicit evidence-gated failures.
- Multiple zero-beat runs showed that malformed/truncated structured output must be visible through raw diagnostics instead of silently becoming `BEATS: 0`.

### Next benchmark loop

Use the rapid cases while tuning:

```powershell
pnpm author:fast -- COCO
pnpm author:fast -- MARIA
pnpm author:fast -- HORROR
```

Inspect the actual angle and sequence before running the full suite. The target is not merely green JSON; it is a first beat that creates a real desire to see the next cut.

---

## 2026-08-15 — Fast Author Iteration Loop

Commits: `d61d9996981fc5c8f2ffb423ee4443feb61ec902`, `2a30bcb9e00e2a3289e80468444f858a4fcc1d0d`, `0bd4c4a6b2f3563d6ed61e2544d8d0e248a7c366`

### Problem

The full mouth suite was taking roughly 67–98 seconds per case because a failed first Ollama generation triggered a second repair generation. Running five cases made creative iteration too slow.

### Change

Added a deliberate fast development mode to `microBeatMouth.ts`:

```text
QRE_AUTHOR_FAST=true
```

Fast mode performs **one real Ollama generation** and returns the normalized first result. It does not run the repair retry. The normal author path and full suite retain repair behavior.

Added:

```text
apps/api/author-fast-suite.ts
```

The fast suite runs one selected real Ollama case at a time.

### Purpose

This is **not a quality bypass for production**. It is an experimental loop so we can rapidly tune the mouth, validator, and creative realization without paying for a repair retry on every experiment.

### Iteration Model

```text
small code change
      ↓
pnpm author:fast -- COCO
      ↓
inspect actual sequence
      ↓
small code change
      ↓
repeat
      ↓
pnpm author:full
      ↓
full validation
```

---

## 2026-08-15 — Creative Competition + Sequence Safety

Commit: `d7082e85f76b7728a287117910dd781c327b1cfb`

### Hypothesis

The author already had useful world understanding and creative operators, but one weak interpretation could flow directly into drafting. The result was fact serialization and generic fallback prose.

### Changes

Strengthened the existing `cinematicAuthor.ts` architecture so planning explicitly performs creative competition, attacks candidates, selects a champion, injects creative history, and passes a real creative problem to the mouth.

Also strengthened sequence safety, beat-count fitting, generic filler rejection, paragraph-chopping detection, and non-zero recovery behavior.

### Important Boundary

This is intentionally **not** a hardcoded Coco solution. The goal is universal author cognition: competition → attack → champion → realization → critique → repair.

---

## 2026-08-15 — Establish Author Experiment Memory

### Context

The current `cinematicAuthor` already contains the intended architecture: `CreativeDirection`, hidden premise, operators, affordances, hard constraints, planning, drafting, critique, repair, and local gating.

The current work is to make those layers actually exercise their intelligence instead of relying on the final mouth to rescue weak planning.

### What We Observed

The creative-superstar preflight produced useful signals including personality contrast, tenderness vs resistance, sensory hook, personification, contrast, status inversion, comic turn, callback, and payoff. The problem was that useful planning signals were not consistently surviving into realized beats.

### Core Failure Model

There are three distinct quality levels:

1. **Semantic validity** — grounded and factually supportable.
2. **Cinematic movement** — changes story state or advances what we are watching.
3. **Creative quality** — distinctive, surprising, characterful, and worth seeing as the next cut.

A line can be semantically valid while still being weak cinematic material.

### Architectural Hypothesis

The missing seam is between latent creative planning and beat realization:

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

### Safety Invariant

Validation may reject a candidate, but it must never destroy the whole experience. The author pipeline must preserve required beat count through repair/replacement/degradation rather than ending with `BEATS: 0`.

### Benchmark Policy

Primary creative cases:

- COCO
- COCO-RETURN
- MARIA
- HORROR
- RAVE

The benchmark measures creative properties and invariants rather than memorized prose.

### Iteration Protocol

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

The objective is not merely `FAILURES: 0`. The objective is an author that repeatedly produces grounded sequences where the next beat creates genuine curiosity: **I want to see the next cut.**
