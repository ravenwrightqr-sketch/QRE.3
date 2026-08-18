# QRE AUTHOR · CURRENT STATE

**Status:** CANONICAL CURRENT-STATE REFERENCE
**Branch:** `author/enterprise-mouth-rewire`
**Purpose:** Single fast reference for the live Universal Author architecture. Read this before changing author, mouth, attention, beat planning, recovery, cut policy, or local-model transport.

## 1. NON-NEGOTIABLE MOTTO

> **NO GAPS IN THE PIPELINE.**

A component is not considered complete because it compiles. Its output must be consumed correctly by the next canonical layer, validated there, and remain semantically aligned all the way to final viewer-facing scenes.

## 2. CURRENT AUTHOR PIPELINE

```text
SOURCE TRUTH
   ↓
REALITY GRAPH
   ↓
COGNITION / CHARACTER READ
   ↓
LATENT MOVIE SEARCH / DIFFERENTIATION
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
CUT POLICY / TRUTH GATE
   ↓
BOUNDED REPAIR WHEN NEEDED
   ↓
FINAL EXPERIENCE SCENES
   ↓
CINEMATIC RUNTIME / PLAYER
```

There is one semantic authority for each stage. Adapters may project data; they must not become competing author brains.

## 3. CANONICAL OWNERS

| Concern | Owner |
|---|---|
| Source truth / reality graph | `apps/api/src/services/authorRealityGraph.ts` |
| Cognition / character read | `apps/api/src/services/authorCognition.ts` |
| Latent movie search | `apps/api/src/services/authorLatentMovieSearch.ts` |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` |
| Master author | `apps/api/src/services/authorBrainUniversal.ts` |
| Beat recovery | `apps/api/src/services/authorBeatPlanRecovery.ts` |
| Latent beat adaptation | `apps/api/src/services/authorLatentMovieBeatAdapter.ts` |
| Mouth realization | canonical mouth path through `localModelRuntime.ts` + author mouth craft layer |
| Attention/editor scoring | `apps/api/src/services/authorAttentionEditor.ts` |
| Truth / cut acceptance | `apps/api/src/services/authorBeatTruthGate.ts` + `apps/api/src/services/authorCutPolicy.ts` |
| Model transport | `apps/api/src/services/localModelRuntime.ts` |
| Acceptance harness | `apps/api/author-acceptance-monster.ts` and the broader author acceptance suite |

## 4. BEAT GRAPH IS THE INTERNAL CONTRACT

A beat is one perceivable change in the viewer's mental model.

Canonical internal metadata:

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

Viewer-facing text is **not** the Beat Graph. Beat metadata is private authoring state.

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

Unknown planner labels must be normalized deliberately or rejected. They must not silently become arbitrary defaults that falsify the graph.

## 5. ATTENTION ARC

`attentionArc` is internal sequence structure, not viewer prose.

The planner should discover an arc such as:

```text
hook → reframe → escalation → payoff
```

or another evidence-supported progression.

The important invariant is not the literal template. It is that the sequence has differentiated jobs and that later beats transform, escalate, resolve, or recontextualize earlier material.

## 6. TRUTH RULE

Reality is immutable.

Allowed:

```text
fact → factual line
fact + supported relationship → interpretation
supplied contradiction → character framing
supplied object → changed meaning
```

Not allowed in reality-locked mode:

```text
new person
new object
new location
new date/time
new concrete action
new dialogue
new reaction
new outcome
new physical detail presented as fact
```

A creative lens may change framing. It does not create reality.

## 7. MOUTH RULE

The mouth receives an approved sequence plus the source world required to realize it.

The mouth's job is not to summarize the planner. It should compress the selected meaning into a short, specific, character-aware line.

Target behavior:

```text
source evidence
   +
chosen movie / beat job
   +
character relationship
   ↓
small interpretive move
   ↓
short viewer line
```

Strong lines are usually specific, compressed, surprising, imageable, character-specific, and non-explanatory.

## 8. ATTENTION EDITOR RULE

The Attention Editor is an editor, not another author.

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
```

`nextBeatPull` must reflect a real carried-forward relationship, object, status change, unresolved consequence, or meaning change. A question mark alone is not momentum.

## 9. CUT POLICY / TRUTH GATE

The final semantic gate remains authoritative for viewer-facing acceptance.

The Attention Editor cannot override truth.

A line that scores well for attention but fails grounding is rejected or repaired.

The final author result must not silently report a partial sequence as a successful full movie.

## 10. RECOVERY RULE

Beat recovery is a fallback for model formatting/serialization failure, not a second creative system.

Recovery may project an already-selected latent movie candidate into the same canonical Beat Graph shape.

Recovery may not invent a replacement story.

Recovered beats must pass the same normalization and validation boundary as normal model beats.

## 11. LOCAL MODEL TRANSPORT RULE

`localModelRuntime.ts` is the model transport boundary.

Its job is to:

```text
prepare request
→ call local Ollama model
→ parse response
→ return model output
```

It must not become an independent permanent creative brain that silently competes with `authorBrainUniversal.ts`.

## 12. WHAT GOOD LOOKS LIKE

For a service receipt such as Coco:

```text
arrival
→ attitude / contradiction
→ concrete service moment
→ object/status turn
→ payoff / exit
```

The exact wording must emerge from evidence. We do not hard-code jokes or domain scripts.

A successful result has:

```text
same beat count as realized scenes
zero truth violations
zero planning language
minimal repetition
real setup/payoff relationships
strong next-beat pull
specific mouth lines
earned ending
```

## 13. DEVELOPMENT LAW

Do not add architecture merely because a failure occurred.

For each change ask:

```text
What semantic gap exists?
Which canonical owner should close it?
What evidence proves the gap is closed?
What acceptance run demonstrates the improvement?
```

Do not create another `author*` component that duplicates an existing semantic authority.

## 14. VALIDATION COMMANDS

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm exec tsc -p apps/api/tsconfig.tests.json --noEmit
pnpm --filter @qre/api build
```

Primary Monster run:

```powershell
pnpm exec tsx apps/api/author-acceptance-monster.ts "Dog grooming service receipt | Coco, poodle, nervous, fierce, cool | came in nervous, got a bath, stole a blue bow, left looking fabulous"
```

## 15. CURRENT WORKING PRINCIPLE

We are no longer optimizing isolated functions.

We are optimizing the **entire transformation**:

```text
reality
→ interesting interpretation
→ differentiated movie
→ deliberate beat graph
→ strong momentum
→ excellent mouth
→ truth-safe final scene
```

A beautiful intermediate artifact that never survives to the final player does not count.




2026-08-17

LATENT MOVIE IS PRIMARY SEMANTIC AUTHORITY

RealityGraph
→ selected latent movie
→ BeatPlan
→ viewer momentum
→ mouth
→ attention editor
→ sequence arc
→ cut policy

The model is bounded fallback, not the primary movie selector.

The supplied endpoint is preserved.
Forward/backward convergence is deterministic.
Fixed 4/5 beat acceptance is removed.