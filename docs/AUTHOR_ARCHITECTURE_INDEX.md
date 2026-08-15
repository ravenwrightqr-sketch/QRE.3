# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** ACTIVE  
**Branch:** `elite-universal-rebuild-v10`  
**Rule:** Read this and `docs/QRE_FULL_REPO_INFLUENCE_MAP.md` before changing author/cognition/compiler behavior.

## 1. NORTH STAR

QRE is a universal experience compiler.

```text
UNDERSTAND WORLD
→ PRESERVE TRUTH
→ UNDERSTAND HISTORY
→ FIND SIGNIFICANCE
→ CREATIVE SEARCH
→ CHOOSE THE MOVIE
→ MOVE THE VIEWER'S MENTAL MODEL
→ AUTHOR THE CUTS
→ LEARN
```

The author is a system, not a file.

## 2. CANONICAL SEMANTIC LAYERS

```text
SOURCE / PROMPT / MEDIA / RUNTIME
        ↓
REALITY + PROVENANCE
        ↓
WORLD / ENTITY / RELATIONSHIP MODEL
        ↓
MEMORY + PRESENCE + ANALYTICS
        ↓
SIGNIFICANCE
        ↓
CREATIVE OPERATIONS / CANDIDATE SEARCH
        ↓
VIEWER MOMENTUM / SEQUENCE PLAY
        ↓
UNIVERSAL AUTHOR
        ↓
CANONICAL CUT POLICY
        ↓
MOUTH / EXPERIENCE MOMENTS
        ↓
CINEMATIC RUNTIME
```

| Layer | Canonical role | Status |
|---|---|---|
| SubjectTruth | Explicit identity truth | KEEP |
| AuthorBrainTruth | Author input boundary | KEEP |
| Source Ledger / World Model | Reality + provenance | KEEP / EVOLVE |
| Significance | Why details matter | KEEP / EVOLVE |
| Creative Operations | Non-prose creative search | KEEP / EVOLVE |
| ViewerMomentum | Compact viewer cognitive state | KEEP |
| SequencePlay | Viewer-state trajectory | KEEP / EVOLVE |
| Universal Author | Final sequence intelligence | KEEP / CONVERGE |
| AuthorCutPolicy | Canonical semantic mouth gate | KEEP / UNIFY |
| Living Memory | Cross-chapter continuity | KEEP |

## 3. REALITY IS NOT SEQUENCE

Reality answers:

```text
What exists?
What happened?
Who is involved?
What is explicitly known?
What happened before?
```

Sequence answers:

```text
What does the viewer already know?
What do they expect?
What question is alive?
What changed their mental model?
What do they want now?
What remains unresolved?
Why does another cut feel desirable or necessary?
```

Truth is necessary. Truth alone is not a sequence.

## 4. VIEWER MOMENTUM

Before every cut, the Brain should privately consider:

```text
known
expected
active question
curiosity gap
prediction shift
subject relevance
current want
unresolved value
forward pull
payoff debt
```

Master question:

> **Given everything the viewer currently believes, what is the strongest valid change QRE can make to that mental model right now that makes the next cut desirable, surprising, or necessary?**

## 5. CUT NECESSITY

Every candidate should survive:

> **If this cut disappears, what becomes weaker?**

If removing it does not materially damage setup, curiosity, escalation, reframe, coherence, or payoff, remove it.

## 6. CURRENT FAST LAB PATH

```text
apps/api/author-fast-suite.ts
        ↓
apps/api/src/services/authorFastCore.ts
        ↓
apps/api/src/services/creativeRelationOps.ts
        ↓
apps/api/src/services/authorBrainUniversal.ts
        ↓
SequencePlay / ViewerMomentum
        ↓
validated cut text
```

`authorBrainUniversal.ts` is the canonical **Goal-1 creative expansion surface**.

It may be expanded or tuned when a general creative law is discovered. It must not become a benchmark-specific phrase generator.

## 7. ACTUAL PRODUCTION PATH

The production route currently does **not** use the fast lab path directly.

```text
apps/api/src/routes/experience.ts
        ↓
apps/api/src/services/experienceService.ts
        ↓
@qre/engine compileCognitiveExperience()
        ↓
packages/engine/src/cognition/universalMind.ts
        ↓
world + significance + creative candidates + planner + learning
        ↓
experienceService flattens cognition into AuthorBrainTruth
        ↓
apps/api/src/services/microBeatMouth.ts
        ↓
apps/api/src/services/authorBrain.ts   ← LEGACY AUTHOR
```

**This is the central convergence task.**

Goal 1 is not complete until the production path and fast benchmark path use the same canonical author intelligence.

## 8. UPSTREAM COGNITION THAT MUST NOT BE DUPLICATED

`packages/engine/src/cognition/universalMind.ts` already provides:

```text
memory resolution
world model
world sanitation
significance
creative candidates
composition candidates
voice candidates
revision
critical selection
experience planning
mind state / learning
```

This is upstream intelligence, not junk.

The Universal Author should consume that intelligence through typed boundaries instead of rebuilding it from flattened strings.

Related canonical upstream systems:

```text
packages/engine/src/cognition/worldModel.ts
packages/engine/src/cognition/significanceEngine.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/mindState.ts
```

## 9. CUT POLICY CONVERGENCE

`apps/api/src/services/authorCutPolicy.ts` already contains richer semantic measures than the Universal Author's duplicated local gate:

```text
groundedness
novelty
implication
explanation
question leak
invention risk
repetition
compression
impact density
```

**Do not create a third cut validator.**

Converge Universal Author, legacy adapter, and production mouth onto one semantic cut policy.

## 10. LEGACY AUTHOR / ADAPTER SURFACE

These remain reachable or potentially reachable and therefore cannot be deleted casually:

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/cinematicAuthor.ts
apps/api/src/services/microBeatMouth.ts
apps/api/src/services/authorBrainMomentum.ts
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
```

Status:

- `authorBrain.ts` = legacy production author; replace first, delete after dependency proof.
- `microBeatMouth.ts` = production projection adapter; preserve projection responsibility, replace author call.
- `cinematicAuthor.ts` = critique/repair/rendering adapter; preserve editor/render responsibility, remove second author authority.
- numbered Momentum brains = rollback/audit only; delete after dependency proof.

## 11. OTHER COGNITION SURFACES

`apps/api/src/services/authorCognition.ts` contains heuristic signal/mode selection.

Its strategies are useful as **search signals**, but it must not become a second plot-authoring system.

`packages/engine/src/cognition/creativeWriter.ts`, `creativeComposition.ts`, and `creativeVoiceEngine.ts` are candidate-generation infrastructure. They must produce possibilities, not silently define the final movie.

## 12. CREATIVE RELATION OPERATIONS

`apps/api/src/services/creativeRelationOps.ts` is generic candidate search.

Candidates are hypotheses, not facts.

Examples of transferable operations:

```text
preference ↔ preference
positive ↔ negative
status ↔ history
recurrence ↔ present context
contradiction ↔ consequence
```

Recurrence requires actual memory, trajectory, or repeated evidence. A single dislike or preference does not imply recurrence.

## 13. SEQUENCE CONTRACTS

Canonical shared contracts:

```text
packages/contracts/src/sequencePlay.ts
packages/contracts/src/viewerMomentum.ts
packages/contracts/src/subjectTruth.ts
packages/contracts/src/world.ts
packages/contracts/src/realityModel.ts
packages/contracts/src/authoring.ts
packages/contracts/src/cognition.ts
```

Do not create another versioned sequence/momentum contract without proving a capability gap and documenting replacement/deletion.

## 14. LEGACY CONTRACT WATCHLIST

```text
packages/contracts/src/experience/indexV13.ts
packages/contracts/src/experience/memoryIntelligenceV14.ts
packages/contracts/src/experience/memoryForesightV15.ts
packages/contracts/src/experience/memorySpatialV16.ts
packages/contracts/src/experience/memoryWorldV13.ts
packages/contracts/src/experience/memoryWorldV13.ts.tmp
packages/contracts/src/experience/latentMovie.ts
```

No new version pile. Trace, replace, delete.

## 15. BENCHMARK RULE

These are test/observer surfaces, not production author authorities:

```text
apps/api/author-fast-suite.ts
apps/api/author-beat-presence-suite.ts
apps/api/author-beat-presence-master-suite.ts
apps/api/author-ceiling-benchmark.ts
apps/api/author-ceiling-test.ts
apps/api/author-creative-superstar-suite.ts
apps/api/author-mouth-quality-suite.ts
apps/api/author-universal-ceiling-suite.ts
apps/api/creative-learning-readout.ts
apps/api/local-author-test.ts
apps/api/one-pass-test.ts
```

A benchmark may define a capability target. It must not secretly define production behavior.

## 16. CREATIVE LAWS CURRENTLY CANONICAL

```text
identity is baseline
truth ≠ attention
source state ≠ plot instruction
emotion ≠ automatic story arc
creative interpretation ≠ invented event
questions belong in hidden cognition
service/provider is usually stage context
subject/world gravity
compressed impact > word-count fetish
one cut = one attention moment
next cut must earn itself
recurrence requires evidence
sparse world → smaller invented-world surface
benchmark ≠ production architecture
```

## 17. DEVELOPMENT LOOP

```text
ONE HYPOTHESIS
↓
TRACE INFLUENCE GRAPH
↓
ONE CANONICAL CHANGE
↓
REAL OLLAMA TEST
↓
INSPECT RAW + VALIDATED OUTPUT
↓
CLASSIFY FAILURE
↓
GENERALIZE THE LAW
↓
DOCUMENT
↓
DELETE / REPLACE STALE PATHS WHEN PROVEN UNUSED
```

After 2–4 meaningful experiments, update this index/changelog.

## 18. CLEAN REPO LAW

QRE should become easier to understand as intelligence increases.

Never allow:

```text
duplicate authors
duplicate mouths
duplicate validators
hidden benchmark behavior
stale "canonical" notes
version piles
hardcoded domain hacks
```

Full influence audit:

`docs/QRE_FULL_REPO_INFLUENCE_MAP.md`

Master mission:

`docs/QRE_AUTHOR_GOAL.md`
