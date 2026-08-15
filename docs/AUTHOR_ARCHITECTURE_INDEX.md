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
SEQUENCE PLAY
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
| SequencePlay | Viewer-state trajectory for how the show plays | KEEP / EVOLVE |
| Universal Author Brain | Final creative realization brain | KEEP |
| Cut Mouth | Language realization of selected sequence | KEEP |
| Living Memory | Cross-chapter continuity and creative history | KEEP |

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
What does the viewer know now?
What do they expect next?
What just changed?
What question is alive?
What should the next cut cause?
What can pay off later?
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
CUT
→ changed viewer state
→ next pressure / promise
→ CUT
→ changed meaning
→ next pressure / promise
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

`SequenceCut.gainKind` exists to make this distinction explicit. During migration it may be omitted by legacy producers, but new producers must use a non-`baseline` gain kind for actual cuts.

## 5. AUTHOR MOUTH RULES

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

## 6. ACTIVE AUTHOR FILES

These are the first files to inspect when changing author behavior:

```text
apps/api/src/services/authorBrain.ts
apps/api/src/services/authorFastCore.ts
apps/api/src/services/localModelRuntime.ts
apps/api/author-fast-suite.ts
packages/contracts/src/sequencePlay.ts
packages/contracts/src/index.ts
```

## 7. ACTIVE COGNITION FILES

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

## 8. LEGACY / JUNK WATCHLIST

These files are **not automatically safe to delete yet**, but they are under active audit because they contain prose-generation behavior or duplicate creative realization:

```text
packages/engine/src/cognition/creativeWriter.ts
packages/engine/src/cognition/creativeComposition.ts
packages/engine/src/cognition/creativeVoiceEngine.ts
```

Rule:

> A new architecture must name its replacement before a legacy file is deleted.

When an old file no longer has production references, delete it instead of leaving it as archaeological baggage.

## 9. LEGACY CONTRACT WATCHLIST

The repo contains versioned experience contracts such as:

```text
packages/contracts/src/experience/indexV13.ts
packages/contracts/src/experience/memoryIntelligenceV14.ts
packages/contracts/src/experience/memoryForesightV15.ts
packages/contracts/src/experience/memorySpatialV16.ts
```

These are **not automatically canonical** just because they are exported.

Before adding another version:

1. identify the capability it adds
2. decide whether the capability belongs in an existing universal contract
3. identify the production consumers
4. mark the old contract ACTIVE / LEGACY / DELETE CANDIDATE
5. remove dead versions once consumers are migrated

Do not create V17/V18-style accumulation without a cleanup decision.

## 10. REPLACEMENT MAP

Current direction:

```text
LatentMovie / raw event inventory
        ↓
Reality Graph / Source Ledger

beat-count planning
        ↓
SequencePlay / viewer-state trajectory

canned creative prose generators
        ↓
Creative Operations + Universal Author Brain

phrase blacklist growth
        ↓
search-behavior learning + novelty pressure

provider/service as protagonist
        ↓
subject/world gravity
```

## 11. DELETION RULE

A file is a deletion candidate when all are true:

```text
no production imports
no contract dependency
no test dependency
no unique intelligence not represented elsewhere
replacement is documented
```

Never delete merely because a file is ugly. Delete when it is obsolete.

## 12. DIAGNOSTIC RULE

When a test is bad, classify the failure before changing code:

```text
A. WORLD / TRUTH FAILURE
B. MEMORY / CONTINUITY FAILURE
C. SIGNIFICANCE FAILURE
D. SEQUENCE-PLAY FAILURE
E. AUTHOR REALIZATION FAILURE
F. VALIDATION / PARSING FAILURE
G. RUNTIME / MODEL-BUDGET FAILURE
```

Do not fix an E problem with a C hack.

## 13. CURRENT KNOWN FAILURE

The current SequencePlay diagnostic demonstrated:

```text
identity fact
→ identity fact
→ preference fact
```

This is a **SequencePlay failure**, not primarily a mouth failure.

The sequence contract and Author Brain now explicitly distinguish:

```text
BASELINE WORLD STATE
vs
VIEWER MOVEMENT
```

`SequenceCut.gainKind` is the semantic guardrail. Actual attention cuts must use a non-baseline gain type. Baseline identity belongs in `baselineFacts` / opening state unless identity itself is the dramatic discovery.

## 14. DOCUMENTATION RULE

After every 2–4 meaningful architecture/author experiments:

```text
WHAT DID WE TEST?
WHAT FAILED?
WHAT DID WE LEARN?
WHAT DID WE KILL?
WHAT IS NOW CANONICAL?
WHAT REPLACES IT?
WHAT IS THE NEXT HYPOTHESIS?
```

Update `docs/AUTHOR_NEXT_WORLD.md` for strategic truth.
Update `docs/AUTHOR_CHANGELOG.md` for historical detail.
Update this file when files/contracts are created, replaced, deprecated, or deleted.

## 15. CLEAN REPO PRINCIPLE

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
