# QRE MAGNET CIRCLE

**Status:** CANONICAL / ACTIVE  
**Owner:** `ViewerMomentum` + `authorBrainUniversal.ts`

## Core idea

QRE is not fundamentally a creative-writing generator.

The universal primitive is the **MAGNET CIRCLE**:

```text
FACT
  ↓
NOVELTY
  ↓
UNCERTAINTY
  ↓
INFORMATION VALUE
  ↓
ATTENTION
  ↓
TENSION
  ↓
INFORMATION SEEKING
  ↓
NARRATIVE ENGAGEMENT
  ↓
DISCOVERY / REFRAME / PAYOFF
  ↓
NEW UNCERTAINTY
  ↺
```

Creative style is downstream. The magnet is the invariant.

## Canonical dimensions

`MagnetCircle` measures:

```text
novelty
uncertainty
informationValue
attention
tension
informationSeeking
narrativeEngagement
magnetStrength
unresolved
nextNeed
```

These values describe the cognitive state around a cut. They are not prose instructions.

## Subject continuity

Once the subject is established, the viewer holds a **persistent subject-space** in working memory.

The author should not repeatedly spend attention re-establishing the subject unless the reference itself carries information.

```text
SUBJECT ESTABLISHED
        ↓
PERSISTENT SUBJECT-SPACE
        ↓
SPEND WORDS ON THE INFORMATION FRONTIER
```

The rule is not simply "use fewer names." It is:

> **Reference the established subject only when that reference itself carries information. Otherwise write toward the frontier.**

This generalizes across pets, people, brands, places, products, events, and organizations.

## Information frontier

At every cut the author should distinguish:

```text
ALREADY KNOWN
        vs.
NEW / REFRAMED / UNRESOLVED
```

The **information frontier** is the highest-value unresolved edge of the viewer's current model.

A strong next cut moves the frontier. A weak cut merely describes the current state again.

The frontier should therefore outrank:

```text
identity repetition
fact restatement
generic emotion
provider chatter
summary language
```

## Sequence law

A cut earns its place when removing it damages the information-seeking trajectory.

The next cut should feel necessary because the current cut changes the viewer's model, expectation, desire, meaning, or unresolved state.

A sequence is therefore not:

```text
fact → fact → fact → ending
```

It is:

```text
known → valuable unknown → seeking → discovery → new valuable unknown
```

## Creative realization

Creative realization is relative to the world and lens.

The same magnet can become comedy, horror, romance, swagger, mystery, tenderness, absurdity, or another appropriate lens.

Examples are **reference behaviors**, not phrase templates:

```text
Lawyer informed.
Pink bows everywhere.
Coco flaunts the tag.
Fear smear, baby.
```

The system must learn the underlying operations: compression, attitude, implication, contradiction, callback, status shift, theatrical framing, withheld explanation, and escalation.

## Anti-patterns

Do not convert the magnet into:

```text
wholesome moral
literal explanation
viewer-directed question
generic emotional transformation
invented physical choreography
invented backstory
style template
identity repetition after establishment
frontier-starved filler
```

A supplied emotional state is evidence, not automatic plot.

## Measurement discipline

The Master Author exposes:

```text
magnetAverage
magnetPeak
magnetFloor
magnetCutsMeasured
```

Cut evaluation also tracks:

```text
subjectReferenceCost
frontierValue
```

These are diagnostics first. They become selection signals only through demonstrated, cross-domain experiments.

## Current convergence task

`apps/api/src/services/authorCutPolicy.ts` is the **single semantic cut evaluator**.

`authorBrainUniversal.ts` still contains a legacy local `validCut()` implementation and must be migrated to call the canonical evaluator. No second validator should be introduced.

## Evolution rule

When a stronger creative law is discovered:

```text
observe
→ extract latent operation
→ generalize
→ encode in the Master Author / shared contracts
→ test across domains
→ document
→ delete obsolete implementation
```

Never add a domain-specific author branch merely to reproduce one successful example.
