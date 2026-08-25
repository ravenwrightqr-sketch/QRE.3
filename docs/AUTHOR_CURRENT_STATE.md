# QRE AUTHOR · CURRENT STATE

**Status:** CANONICAL CURRENT-STATE REFERENCE  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24  
**Purpose:** Single fast reference for the live Universal Author architecture. Read this before changing author, mouth, attention, beat planning, recovery, cut policy, local-model transport, memory, learning, readouts, or the runtime boundary.

## 1. NON-NEGOTIABLE MOTTO

> **NO GAPS IN THE PIPELINE.**

A component is not complete because it compiles. Its output must be consumed correctly by the next canonical layer, validated there, and remain semantically aligned all the way to final viewer-facing scenes and the next learning cycle.

## 2. PRODUCT QUALITY LAW · THE MOVIE MUST ACCUMULATE

QRE does not exist to turn a list of facts into prettier list items.

A source fact is material, not the destination.

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

## 3. CURRENT AUTHOR PIPELINE

```text
SOURCE TRUTH
   ↓
REALITY GRAPH
   ↓
COGNITION / CHARACTER READ
   ↓
MEMORY + EXPERIENCE STATE
   ↓
LEARNED BEHAVIOR PROFILE
   ↓
LATENT MOVIE SEARCH / DIFFERENTIATION
   ↓
BEAT DISCOVERY / TEMPO
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
FINAL EXPERIENCE SCENES
   ↓
AUTHOR READOUT
   ↓
CINEMATIC RUNTIME / PLAYER
   ↓
ANALYTICS OBSERVATION
   ↓
GOVERNED LEARNING
   ↺
```

There is one semantic authority for each stage. The Author readout observes this path; it does not add another decision layer.

## 4. CANONICAL OWNERS

| Concern | Owner |
|---|---|
| Source truth / reality graph | `apps/api/src/services/authorRealityGraph.ts` |
| Cognition / character read | `apps/api/src/services/authorCognition.ts` |
| Latent movie search | `apps/api/src/services/authorUniversalMovieSearch.ts` |
| Movie differentiation | `apps/api/src/services/authorMovieDifferentiation.ts` |
| Master author | `apps/api/src/services/authorBrainUniversal.ts` |
| Experience state | `apps/api/src/services/authorExperienceState.ts` |
| Experience memory bridge | `apps/api/src/services/authorExperienceMemory.ts` |
| Learned behavior profile | `apps/api/src/services/authorBehaviorProfile.ts` |
| Beat recovery | `apps/api/src/services/authorBeatPlanRecovery.ts` |
| Latent beat adaptation | `apps/api/src/services/authorLatentMovieBeatAdapter.ts` |
| Mouth realization | canonical mouth path through `localModelRuntime.ts` + author mouth craft layer |
| Attention/editor scoring | `apps/api/src/services/authorAttentionEditor.ts` |
| Truth / cut acceptance | `apps/api/src/services/authorBeatTruthGate.ts` + `apps/api/src/services/authorCutPolicy.ts` |
| Author diagnostic readout | `apps/api/src/services/authorReadout.ts` |
| Acceptance | current Author acceptance / monster acceptance surfaces |

## 5. EXPERIENCE STATE IS NOW LIVE

The current state compiler records:

```text
established events
changed events
carrier events
active / resolved tensions
setup
callbacks
revisits
unresolved questions
carry threads
future threads
consumed futures
retired futures
semantic turn keys
relation kinds
continuation
lookahead
endpoint pressure
attention potential
tempo
selected lens / movie
payoff evidence
memory hooks
```

Future threads have explicit lifecycle behavior instead of living forever:

```text
opened
→ active
→ consumed / reached
→ retired
→ historical evidence
```

## 6. BEHAVIORAL LEARNING IS BOUNDED

The learned profile currently exposes:

```text
confidence
compressionPreference
explanationAversion
callbackAffinity
surprisePreference
accelerationPreference
revisitAffinity
learnedSignals
```

It is preference-only. It does not modify RealityGraph truth, provenance, or concrete facts.

The next required production step is making confidence, evidence count, and revision/decay explicit enough that repeated learning cannot become an unbounded personality label.

## 7. LATENT MOVIE SEARCH IS PRODUCTION-GROUNDED

The movie is searched deterministically over immutable RealityGraph evidence.

A candidate carries:

```text
trajectory
relation kinds
evidence
payoff
truth risk
specificity
information value
uncertainty
attention potential
consequence potential
callback potential
compression potential
repetition risk
score
distinctiveness
```

Evidence reuse is allowed. Same-evidence candidates count as different movies only when the semantic path actually differs.

## 8. TEMPO IS STATEFUL

Current tempo states include:

```text
hook
hold
revisit
tighten
accelerate
release
```

Tempo is derived from the current semantic trajectory and state variables including tension, continuation, lookahead, endpoint pressure, and revisit behavior. The next step is to make learned behavior preference explicitly bias tempo within evidence-supported bounds and prove the decision changes across rounds.

## 9. AUTHOR READOUT · NOW IMPLEMENTED

Production diagnostic boundary:

`apps/api/src/services/authorReadout.ts`

Acceptance:

`apps/api/author-readout-acceptance.ts`

The readout is an observer envelope containing:

```text
identity / round
source truth summary
learned behavior profile
competing movie candidates
selected movie
experience state / tempo
Mouth output
final scenes
explicit gates
truth / preference / ordering invariants
```

It distinguishes the four layers that must never be confused:

```text
SOURCE TRUTH
DERIVED INTERPRETATION
LEARNED PREFERENCE
MODEL REALIZATION
```

The readout can expose internal diagnostic metadata to developers/operators. Viewer-facing text must remain free of planner language and internal reasoning labels.

## 10. MOUTH RULE

The Mouth receives an already-selected sequence. Its job is realization, not story invention.

```text
source evidence
+
chosen movie / beat job
+
character relationship
+
carry-forward meaning
+
learned preference context
↓
short specific viewer-facing realization
```

The next production benchmark must prove learned profile changes realization style without changing approved beat semantics or truth constraints.

## 11. ATTENTION / CUT / TRUTH BOUNDARIES

The Attention Editor is an editor, not another author.

The Cut Policy and Truth Gate remain authoritative for viewer-facing acceptance.

A line that scores well for attention but fails grounding is rejected or repaired.

## 12. ACCEPTANCE SURFACE

Current Author-specific acceptance surfaces:

```text
apps/api/author-experience-state-acceptance.ts
apps/api/author-learning-closed-loop-acceptance.ts
apps/api/author-behavior-profile-acceptance.ts
apps/api/author-universal-movie-search-acceptance.ts
apps/api/author-readout-acceptance.ts
apps/api/author-acceptance-suite.ts
```

Minimum local validation sequence:

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/api build

git diff --check

pnpm exec tsx apps/api/author-experience-state-acceptance.ts
pnpm exec tsx apps/api/author-learning-closed-loop-acceptance.ts
pnpm exec tsx apps/api/author-behavior-profile-acceptance.ts
pnpm exec tsx apps/api/author-universal-movie-search-acceptance.ts
pnpm exec tsx apps/api/author-readout-acceptance.ts
```

## 13. RUNTIME / ANALYTICS / LEARNING BOUNDARY

Authoring ends at approved experience scenes. Runtime is separate.

```text
AUTHOR
source truth
→ reality
→ cognition
→ movie search
→ state / tempo
→ Master Author
→ mouth
→ gates
→ scenes

RUNTIME
scenes
→ scan / access / flow / geo / cinematic / delivery / session
→ Engine Event Spine
→ analytics adapter / registry / repository

LEARNING
analytics observations
→ governed learning signals
→ behavior profile / state
→ future Author decisions
```

No layer becomes another layer by convenience.

## 14. CURRENT PRODUCTION GAP

The hardest remaining proof is no longer “does the system remember?” It is:

```text
Round 1
→ Author makes decision A
→ user behavior creates evidence

Round 2
→ same reality or related reality
→ memory + learned profile are recovered
→ Author deliberately makes decision B
→ B is different for a measured reason
→ truth is unchanged
→ continuity is improved

Round 3+
→ adaptation remains stable, bounded, and reversible
```

That is the path to the golden universal Author.

## 15. DEVELOPMENT LAW

Do not add architecture merely because a failure occurred.

For each change ask:

```text
What semantic gap exists?
Which canonical owner should close it?
What evidence proves the gap is closed?
What acceptance run demonstrates the improvement?
```

A beautiful intermediate artifact that never survives to the final player does not count.

**The goal is not better prose. The goal is a movie you want to keep watching—and a system that learns why you kept watching.**
