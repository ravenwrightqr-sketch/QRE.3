# QRE FULL REPO INFLUENCE MAP

**Status:** CANONICAL AUDIT RECORD  
**Branch audited:** `elite-universal-rebuild-v10`  
**Date:** 2026-08-15  
**Purpose:** Prevent QRE author/cognition work from being changed in isolation when another subsystem can override, bypass, duplicate, or constrain it.

## 1. Standing engineering rule

Before changing author behavior:

```text
TRACE THE INFLUENCE GRAPH
→ IDENTIFY THE REAL PRODUCTION PATH
→ IDENTIFY PARALLEL AUTHOR / COGNITION PATHS
→ IDENTIFY CONTRACT OWNERS
→ IDENTIFY VALIDATORS / REPAIRERS
→ IDENTIFY LEARNING INPUTS
→ IDENTIFY LEGACY / JUNK
→ CHANGE THE CANONICAL PATH
→ TEST THE REAL PRODUCTION PATH
→ DOCUMENT THE RESULT
```

The author is a system, not a file.

A file is not considered "inactive" because its name looks old. Production imports, test harnesses, adapters, contracts, and compiler paths must be traced.

## 2. Audit coverage

The repository was recursively inventoried from the current branch tree, then the author, compiler, cognition, contracts, production route, memory, learning, validator, and benchmark surfaces were traced at source level.

Important limitation: the connected GitHub code-search index is not reliable enough to prove absence of symbols, and a local clone was unavailable in this environment. Therefore this record is a **recursive-tree + targeted-source influence audit**, not a claim that every line of every file was manually read.

## 3. THE MOST IMPORTANT FINDING

The fast author laboratory and the production experience author were **not the same path**.

### Fast laboratory

```text
apps/api/author-fast-suite.ts
        ↓
apps/api/src/services/authorFastCore.ts
        ↓
apps/api/src/services/authorBrainUniversal.ts
        ↓
SequencePlay / ViewerMomentum
        ↓
validated cut text
```

### Actual production authoring path observed

```text
POST /experience/compile
        ↓
apps/api/src/routes/experience.ts
        ↓
apps/api/src/services/experienceService.ts
        ↓
@qre/engine compileCognitiveExperience()
        ↓
packages/engine/src/cognition/universalMind.ts
        ↓
world model
significance
creative candidates
planner
mind state
        ↓
experienceService flattens cognition into AuthorBrainTruth
        ↓
apps/api/src/services/microBeatMouth.ts
        ↓
apps/api/src/services/authorBrain.ts   ← OLD BRAIN
        ↓
experienceService.applyMicroBeats()
        ↓
cinematicScenes / moments
```

This means **Goal-1 fast author experiments were not automatically testing the exact production author path.**

This must be fixed before declaring the author finished.

## 4. Parallel cognition / author systems discovered

### A. Universal Mind

`packages/engine/src/cognition/universalMind.ts`

This is a large cognition/orchestration stack that already performs:

```text
memory resolution
world model construction
world sanitization
narrative-world collapse
significance analysis
creative candidate generation
narrative writer candidates
composition candidates
voice drafts
revision
critical selection
experience planning
mind-state evolution
learning input
```

It is therefore not safe to treat it as merely legacy prose code.

**Decision:** KEEP AS UPSTREAM COGNITION CANDIDATE.  
Do not duplicate its responsibilities inside the Universal Author. Converge its outputs into the canonical world/significance/creative-search/sequence boundary.

### B. Old Author Brain

`apps/api/src/services/authorBrain.ts`

This is still live-reachable through production adapters.

It has its own:

- source ledger
- identity suppression
- provider detection
- baseline suppression
- scene validator
- partial JSON recovery
- prompt rules
- sequence normalization
- author realization

**Decision:** LEGACY IMPLEMENTATION, NOT SAFE TO DELETE YET.  
It must first be replaced in production imports by the canonical Universal Author and then dependency-traced for deletion.

### C. Universal Author Brain

`apps/api/src/services/authorBrainUniversal.ts`

This is the **canonical creative-author expansion surface** for the new Goal-1 architecture.

It owns the compact sequence spine and should consume upstream world truth, significance, relations, memory, learning, and viewer momentum without re-creating those systems.

### D. Author Cognition

`apps/api/src/services/authorCognition.ts`

Contains signal-based mode selection such as personality contrast, provenance/history, callback/continuity, service personality, status inversion, and other heuristic strategies.

**Risk:** these can become an invisible competing author if they force a lens or plot shape before Universal Author selection.

**Decision:** AUDIT / REUSE CAPABILITIES, BUT DO NOT LET IT BECOME A SECOND AUTHOR. Heuristics should become optional search signals upstream of creative competition, not mandatory plot branches.

### E. Author Cut Policy

`apps/api/src/services/authorCutPolicy.ts`

This is a sophisticated semantic cut evaluator with metrics for:

```text
groundedTokenRatio
novelty
implication
explanation
questionLeak
inventionRisk
repetition
compression
impact density
```

**Critical finding:** the Universal Author currently contains overlapping validation logic instead of importing this policy directly.

**Decision:** UNIFY rather than duplicate. `authorCutPolicy.ts` should become the canonical semantic cut-policy service, or its unique capabilities should be absorbed into one canonical evaluator and the duplicate removed.

### F. Cinematic Author

`apps/api/src/services/cinematicAuthor.ts`

Calls the OLD `authorBrain.ts`, then can perform critique and repair in non-fast mode.

Its critique/repair prompts contain valuable universal rules, but it is a separate realization path.

**Decision:** KEEP AS ADAPTER / RENDERING SHELL while migrating its author call to the canonical Universal Author. Do not allow its repair prompt to become a second hidden author.

### G. Micro Beat Mouth

`apps/api/src/services/microBeatMouth.ts`

Calls the OLD `authorBrain.ts` and also contains:

- hardcoded beat-count heuristics
- returning-chapter count logic
- domain keyword count logic
- comma/semicolon stripping
- micro-beat metadata

**Decision:** KEEP AS PRODUCTION ADAPTER ONLY. Its runtime metadata and projection responsibility may remain, but its author call must converge to Universal Author and its beat-count heuristics must not determine creative sequence shape.

## 5. Production compiler seam

`apps/api/src/services/experienceService.ts` currently:

1. loads memory
2. loads analytics
3. loads presence
4. calls `compileCognitiveExperience()` from `@qre/engine`
5. resolves SubjectTruth
6. flattens engine observations, moments, memory, and presence into `AuthorBrainTruth`
7. calls `authorMicroBeats()`
8. replaces the cinematic scenes when enough beats are returned
9. projects memory afterward

This is a good architectural seam for convergence because it already has access to:

```text
world
memory
presence
analytics
cognitive plan
subject truth
learning signals
trajectory
```

The critical next task is to route this production seam through the canonical Universal Author without duplicating world intelligence.

## 6. Canonical semantic contracts

These are currently strong and should remain shared boundaries:

```text
packages/contracts/src/sequencePlay.ts
packages/contracts/src/viewerMomentum.ts
packages/contracts/src/subjectTruth.ts
packages/contracts/src/world.ts
packages/contracts/src/realityModel.ts
packages/contracts/src/authoring.ts
packages/contracts/src/cognition.ts
```

`SequencePlay` and `ViewerMomentum` already express the correct distinction:

```text
REALITY
≠
SEQUENCE
```

Identity/baseline facts belong in opening state. Cuts represent viewer-state change.

**Decision:** DO NOT create another sequence contract. Extend these only when a demonstrated capability gap exists.

## 7. Creative significance / candidate systems

### Significance

`packages/engine/src/cognition/significanceEngine.ts`

Already detects:

- recurring participants
- recurring places
- shared relationships
- objects
- time
- state changes
- memory-resolved events
- continuations

**Decision:** KEEP and evolve. This should feed creative competition rather than be reimplemented inside the mouth.

### Creative policy

`packages/engine/src/cognition/creativePolicy.ts`

Already generates multiple candidate drafts and scores them on:

```text
creativity
evidenceCoverage
novelty
causalFit
attention
score
learning bias
```

It also currently imports `creativeWriter.ts` and contains contextual prose strategies.

**Decision:** KEEP AS CANDIDATE SEARCH INFRASTRUCTURE. Gradually move from canned prose strategies toward reusable semantic operations and let Universal Author select among them.

### Experience planner

`packages/engine/src/cognition/experiencePlanner.ts`

Builds `CognitiveExperiencePlan`, including:

```text
story structure
memory model
geographic model
social model
discovery model
progression model
creative possibilities
realization directives
premise slots / relations
```

**Decision:** KEEP as upstream planning cognition. Its `creativePossibilities` must be treated as a search field, not as mandatory prose instructions.

## 8. Benchmark / diagnostic surface

The repository contains many author benchmark/test programs, including:

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

**Decision:** THESE ARE OBSERVERS, NOT PRODUCTION AUTHORITIES.

A benchmark may define a desired capability, but no benchmark helper may silently become a production creative rule.

## 9. Legacy contract / junk watchlist

Observed contract history includes:

```text
packages/contracts/src/experience/indexV13.ts
packages/contracts/src/experience/memoryIntelligenceV14.ts
packages/contracts/src/experience/memoryForesightV15.ts
packages/contracts/src/experience/memorySpatialV16.ts
packages/contracts/src/experience/memoryWorldV13.ts
packages/contracts/src/experience/memoryWorldV13.ts.tmp
packages/contracts/src/experience/latentMovie.ts
```

**Decision:** no new versioned contracts until the capability, owner, replacement, and deletion path are documented.

The `.tmp` file is a junk candidate pending dependency proof.

## 10. Compiler branch / PR history

A separate draft PR exists on another branch:

`PR #1 — refactor: establish canonical experience compiler core`

It is open/draft and currently unmerged. It proposes a canonical compiler boundary with `ExperienceMoment[]` as semantic output and Flow/CinematicScene as projections.

**Decision:** DO NOT silently merge its assumptions into this author work. Evaluate it separately as compiler architecture history. Its existence is another reason to avoid creating parallel author/compiler contracts on the current branch.

## 11. Hard architectural conflicts to resolve

### Conflict 1 — two author paths

```text
FAST LAB → Universal Author
PRODUCTION → old Author Brain
```

**Must converge.**

### Conflict 2 — duplicate cut validation

```text
authorCutPolicy.ts
Universal Author local validCut()
Old Author Brain invalid()/finalizeScenes()
```

**Must converge to one semantic policy.**

### Conflict 3 — duplicate creative cognition

```text
UniversalMind
AuthorCognition
CreativePolicy
UniversalAuthor
```

These must become layers of one intelligence stack, not competing authors.

### Conflict 4 — beat-count control

Production adapters still contain domain/round-based beat counts.

Beat count must be a consequence of earned sequence movement, not the creative objective.

### Conflict 5 — repair authors

`cinematicAuthor.ts` can call another model to critique/repair output.

Repair must become an editor of the canonical sequence, not an independent creative reset.

## 12. Canonical target after convergence

```text
INPUT
  ↓
WORLD / SOURCE LEDGER
  ↓
MEMORY + PRESENCE + ANALYTICS
  ↓
SIGNIFICANCE
  ↓
CREATIVE SEARCH / RELATION OPERATIONS
  ↓
UNIVERSAL AUTHOR
  ├─ viewer momentum
  ├─ sequence selection
  ├─ counterfactual necessity
  └─ discovery / implication
  ↓
CANONICAL CUT POLICY
  ↓
MOUTH REALIZATION
  ↓
EXPERIENCE MOMENTS / CINEMATIC PROJECTIONS
  ↓
LEARNING + MEMORY
```

The production and benchmark paths should both enter this same intelligence stack.

## 13. Next engineering order

Do NOT continue tuning output style first.

The next order is:

```text
1. Converge production author call onto Universal Author.
2. Unify cut-policy evaluation.
3. Separate hidden sequence cognition from mouth realization.
4. Remove beat-count heuristics from creative authority.
5. Preserve UniversalMind / significance / memory as upstream intelligence.
6. Trace legacy imports.
7. Delete unused author brains after proof.
8. Run COCO + MARIA + HORROR + RAVE through the same production path.
9. Run COCO-RETURN to test memory evolution.
10. Only then add more creative operations.
```

## 14. Permanent rule

> **Do not ask the mouth to compensate for missing cognition. Do not ask the benchmark to define production architecture. Do not let a legacy file silently remain authoritative because it still exists.**

Every future author change must update this map or the changelog when it changes the influence graph.
