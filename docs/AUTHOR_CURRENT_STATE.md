# QRE AUTHOR · CURRENT STATE

**STATUS:** CANONICAL CURRENT-STATE REFERENCE
**AUDIT SNAPSHOT:** `audit/mouth-production-sync`

Read this before changing Author, Mouth, contracts, attention, cut policy, sequence arc, or model transport.

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
REALIZATION STRATEGY
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
SEQUENCE ARC
   ↓
FINAL SCENES
   ↓
CINEMATIC RUNTIME
```

There is one semantic authority per stage. A helper can support a stage without becoming another author.

## 2. CANONICAL FILES

```text
Reality:          authorRealityGraph.ts
Cognition:        authorCognition.ts
Movie Search:     authorLatentMovieSearch.ts
Movie Diff:       authorMovieDifferentiation.ts
Master Author:    authorBrainUniversal.ts
Meaning:          authorMeaningSpine.ts
Slots:            authorMouthRealizationSlot.ts
Strategy:         authorRealizationStrategyLattice.ts (promotion target)
Mouth Search:     authorMouthCandidateSearch.ts
Language Gate:    authorMouthLanguageGate.ts
Attention Gate:   authorMouthAttentionGate.ts
Quality Adapter:  authorMouthQualityAdapter.ts
Mouth Beam:       authorMouthSequenceBeamSearch.ts
Attention:        authorAttentionEditor.ts
Truth Gate:       authorBeatTruthGate.ts
Cut Policy:       authorCutPolicy.ts
Sequence Arc:     authorSequenceArcGate.ts
Runtime:          localModelRuntime.ts
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

`RealizationSlot` is the canonical boundary between semantic meaning and language realization. It owns the approved source/target evidence, semantic kind, endpoint, obligations, and forbidden moves handed to the Mouth.

## 7. REALIZATION STRATEGY LAW

Approach B is a controlled realization-strategy search, not a second author.

The intended path is:

```text
Meaning Spine
→ Realization Slot
→ safe realization strategies
→ language realization
→ gates
→ Beam
```

`authorRealizationStrategyLattice.ts` already implements the safe strategy selection capability. It is currently a promotion target; the canonical Master Author still owns a direct candidate-generation loop and must be consolidated before the strategy lattice becomes production authority.

## 8. MOUTH LAW

The Mouth receives an approved realization job plus source evidence and proposes language.

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

The model supplies wording only. QRE owns truth, semantic legality, candidate selection, endpoint integrity, and final gating.

## 9. TRUTH + ATTENTION

Attention is never allowed to override grounding.

The final line is exact when the approved endpoint requires exactness.

Fallback exists only as a safety rail when model coverage is incomplete.

A passing fallback sequence is not equivalent to exceptional Mouth quality.

## 10. COMPLETENESS

Successful author output means:

```text
beat count == candidate coverage == realized line count == accepted scene count
```

Zero scenes or silent partial sequences are author-path failures.

## 11. ENTERPRISE PATH STATUS

`authorEnterpriseMouth.ts` provides an acceptance-oriented alternate orchestration over canonical Mouth primitives. It is **not** consumed by the canonical Master Author.

Its capabilities—strategy selection, cumulative meaning, grounded surprise, safety, bounded model budgets, and cross-domain fixtures—are migration candidates only. Duplicate orchestration must not become a second production brain.

## 12. CONTRACT LAW

All shared semantic types belong in `@qre/contracts`.

The canonical Author semantic contract namespace is:

```text
packages/contracts/src/cogauthor/
```

`packages/contracts/src/authoringIntelligence.ts` currently owns broader shared authoring-intelligence strategy/lens/safety/model-tier contracts. Consumer analysis must prove any future relocation; do not duplicate them.

No new contract is created to paper over an implementation mismatch.

## 13. DEVELOPMENT LOOP

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

## 14. QUALITY STANDARD

These are different levels:

```text
VALID    = structurally/semantically acceptable
GOOD     = grounded + coherent + moving
EXCELLENT = grounded + specific + surprising + cumulative + attention-pulling
```

The production bar is **excellent across unfamiliar prompts and industries**, not merely green tests.
