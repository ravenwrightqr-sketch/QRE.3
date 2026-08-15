# QRE AUTHOR / COGNITION ARCHITECTURE INDEX

**Status:** ACTIVE
**Branch:** `elite-universal-rebuild-v10`
**Purpose:** one place to identify the live architecture and the junk/legacy pile.

## 1. NORTH STAR

QRE is a universal experience compiler.

The creative system must:

```text
UNDERSTAND WORLD
→ PRESERVE TRUTH
→ UNDERSTAND HISTORY
→ FIND SIGNIFICANCE
→ CHOOSE A SUBJECT/WORLD LENS
→ DESIGN HOW THE SHOW PLAYS
→ MOVE THE VIEWER'S MENTAL MODEL
→ AUTHOR THE CUTS
→ LEARN FROM THE RESULT
```

## 2. CANONICAL LIVE LAYERS

```text
SOURCE / PROMPT / MEDIA / RUNTIME
        ↓
REALITY + SOURCE LEDGER
        ↓
WORLD / ENTITY / RELATIONSHIP MODEL
        ↓
SIGNIFICANCE + MEMORY + LEARNING
        ↓
CREATIVE COMPETITION
        ↓
VIEWER MOMENTUM / SEQUENCE PLAY
        ↓
UNIVERSAL AUTHOR BRAIN
        ↓
CUT MOUTH
        ↓
CINEMATIC RUNTIME
```

| Layer | Canonical role | Status |
|---|---|---|
| SubjectTruth | Explicit identity truth | KEEP |
| AuthorBrainTruth | Author input boundary | KEEP |
| Source Ledger | Typed provenance | KEEP / EVOLVE |
| Creative Operations | Non-prose creative search | KEEP / EVOLVE |
| ViewerMomentum | Compact viewer cognitive state | KEEP |
| SequencePlay | Viewer-state trajectory | KEEP / EVOLVE |
| Universal Author Brain | Final creative realization | KEEP |
| Cut Mouth | Language realization | KEEP |
| Living Memory | Cross-chapter continuity | KEEP |

Canonical viewer-momentum protocol:

`docs/AUTHOR_VIEWER_MOMENTUM_PROTOCOL.md`

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

A fact being true does **not** make it an attention beat.

## 4. SEQUENCE PLAY RULE

SequencePlay is not a fixed beat template.

The sequence is a trajectory of viewer-state changes. The sweet spot may be 2 cuts, 3 cuts, 4 cuts, or more when earned.

```text
MENTAL MODEL
→ CUT
→ changed expectation / question / desire
→ next pressure
→ CUT
→ changed meaning
→ next pressure
→ CUT
```

Identity and stable facts are baseline. They should not consume attention cuts unless the identity itself becomes the discovery, contradiction, or reframe.

## 5. VIEWER MOMENTUM RULE

Before every cut the Brain privately evaluates:

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

## 6. COUNTERFACTUAL NECESSITY

A candidate cut should survive:

> **If this cut disappears, what becomes weaker?**

Strong removal damage includes setup collapse, question loss, random surprise, weaker escalation, broken reframe, or unearned payoff.

If removal damage is negligible, delete the cut.

## 7. ACTIVE AUTHOR PATH

```text
apps/api/src/services/authorFastCore.ts
        ↓
apps/api/src/services/authorBrainUniversal.ts
        ↓
compact sequence spine
        ↓
QRE reconstructs ViewerMomentum / SequencePlay diagnostics
        ↓
finished scenes
```

**CANONICAL IMPLEMENTATION RULE:** `authorBrainUniversal.ts` is the active fast-production author and the canonical expansion surface. It is intentionally designed to be expanded or tuned when stronger general laws are discovered. Do not preserve weaker implementations merely for compatibility.

The previous numbered Momentum implementations are **legacy / rollback / audit only** and should be deleted after dependency tracing confirms no production/test dependency remains:

```text
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
```

The older `authorBrainMomentum.ts` and `authorBrain.ts` remain legacy candidates as well.

The compact model output is:

```text
sequence
  premise
  baselineFacts
  cuts[]
    role
    gainKind
    change
    next
    text
```

The mouth is recovered directly from validated sequence cut text. A malformed duplicate `scenes[]` field must never erase a valid sequence.

## 8. ACTIVE SUPPORT FILES

```text
apps/api/src/services/localModelRuntime.ts
apps/api/author-fast-suite.ts
packages/contracts/src/sequencePlay.ts
packages/contracts/src/viewerMomentum.ts
packages/contracts/src/index.ts
```

## 9. LEGACY / JUNK WATCHLIST

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/authorBrainMomentum.ts
apps/api/src/services/authorBrainMomentumV2.ts
apps/api/src/services/authorBrainMomentumV3.ts
packages/engine/src/cognition/creativeWriter.ts
packages/engine/src/cognition/creativeComposition.ts
packages/engine/src/cognition/creativeVoiceEngine.ts
```

Do not delete until production imports, tests, and unique capabilities are traced.

## 10. LEGACY CONTRACT WATCHLIST

```text
packages/contracts/src/experience/indexV13.ts
packages/contracts/src/experience/memoryIntelligenceV14.ts
packages/contracts/src/experience/memoryForesightV15.ts
packages/contracts/src/experience/memorySpatialV16.ts
```

Do not create another version until capability, replacement, consumers, and deletion path are documented.

## 11. REPLACEMENT MAP

```text
LatentMovie / raw event inventory
        ↓
Reality Graph / Source Ledger

beat-count planning
        ↓
ViewerMomentum + SequencePlay

large cognitive JSON from the model
        ↓
compact sequence spine + programmatic diagnostics

numbered Momentum brains
        ↓
canonical Universal Author Brain

canned prose generators
        ↓
creative competition + Universal Author Brain

phrase blacklist growth
        ↓
search-behavior learning + counterfactual necessity

provider/service as protagonist
        ↓
subject/world gravity
```

## 12. DIAGNOSTIC RULE

Classify failures before changing code:

```text
A. WORLD / TRUTH
B. MEMORY / CONTINUITY
C. SIGNIFICANCE
D. VIEWER-MOMENTUM / SEQUENCE
E. AUTHOR REALIZATION
F. VALIDATION / PARSING
G. RUNTIME / MODEL-BUDGET
```

The recent failure pattern was primarily **author realization + representation**:

- emotional state was being mistaken for plot direction;
- the local model invented unsupported physical performances;
- hidden viewer questions leaked into the mouth;
- duplicate output fields created unnecessary failure modes.

The canonical Universal Author now treats sequence cut text as the authoritative mouth source and keeps viewer cognition separate from finished language.

## 13. DEVELOPMENT LAW

```text
failure
→ mechanism
→ reusable law
→ cross-domain test
→ architecture
→ documentation
```

Never turn every failure into another phrase blacklist.

After 2–4 meaningful experiments document:

```text
WHAT DID WE TEST?
WHAT FAILED?
WHAT DID WE LEARN?
WHAT DID WE KILL?
WHAT IS NOW CANONICAL?
WHAT REPLACES IT?
WHAT IS THE NEXT HYPOTHESIS?
```

## 14. CLEAN REPO PRINCIPLE

QRE should become easier to understand as intelligence increases.

A stronger architecture must reduce:

```text
duplicate brains
duplicate mouths
version piles
phrase factories
hardcoded domain branches
unreferenced contracts
stale diagnostics
```

Intelligence growth must not produce architectural entropy.
