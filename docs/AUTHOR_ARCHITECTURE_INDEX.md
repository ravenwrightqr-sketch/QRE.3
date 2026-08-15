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

The domain may be a pet, person, business, home, event, memory, product, place, service, or organization. The cognition remains universal.

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

### Current canonical concepts

| Layer | Canonical role | Status |
|---|---|---|
| SubjectTruth | Explicit identity truth | KEEP |
| AuthorBrainTruth | Author input boundary | KEEP |
| Source Ledger | Typed provenance for author input | KEEP / EVOLVE |
| Creative Operations | Non-prose creative search primitives | KEEP / EVOLVE |
| ViewerMomentum | Compact viewer cognitive state | KEEP |
| SequencePlay | Viewer-state trajectory and transition model | KEEP / EVOLVE |
| Universal Author Brain | Final creative realization brain | KEEP |
| Cut Mouth | Language realization of selected sequence | KEEP |
| Living Memory | Cross-chapter continuity and creative history | KEEP |

Canonical viewer-momentum protocol:

`docs/AUTHOR_VIEWER_MOMENTUM_PROTOCOL.md`

## 3. CRITICAL DISTINCTION

### Reality is not Sequence

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

Example failure:

```text
Coco is male.
Coco is a poodle.
Coco loves treats.
```

These may be valid world facts. They are not automatically three cinematic cuts.

## 4. SEQUENCE PLAY RULE

SequencePlay is NOT a fixed beat template.

It is an internal model of **viewer-state change over time**.

The sweet spot is determined by the material:

```text
2 cuts
3 cuts
4 cuts
7 cuts
```

All are valid when earned.

The sequence should feel like spliced film:

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

Do not turn SequencePlay into a fact checklist or event inventory.

### 4.1 BASELINE IS NOT A CUT

Established identity and stable world facts belong to **baseline state**, not attention movement.

Examples:

```text
Coco is male.
Coco is a poodle.
The property is a house.
The business is a restaurant.
The wedding is for the couple.
```

These may establish truth upstream. They should not consume sequence cuts unless the identity/fact itself becomes a dramatic discovery, contradiction, or reframe.

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

The master question is:

> **Given everything the viewer currently believes, what is the strongest valid change QRE can make to that mental model right now that makes the next cut desirable, surprising, or necessary?**

## 6. CUT NECESSITY

Every candidate cut should survive a counterfactual test:

> **If this cut disappears, what becomes weaker?**

Strong removal damage includes:

```text
setup collapses
question disappears
surprise becomes random
escalation loses pressure
reframe loses meaning
payoff becomes unearned
```

A cut with no meaningful removal damage is a candidate for deletion.

## 7. AUTHOR MOUTH RULES

The mouth is downstream from sequence intelligence.

It should prefer:

```text
new information
implication
character gravity
reframe
contrast
callback
status shift
surprise
consequence
```

It should avoid:

```text
subject-name repetition
identity reintroduction
database relationship labels
raw action reporting
emotion narration
comma-stuffed multi-shots
invented physical events
invented participants
padding
```

Examples of the desired compression behavior:

> The monster appeared.
>
> Pink bows everywhere.

or:

> Bows again.
>
> Bow re-adjusted.
>
> For now.

The power is **new meaning per cut**, not a specific word count.

## 8. ACTIVE AUTHOR PATH

```text
apps/api/src/services/authorFastCore.ts
        ↓
apps/api/src/services/authorBrainMomentum.ts
        ↓
ViewerMomentum + SequencePlay
        ↓
finished scenes
```

`authorBrainMomentum.ts` is the current fast-production author.

`authorBrain.ts` remains temporarily for migration/rollback and is a **replacement candidate**, not the preferred new implementation.

## 9. ACTIVE SUPPORT FILES

```text
apps/api/src/services/localModelRuntime.ts
apps/api/author-fast-suite.ts
packages/contracts/src/sequencePlay.ts
packages/contracts/src/viewerMomentum.ts
packages/contracts/src/index.ts
```

## 10. ACTIVE COGNITION FILES

These are useful source-of-truth cognition components. They are candidates for simplification, but not automatically junk:

```text
packages/engine/src/cognition/mindState.ts
packages/engine/src/cognition/memoryResolver.ts
packages/engine/src/cognition/memoryRecommendations.ts
packages/engine/src/cognition/experiencePlanner.ts
packages/engine/src/cognition/experienceCritic.ts
packages/engine/src/cognition/creativePolicy.ts
packages/engine/src/cognition/creativeRevision.ts
```

They must eventually feed the same universal Brain rather than becoming parallel authors.

## 11. LEGACY / JUNK WATCHLIST

These files are **not automatically safe to delete yet**, but they are under active audit because they contain prose-generation behavior or duplicate creative realization:

```text
packages/engine/src/cognition/creativeWriter.ts
packages/engine/src/cognition/creativeComposition.ts
packages/engine/src/cognition/creativeVoiceEngine.ts
```

## 12. LEGACY CONTRACT WATCHLIST

The repo contains versioned experience contracts such as:

```text
packages/contracts/src/experience/indexV13.ts
packages/contracts/src/experience/memoryIntelligenceV14.ts
packages/contracts/src/experience/memoryForesightV15.ts
packages/contracts/src/experience/memorySpatialV16.ts
```

These are **not automatically canonical** just because they are exported.

Do not create another version until the capability, replacement, consumers, and deletion path are documented.

## 13. REPLACEMENT MAP

```text
LatentMovie / raw event inventory
        ↓
Reality Graph / Source Ledger

beat-count planning
        ↓
ViewerMomentum + SequencePlay

canned creative prose generators
        ↓
Creative Operations + Momentum Author

phrase blacklist growth
        ↓
search-behavior learning + counterfactual necessity

provider/service as protagonist
        ↓
subject/world gravity
```

## 14. DELETION RULE

A file is a deletion candidate when all are true:

```text
no production imports
no contract dependency
no test dependency
no unique intelligence not represented elsewhere
replacement is documented
```

Never delete merely because a file is ugly. Delete when it is obsolete.

## 15. DIAGNOSTIC RULE

When a test is bad, classify the failure before changing code:

```text
A. WORLD / TRUTH FAILURE
B. MEMORY / CONTINUITY FAILURE
C. SIGNIFICANCE FAILURE
D. VIEWER-MOMENTUM / SEQUENCE FAILURE
E. AUTHOR REALIZATION FAILURE
F. VALIDATION / PARSING FAILURE
G. RUNTIME / MODEL-BUDGET FAILURE
```

Do not fix an E problem with a C hack.

## 16. DEVELOPMENT LAW

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

## 17. CLEAN REPO PRINCIPLE

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
