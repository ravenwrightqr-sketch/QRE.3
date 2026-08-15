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

## 2026-08-15 — UNIVERSAL AUTHOR BRAIN CONSOLIDATION

### Major finding

The biggest problem was architectural duplication.

QRE had multiple author surfaces:

- the universal cognition system in `packages/engine/src/cognition/universalMind.ts`
- the production `microBeatMouth.ts`
- `cinematicAuthor.ts`
- the fast author laboratory

The production path was calling `compileCognitiveExperience`, then flattening much of its intelligence into strings before calling the mouth. The mouth therefore had to rediscover information that the Brain had already understood.

### New architecture

```text
PROMPT / MEDIA / MEMORY / PRESENCE / ANALYTICS
                    ↓
             UNIVERSAL COGNITION
                    ↓
       WORLD + RELATIONSHIPS + MEMORY
                    ↓
      CREATIVE CANDIDATES / SIGNIFICANCE
                    ↓
             COGNITIVE PLAN
                    ↓
            UNIVERSAL AUTHOR BRAIN
              ↙               ↘
     creative competition       reality truth
              ↓
        LATENT MOVIE
              ↓
          CUT MOUTH
              ↓
       CINEMATIC EXPERIENCE
```

`apps/api/src/services/authorBrain.ts` is now the shared author realization layer.

Both `cinematicAuthor.ts` and `microBeatMouth.ts` are adapters around that same Brain. The fast author calls the same Brain instead of maintaining a separate experimental author.

### The Brain is deliberately NOT a rigid screenplay template

The upstream cognitive plan is treated as a **search field**, not a script. The Brain can exploit its contradictions, creative possibilities, memory, social model, and future evolution without mechanically copying beat jobs or forcing a fixed sequence shape.

The Brain privately competes between interpretations and attacks the obvious answer before choosing the strongest movie.

### Attention discovery

The strongest short cuts were not good because they had few words. They were good because they removed explanation and left a charged piece for the viewer to complete.

Reference behavior:

```text
The monster appeared.
Pink bows everywhere.
```

This is a reusable **creative operation**, not a Coco template:

```text
SUPPLIED REALITY
    ↓
CHARACTER LENS
    ↓
SURPRISING FRAME
    ↓
CLEAN CUT
    ↓
NEW IMPLICATION
```

The Brain should discover equivalents for weddings, raves, travel, cleaning, pool service, real estate, artifacts, people, horror, and ordinary life.

### Cut grammar

- One line = one attention moment.
- A line may be 2–4 words, but shortness is not the objective.
- Longer lines are allowed when the extra words add real dramatic information.
- Commas and semicolons are currently rejected in scene text because they repeatedly hid multiple visual thoughts inside one sentence.
- Chained `then / while / after / as` constructions are discouraged when they conceal a second cut.
- A cut should create wanting for the next cut.
- Compression means deleting explanation while preserving the strongest idea.

### Service-stage rule

The business/service is the **stage and economic engine**. The customer, pet, couple, person, or other subject temporarily becomes the star.

Do not invent groomers, cleaners, technicians, staff, owners, dialogue, or provider actions unless the source explicitly establishes them.

This is universal. The same rule works for:

```text
housekeeping → resident/guest becomes the story
pool cleaning → homeowner/property becomes the story
pet grooming → pet becomes the story
wedding service → couple/guest becomes the story
concert/event → attendee becomes the story
```

### Subject truth

Created canonical `SubjectTruth` contract.

Identity is now treated as world truth rather than a string-regex guess.

```text
SOURCE / MEMORY / RUNTIME
        ↓
 EXPLICIT SUBJECT TRUTH
        ↓
 AUTHOR MAY USE PRONOUN / SEX / IDENTITY
```

Absent explicit truth, the author remains neutral. The author may never promote its own inference into canonical identity.

Coco's current benchmark truth explicitly establishes male/he-him.

Production now also resolves subject identity from prompt text and **subject-owned active memory facts** through `apps/api/src/services/authorTruth.ts`. Memory facts are scoped by entity ID where available so another person's identity cannot leak into the current subject.

### Cognitive seam repaired

`experienceService.ts` now passes `compiled.plan` into `authorMicroBeats` as `cognitivePlan` and passes the production `SubjectTruth` into the same Brain.

This is critical. The previous implementation sent the mouth facts and context but discarded the universal cognition plan that had already discovered significance, story structure, creative possibilities, memory model, dynamic behavior, and future evolution.

The Brain now consumes that plan as upstream intelligence without being forced to obey it literally.

### Runtime tuning

The fast Ollama temperature was restored from `0.35` to `0.75`.

Reason: the earlier low-temperature fast mode produced repetitive literal paraphrase (`Bows? Yuck! / Treats... / Scared? / Happy...`) instead of exploratory creative framing.

Fast output budget is `192` tokens with model keep-alive enabled so the lab remains rapid without aggressively truncating the JSON envelope.

### Safety invariant

Identity and factual truth must never be inferred by the author from absence or wording accidents. Truth comes from explicit prompt evidence, user/runtime facts, or subject-owned memory facts. Creative framing can reinterpret truth; it cannot manufacture truth.

### Current architectural goal

Do not keep adding mouth regexes to compensate for weak cognition.

The correct order is:

```text
UNDERSTAND
↓
REMEMBER
↓
DISCOVER SIGNIFICANCE
↓
COMPETE
↓
CHOOSE THE MOVIE
↓
AUTHOR
↓
SPLICE CUTS
↓
EDIT
```

The author should become more intelligent primarily by getting **better world understanding, better history, better creative competition, better novelty pressure, better significance discovery, and better learning**—not by accumulating hundreds of phrase bans.

### Next benchmark objective

Run the shared Brain against:

```powershell
pnpm author:fast -- COCO
pnpm author:fast -- MARIA
pnpm author:fast -- HORROR
pnpm author:fast -- RAVE
```

Then test the real production path.

The first success criterion is not `FAILURES: 0`.

It is:

> **Read cut 1. Want cut 2. Read cut 2. Want cut 3.**

The universal author has to make ordinary reality feel unexpectedly worth watching.

---

## Previous findings

The existing entries below are preserved as historical record. They are not necessarily the current implementation.

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

Added `apps/api/src/services/authorFastCore.ts` as a dedicated rapid development path.

The later consolidation supersedes the two-stage planner/draft structure here.

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

---

## 2026-08-15 — Fast Author Iteration Loop

The fast loop exists to accelerate experiments. It is intentionally not a production quality bypass.

---

## 2026-08-15 — Creative Competition + Sequence Safety

The author should use competing interpretations, attack them, select a champion, and protect continuity. This remains valid, but implementation now belongs in the universal Brain rather than duplicated planning layers.
