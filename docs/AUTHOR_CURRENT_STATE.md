# QRE AUTHOR · CURRENT STATE

**STATUS:** CANONICAL TECHNICAL CURRENT-STATE REFERENCE
**BRANCH:** `author/enterprise-realization-engine`
**AUTHORITY:** This file is the focused technical reference for the current Author/Mouth production path. Product-wide vision, asset semantics, universal experience scope, and future shared-world rules live in the canonical project constitution and architecture index.

Canonical companion documents:

```text
docs/QRE_CORE_MASTER_CONSTITUTION.md
  → product-wide purpose, universal experience model, physical QRE product model

docs/AUTHOR_ARCHITECTURE_INDEX.md
  → canonical semantic owners, contracts, file status, and live keep/legacy/delete map

docs/ADAPTIVE_EXPERIENCE_ENGINE.md
  → longitudinal learning, inquiry, adaptation, re-engagement, multi-world behavior

docs/ASSET_IDENTITY_AND_LEARNING_SCOPE.md
  → asset, account, user, organization, identity/world, and learning boundaries
```

Read this before changing Author, Mouth, contracts, attention, cut policy, or model transport.

## 1. CURRENT PRODUCTION PATH

```text
SUPPLIED REALITY
   ↓
REALITY GRAPH
   ↓
COGNITION / CHARACTER READ
   ↓
LATENT MOVIE SEARCH
   ↓
MOVIE DIFFERENTIATION
   ↓
MASTER AUTHOR / BEAT DISCOVERY
   ↓
MEANING SPINE
   ↓
REALIZATION SLOTS
   ↓
MOUTH CANDIDATES
   ↓
LANGUAGE / REALITY GATES
   ↓
SEQUENCE BEAM
   ↓
ATTENTION EDITOR
   ↓
TRUTH / CUT POLICY
   ↓
FINAL SCENES
   ↓
CINEMATIC RUNTIME
```

There is one semantic authority per stage. A helper can support a stage without becoming another author.

## 2. CANONICAL FILES

```text
Reality:        authorRealityGraph.ts
Cognition:      authorCognition.ts
Movie Search:   authorLatentMovieSearch.ts
Movie Diff:     authorMovieDifferentiation.ts
Master Author:  authorBrainUniversal.ts
Meaning:        authorMeaningSpine.ts
Slots:          authorMouthRealizationSlot.ts
Mouth Search:   authorMouthCandidateSearch.ts
Mouth Beam:     authorMouthSequenceBeamSearch.ts
Mouth Gate:     authorMouthLanguageGate.ts
Attention:      authorAttentionEditor.ts
Truth Gate:     authorBeatTruthGate.ts
Cut Policy:     authorCutPolicy.ts
Runtime:        localModelRuntime.ts
```

## 3. REALITY LAW

Reality is immutable.

A creative interpretation may change framing, status, implication, metaphor, or recontextualization. It may not promote an unsupported event, person, object, location, dialogue, sound, physical reaction, chronology, or outcome into fact.

## 4. COGNITION LAW

Cognition discovers:

```text
relationships
contradictions
character posture
recurring signals
candidate lenses
latent movie hypotheses
```

Cognition does not write viewer-facing prose.

## 5. MOVIE LAW

A latent movie is a hypothesis over immutable RealityGraph evidence.

Movie competition must reward materially different interpretations, not stylistic paraphrases.

Trajectory search exists as a reusable capability, but it is **not yet canonical production wiring** until its endpoint behavior and downstream consumer are verified in `authorBrainUniversal.ts`.

## 6. BEAT / MEANING LAW

A beat is a meaningful change in viewer interpretation.

The canonical internal state carries the beat job, change, next movement, setup/payoff, creative move, attention function, and source/event provenance where available.

Internal planner metadata is never viewer prose.

## 7. MOUTH LAW

The Mouth receives approved meaning plus source evidence and proposes language.

It does not re-plan.

Strong lines are:

```text
specific
compressed
character-aware
surprising
imageable
interpretive rather than explanatory
```

The target behavior is **moving-message cinema**: each line creates a state change and makes the next line desirable.

## 8. TRUTH + ATTENTION

Attention is never allowed to override grounding.

The final line is exact when the approved endpoint requires exactness.

Fallback exists only as a safety rail when model coverage is incomplete.

A passing fallback sequence is not equivalent to exceptional Mouth quality.

## 9. COMPLETENESS

Successful author output means:

```text
beat count == realized line count == accepted scene count
```

Zero scenes or silent partial sequences are author-path failures.

## 10. ENTERPRISE PATH STATUS

`authorEnterpriseMouth.ts` currently provides an acceptance-oriented alternate orchestration over the Mouth primitives. It is **not** consumed by the canonical Master Author.

Its useful capabilities—strategy selection, cumulative meaning, grounded surprise, safety, bounded model budgets—must be evaluated for migration into canonical owners. Its duplicate orchestration must not remain a second production brain.

## 11. CONTRACT LAW

All shared semantic types belong in `@qre/contracts`.

A service-local type is acceptable only when it is genuinely private to that implementation. Any concept consumed by multiple Author services must have one canonical contract.

No new contract is created to paper over an implementation mismatch.

## 12. DEVELOPMENT LOOP

```text
FAILURE SIGNATURE
→ TRACE WHOLE PATH
→ FIND BROKEN CONTRACT / OWNER
→ ONE SURGICAL CHANGE
→ TYPECHECK
→ ACCEPTANCE
→ READ FINAL VIEWER OUTPUT
→ KEEP / REVERT
→ LOG
```

Do not patch the last symptom while leaving an upstream contract mismatch intact.

## 13. QUALITY STANDARD

These are different levels:

```text
VALID    = structurally/semantically acceptable
GOOD     = grounded + coherent + moving
EXCELLENT = grounded + specific + surprising + cumulative + attention-pulling
```

The production bar is **excellent across unfamiliar prompts and industries**, not merely green tests.
