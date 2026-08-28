# QRE AUTHOR — BEAST PLAN

**Status:** CANONICAL DEVELOPMENT GOAL  
**Branch:** `supplied-media-sequence-convergence`  
**Updated:** 2026-08-28

## 1. THE GOAL

QRE Author should behave like a strong computationally grounded creative system:

```text
SEE ALL SUPPLIED REALITY
        ↓
UNDERSTAND WHAT MATTERS
        ↓
DISCOVER MULTIPLE POSSIBLE MOVIES
        ↓
SELECT THE STRONGEST MOVIE
        ↓
BUILD A REAL VIEWER-STATE TRAJECTORY
        ↓
REALIZE EACH CUT WITH LANGUAGE
        ↓
ALLOW SURPRISE WITHOUT INVENTING REALITY
        ↓
LAND THE PAYOFF
        ↓
LEARN FROM WHAT THE USER ACTUALLY RESPONDS TO
```

The objective is not “better AI prose.” It is **better decisions at every semantic boundary**.

## 2. GLOBAL ARCHITECTURE

```text
INPUT / MEMORY / RUNTIME MATERIAL
        ↓
REALITY + PROVENANCE
        ↓
COGNITION
        ├── character / meaning read
        ├── lens inference
        ├── movie search
        └── viewer-state movie rerank
        ↓
SELECTED MOVIE
        ↓
CANONICAL AUTHOR
        ├── beat projection
        ├── Mouth candidate generation
        ├── Mouth interpretation
        ├── Mouth quality adaptation
        ├── sequence beam
        ├── attention edit
        └── sequence arc diagnostics
        ↓
FINAL SCENES
        ↓
RUNTIME / PLAYER
        ↓
ANALYTICS
        ↓
GOVERNED LEARNING
        ↺
```

There is no second Author and no second movie authority.

## 3. SCIENTIFIC / LINGUISTIC MODEL

The system should maintain separate concepts rather than collapse them into one score.

### Reality

```text
What is actually supplied?
```

### Semantics

```text
What does the supplied relationship make newly meaningful?
```

### Viewer dynamics

```text
What changes in attention / expectation / curiosity / pressure?
```

### Language

```text
What is the sharpest viewer-facing realization of that approved meaning?
```

### Learning

```text
What does user behavior justify changing next time?
```

## 4. THE GOLD REALIZATION MODEL

A strong Mouth candidate should be evaluated on more than lexical overlap.

```text
DIRECT EVIDENCE
      +
SEMANTIC COMPRESSION
      +
INTERPRETIVE FRAMING
      +
SEQUENCE FUNCTION
      +
VIEWER EFFECT
      -
UNSUPPORTED CHARACTERIZATION
      -
UNSUPPORTED CONCRETE CLAIM
```

Lexical overlap remains diagnostic evidence for grounding and repetition. It is not a creativity gate.

Desired transformations include:

```text
talked til close → We stayed.
feeling good → Fabulous.
mud bath was free → Complimentary.
```

The system should prefer the stronger realization when it preserves meaning and truth even when it shares fewer source words.

## 5. UNSUPPORTED CHARACTERIZATION

The system must distinguish:

```text
new event
new property
new implication
new framing
```

A line can avoid inventing an event while still falsely characterizing the supplied world.

Therefore:

```text
“Coffee shop. Already strange.”
```

must not receive a free pass merely because “strange” is not a physical action.

The right behavior is to detect unsupported predicate/property introduction while preserving legitimate rhetoric and compression.

## 6. NORMALCY UNDER PRESSURE

Genre is not a vocabulary obligation.

For horror especially:

```text
extraordinary supplied circumstance
+
ordinary language / ordinary posture
+
underreaction
=
strong tension
```

Do not force ominous adjectives, supernatural explanation, theatrical reactions, or genre clichés.

The same principle generalizes:

```text
comedy → not every line must joke
romance → not every line must declare emotion
sentiment → not every line must explain feeling
absurdity → status / juxtaposition can carry the absurdity
```

## 7. MOVIE SEARCH

Movie Search should discover a path through supplied reality, not summarize the source.

It should balance:

```text
semantic movement
specificity
consequence
callback
terminality
viewer-state change
source-order gravity
trajectory diversity
```

Source order is useful evidence, especially for lived sequences, but never proof of chronology.

## 8. VIEWER-STATE MODEL

Trajectory scoring should evaluate change across cuts, including:

```text
attention
curiosity
contrast
interruption
accumulation
payoff
tempo
state shift
prediction error
source-order continuity
```

No single metric is allowed to define “creative.”

## 9. MOUTH SEQUENCE MODEL

Mouth should produce a sequence that feels authored rather than six independent captions.

The beam should preserve:

```text
cut independence
local grounding
semantic continuity
callback opportunities
rhythm
endpoint strength
```

Exact repetition should generally lose.

Semantic recurrence should remain legal when the return changes function.

## 10. MEMORY + EXPERIENCE

The long-lived system remains separated into:

```text
MEMORY
  durable world truth

EXPERIENCE STATE
  what this experience established / changed / left alive

BEHAVIOR PROFILE
  bounded user preference

ANALYTICS
  observation

LEARNING
  governed inference
```

Learned preference may influence style or selection but never mutate source truth.

## 11. PROOF STRATEGY

Every meaningful Author upgrade needs three forms of proof:

### Compiler proof

```text
pnpm build
```

### Structural proof

```text
author:guard
author:wiring
contract ownership
reachability
```

### Behavioral proof

A focused acceptance run must show the new behavior in actual candidate traces / final scenes.

A green compiler alone never counts as semantic completion.

## 12. BEAST BENCHMARKS

The benchmark suite should eventually cover the same supplied reality under different lenses and modes.

### Living memory

```text
ordinary day
→ small details
→ associative return
→ earned emotional or comic payoff
```

### Comedy

```text
ordinary fact
→ status / contradiction / timing
→ sharp realization
```

### Horror

```text
normal setting
→ impossible / disturbing supplied event
→ people remain normal
→ implication / restraint
→ payoff
```

### Receipt / work sequence

```text
arrival
→ work
→ notable detail
→ completion
→ useful endpoint
```

### Callback memory

```text
new experience
→ old supplied detail returns
→ changed meaning
```

The benchmark is not a fixed output string. It is a set of behavioral invariants.

## 13. ANTI-REGRESSION LAWS

Never allow these regressions:

```text
second movie authority
source order treated as chronology
lexical overlap treated as creativity
whole-world association replacing beat ownership
unsupported property asserted as fact
genre trope replacing supplied meaning
Mouth creating a new story beat
beam creating reality
learning mutating source truth
```

## 14. CURRENT PRIORITY ORDER

When improving the beast, work in this order:

```text
1. architecture / authority correctness
2. source truth / provenance
3. movie trajectory quality
4. viewer-state progression
5. Mouth semantic realization
6. attention / sequence diagnostics
7. behavioral learning
8. runtime feedback loop
```

Do not optimize downstream wording to compensate for an upstream movie-selection failure.

## 15. DEFINITION OF BEAST-LEVEL

QRE reaches Beast-level when, across very different supplied worlds, it consistently:

```text
finds the strongest meaning already latent in the material
→ chooses a coherent movie
→ preserves useful supplied order without hallucinating chronology
→ makes real semantic progress from cut to cut
→ finds concise, surprising language
→ rejects unsupported world additions
→ preserves normalcy when restraint is stronger than theatrics
→ lands earned callbacks and payoffs
→ adapts to learned preference without corrupting truth
```

The final experience should make a developer say:

```text
“How the fuck did it see that?”
```

while the answer remains:

```text
because the source contained it,
because the trajectory earned it,
and because the language realized it without fabricating it.
```
