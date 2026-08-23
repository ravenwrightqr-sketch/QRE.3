# QRE AUTHOR · CURRENT STATE

**Status:** CANONICAL CURRENT-STATE REFERENCE  
**Branch:** `main`  
**Updated:** 2026-08-22  
**Purpose:** Single fast reference for the live Universal Author architecture. Read this before changing author, mouth, attention, beat planning, recovery, cut policy, local-model transport, or the runtime boundary.

## 1. NON-NEGOTIABLE MOTTO

> **NO GAPS IN THE PIPELINE.**

A component is not complete because it compiles. Its output must be consumed correctly by the next canonical layer, validated there, and remain semantically aligned all the way to final viewer-facing scenes.

## 2. PRODUCT QUALITY LAW · THE MOVIE MUST ACCUMULATE

QRE does not exist to turn a list of facts into prettier list items.

A source fact is **material**, not the destination.

> **“Coco got a bath” is never the destination. It is material. The system should make you wonder what that bath reveals, what the blue bow changes, and why the final image suddenly feels inevitable.**

The desired transformation is:

```text
fact
  ↓
meaning
  ↓
consequence
  ↓
recontextualization
  ↓
payoff
```

The experience should accumulate rather than reset on every cut. A later beat inherits something from an earlier beat and changes its meaning, pressure, status, or consequence.

Canonical example of the desired movie logic:

```text
nerves came in first
→ then the attitude showed up
→ the blue bow sealed it
→ fabulous became apparent
```

This is a **sequence law**, not a Coco-specific script. Never hard-code those lines or that joke. The engine must discover the equivalent structure from whatever reality the user supplies.

### What the user should feel

The ideal result should make the viewer want to see the next cut because the current cut changed the meaning of what came before. Even a tiny service receipt, memory, visit, or event should feel like something is unfolding.

The product test is not merely “is this grammatical?” or “is every fact present?” It is:

```text
Would I want to watch the next cut?
Does this line change the movie?
Does the ending feel earned by what came before?
```

## 3. CURRENT AUTHOR PIPELINE

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

## 4. CANONICAL OWNERS

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
| Acceptance harness | current author acceptance suite / monster acceptance path |

## 5. BEAT GRAPH IS THE INTERNAL CONTRACT

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

## 6. ATTENTION ARC AND SEQUENCE COHESION

`attentionArc` is internal sequence structure, not viewer prose.

The literal template is not sacred. The semantic progression is.

A strong sequence differentiates jobs and carries material forward. Examples include:

```text
hook → reframe → escalation → payoff
hook → turn → consequence → callback → payoff
arrival → pressure → recontextualization → release
```

Later beats must inherit something from earlier beats and alter it. A sequence of independent summaries is a failure even when every line is individually factual.

### Non-negotiable sequence law

```text
Beat N
  establishes / changes something
      ↓
Beat N+1
  inherits it
      ↓
Beat N+1
  changes its meaning / pressure / status / consequence
```

The object, contradiction, emotion, status, sensory detail, or other supplied signal can be the carrier. The carrier must move.

## 7. TRUTH RULE

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

## 8. MOUTH RULE

The mouth receives an approved sequence plus the source world required to realize it.

The mouth's job is not to summarize the planner. It should compress the selected meaning into a short, specific, character-aware line.

A Beat Graph field such as `change: "Coco got a bath"` is **not** finished mouth copy. It is material for realization.

The mouth must answer, internally:

```text
What does this moment mean here?
What changed because of the previous cut?
What supplied detail now carries more meaning?
What does this line make desirable next?
```

Target behavior:

```text
source evidence
   +
chosen movie / beat job
   +
character relationship
   +
previously established carry-forward signal
   ↓
small interpretive move
   ↓
short viewer line
```

Strong lines are usually specific, compressed, surprising, imageable, character-specific, natural-sounding, and non-explanatory.

Avoid:

```text
source-fact paraphrase
keyword collage
trailer slogan fragments
planning labels
generic cinematic filler
unsupported body reactions
new concrete events
```

## 9. ATTENTION EDITOR RULE

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
interpretation grounding
sequence cohesion
beat restatement
beat execution
```

`nextBeatPull` must reflect a real carried-forward relationship, object, status change, unresolved consequence, or meaning change. A question mark alone is not momentum.

A line that shares source words but merely repeats the approved beat should not receive full credit.

## 10. CUT POLICY / TRUTH GATE

The final semantic gate remains authoritative for viewer-facing acceptance.

The Attention Editor cannot override truth.

A line that scores well for attention but fails grounding is rejected or repaired.

The final author result must not silently report a partial sequence as a successful full movie.

## 11. RECOVERY RULE

Beat recovery is a fallback for model formatting/serialization failure, not a second creative system.

Recovery may project an already-selected latent movie candidate into the same canonical Beat Graph shape.

Recovery may not invent a replacement story.

Recovered beats must pass the same normalization and validation boundary as normal model beats.

## 12. LOCAL MODEL TRANSPORT RULE

`localModelRuntime.ts` is the model transport boundary.

Its job is to:

```text
prepare request
→ call local Ollama model
→ parse response
→ return model output
```

It must not become an independent permanent creative brain that silently competes with `authorBrainUniversal.ts`.

## 13. USER-PROMPT EXAMPLE · THE EXPECTED TRANSFORMATION

User reality:

```text
Dog grooming service receipt
Coco, poodle, nervous, fierce, cool
came in nervous, got a bath, stole a blue bow, left looking fabulous
```

Bad destination-thinking:

```text
Nervous poodle takes a bath.
Got a bath, still fierce.
Stole a bow, cool now.
Left looking fabulous.
```

Why it fails: those are mostly receipt entries compressed into sentences. They do not create an accumulating movie.

Desired authoring logic:

```text
nerves came in first
→ the attitude starts to emerge
→ the blue bow becomes the concrete proof / turn
→ fabulous becomes the earned final image
```

The exact mouth lines must be discovered. The engine must **not** hard-code this wording, joke, or sequence for Coco.

The governing question is:

> **So “Coco got a bath” is never the destination. It is material. The system should make you wonder what that bath reveals, what the blue bow changes, and why the final image suddenly feels inevitable.**

## 14. WHAT GOOD LOOKS LIKE

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
sequence continuity
earned ending
```

The product-level success test is:

```text
Would I want to watch the next cut?
Does this line make the previous cut matter more?
Does the sequence feel like one movie rather than five captions?
Does the final image feel inevitable in hindsight?
```

## 15. DEVELOPMENT LAW

Do not add architecture merely because a failure occurred.

For each change ask:

```text
What semantic gap exists?
Which canonical owner should close it?
What evidence proves the gap is closed?
What acceptance run demonstrates the improvement?
```

Do not create another `author*` component that duplicates an existing semantic authority.

When a test fails, diagnose the first broken semantic boundary rather than compensating downstream.

## 16. VALIDATION COMMANDS

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build
git diff --check
```

Use the current author acceptance suite / monster acceptance path for creative validation. Do not treat old benchmark filenames as canonical architecture.

## 17. RUNTIME / ANALYTICS BOUNDARY

Authoring ends at approved experience scenes. Runtime is a separate semantic plane.

```text
AUTHOR
source truth
  ↓
RealityGraph
  ↓
cognition
  ↓
movie search / differentiation
  ↓
Master Author
  ↓
mouth
  ↓
experience moments / cinematic scenes

RUNTIME
experience scenes
  ↓
scan / access / moments / flow / geo / cinematic / delivery / session
  ↓
Engine Event Spine
  ↓
analytics adapter / registry / repository persistence
```

Runtime decomposition is documented in:

`docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md`

Internal runtime seams currently established:

```text
buildRuntimeMoments()
selectCinematicScenes()
buildRuntimeGeoStory()
buildRuntimeMemorySnapshot()
```

These are runtime boundaries, not cognition modules and not additional author brains.

## 18. CURRENT WORKING PRINCIPLE

We are no longer optimizing isolated functions.

We are optimizing the **entire transformation**:

```text
reality
→ interesting interpretation
→ differentiated movie
→ deliberate beat graph
→ accumulating momentum
→ excellent mouth
→ truth-safe final scene
→ runtime delivery
→ observable analytics / learning input
```

A beautiful intermediate artifact that never survives to the final player does not count.

**The goal is not better prose. The goal is a movie you want to keep watching.**
