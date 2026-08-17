# QRE AUTHOR — DECISION LAW

**Status:** CANONICAL CURRENT STATE  
**Scope:** Universal author path in `apps/api`  
**Invariant:** **NO GAPS IN THE PIPELINE.**

## The Law

> **Every authoring component must improve discovery, differentiation, momentum, truth, or sentence quality — and that improvement must survive into the final viewer-facing sequence.**

QRE is not trying to build a larger pile of author machinery. The goal is a decisive universal author that can take arbitrary supplied reality, discover the strongest latent movie inside it, realize that movie as short cinematic beats, protect truth, and deliver a complete sequence to the player.

## Canonical Author Path

```text
SUPPLIED REALITY
      ↓
REALITY GRAPH
      ↓
COGNITION / CHARACTER READ
      ↓
LATENT MOVIE SEARCH
      ↓
BEAT GRAPH
      ↓
VIEWER MOMENTUM / MAGNET
      ↓
MOUTH CRAFT
      ↓
ATTENTION EDITOR
      ↓
FINAL CUT / TRUTH GATE
      ↓
BOUNDED REPAIR
      ↓
FINAL SCENES
```

Every stage has an owner. No stage may silently replace the responsibility of another stage.

## Ownership Rules

### Reality

Facts, source moments, memory, provenance, and reality-graph evidence are the only concrete world.

Reality may be interpreted. Reality may not be rewritten.

### Cognition

Cognition discovers relationships, contradictions, character posture, callbacks, candidate lenses, and latent movies.

Cognition is private authoring control. It never becomes viewer-facing prose.

### Beat Graph

The Beat Graph is the **single source of truth for SequencePlay**.

Each beat carries:

```text
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
source/event provenance when available
```

`change` is the smallest meaningful shift in viewer interpretation.

It is not an explanation, summary, question, or analyst conclusion.

### Attention Arc

The attention arc is an internal map of dramatic movement. It must describe what the sequence is doing, not decorate the prompt.

Typical functional progression:

```text
HOOK
→ TURN / REFRAME
→ ESCALATION / CALLBACK / CONSEQUENCE
→ PAYOFF / RELEASE
```

The sequence does not have to use this exact shape when reality does not support it. But every beat must have a genuine job.

### Mouth

The Mouth receives an approved Beat Graph and concrete source truth.

The Mouth does **not** re-plan the story.

Its job is to compress the selected meaning into a short, character-specific, viewer-facing line.

Allowed creativity includes metaphor, status language, double meaning, personification, understatement, recontextualization, implication, contrast, callback, and character-specific exaggeration — provided the meaning remains recoverable from supplied reality.

The Mouth may not invent a new concrete event, person, object, location, dialogue, physical reaction, outcome, or unsupported causal fact.

### Attention Editor

The Attention Editor is an editorial layer, not a second author.

It evaluates:

```text
factuality
specificity
attention
novelty
status change
next-beat pull
creative move
repetition
cinematicity
setup
payoff
invention risk
mouth usability
beat execution
```

It diagnoses weaknesses. It does not silently change the approved movie.

### Final Cut Gate

The final cut/truth gate is authoritative for viewer-facing acceptance.

A beautiful line that invents reality is rejected.

A technically grounded line that fails to execute its beat may also be rejected.

Truth is a hard floor, never a tradeable score.

## Beat Graph Validity

Planner output is untrusted until normalized.

Invalid planner metadata must not be silently converted into unrelated semantics.

Canonical attention functions:

```text
hook
question
turn
escalation
reframe
callback
payoff
release
```

Canonical creative moves:

```text
contrast
status_inversion
understatement
double_meaning
personification
callback
recontextualization
implication
none
```

Compatibility aliases are permitted only when they map unambiguously to a canonical meaning. Analyst labels such as `build curiosity`, `increase tension`, `reveal the joke`, or `conclude the scene` must never leak into the graph as viewer semantics.

## Momentum Law

Every beat must create a reason for the next beat.

`nextBeatPullTarget` is a planner signal, not evidence of attention by itself.

A high target does not rescue a beat with no unresolved relationship, object, status change, consequence, callback, or meaning shift.

A question mark alone is not momentum.

## Truth Law

```text
FACT       → available as concrete reality
INFERENCE  → allowed only as grounded interpretation
UNKNOWN    → remains unknown
```

Never infer:

- new people
- new objects
- new locations
- new physical actions
- new reactions
- new dialogue
- new wardrobe placement
- new chronology
- new outcomes
- identity-based character claims unsupported by the source

A creative lens changes framing. It does not create the event implied by the lens.

## Repair Law

Repair exists to fix an already-selected beat, not to invent a new movie.

A repair must preserve:

```text
beat order
source truth
attention function
creative move
setup/payoff intent
```

Repair should target failed lines rather than casually regenerating the entire sequence from scratch.

A failed line must never be replaced by empty output and then allowed to disappear silently.

## Completeness Law

A successful author run means:

```text
beat count == realized line count == accepted scene count
```

Partial sequences are not successful author output.

However, when completeness fails, diagnostics must preserve the actual failed lines, exact rejection reasons, and repair attempts so the failure is actionable rather than opaque.

## Zero-Scene Failure Law

`finalScenes: 0` is not a creative result. It is an author-path failure.

When zero scenes occurs, inspect in this order:

```text
1. Beat Graph validity
2. Mouth output count
3. Attention Editor diagnostics
4. Final Cut rejection reasons
5. Repair output count
6. Repair acceptance delta
```

The system must make it obvious which stage caused the failure.

## What Counts as a Strong Line

A strong line is usually:

```text
specific
compressed
character-specific
surprising
imageable
interpretive rather than explanatory
connected to the chosen movie
```

A line is weak when it merely paraphrases:

```text
Coco got a bath.
Coco stole a bow.
Coco left fabulous.
```

Those are facts. The Mouth's value is in changing the meaning of those facts without changing what actually happened.

## What We Are Explicitly Not Building

Do not solve weak output by adding:

```text
another domain writer
another fixed story template
another permanent emotional arc
another scoring layer that never affects output
another pile of phrase bans
another hidden creative brain
```

The universal author should become better at **choosing and executing**, not merely better at producing more metadata.

## Engineering Loop

```text
ONE FAILURE SIGNATURE
      ↓
TRACE THE WHOLE PATH
      ↓
IDENTIFY THE BROKEN CONTRACT
      ↓
SURGICAL CHANGE
      ↓
TYPECHECK
      ↓
ACCEPTANCE RUN
      ↓
COMPARE FINAL VIEWER OUTPUT
      ↓
KEEP / REVERT
      ↓
RECORD THE LEARNING
```

Do not patch one symptom while leaving an upstream contract mismatch intact.

## Required Acceptance Families

The author must eventually be exercised against:

```text
COCO          character/personality contrast
COCO-RETURN   recurring memory / changed meaning
MARIA         ordinary service / efficiency
HORROR        dark reframing
ROMANCE       intimate recurring detail
SPARSE        little source material
CHAOTIC       high creative risk, still reality-locked
```

A change passes only when the intended dimension improves without materially regressing truth, momentum, differentiation, or sentence quality.

## Definition of Success

```text
ordinary reality
      ↓
QRE notices something specific
      ↓
QRE chooses a strong movie
      ↓
QRE knows what should change next
      ↓
QRE creates a short Beat Graph
      ↓
Mouth turns meaning into memorable lines
      ↓
critic cuts weakness
      ↓
truth gate protects reality
      ↓
repair fixes only what failed
      ↓
complete cinematic sequence reaches the player
```

**The goal is not more architecture. The goal is a decisive author with no gaps in the pipeline.**
