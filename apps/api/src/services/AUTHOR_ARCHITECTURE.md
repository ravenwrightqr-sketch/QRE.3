# QRE CANONICAL AUTHOR — PROTECTED ARCHITECTURE

This file is the persistent maintenance contract for canonical QRE Author code.
It protects architectural boundaries from accidental edits during nearby Author
work. The current design record is
`.qre-debug/cognitive-audit/05-target-architecture.md`; `.qre-debug` is
working/audit material, while this file is the repository source of truth for
maintenance discipline.

## Core Rule

Never modify a protected Author boundary merely because another Author task
touches nearby code.

A task changing Semantic Expansion does not authorize changes to Mouth. A task
changing Perspective does not authorize changes to grounding. A task changing
provider transport does not authorize prompt changes. A task changing
performance does not authorize cognitive changes.

Changes must remain inside the explicitly authorized architectural boundary.

Before modifying canonical Author code, Codex must state:

```text
AUTHORIZED CHANGE:
[boundary]

PROTECTED / UNCHANGED:
[list]
```

If implementation requires crossing a protected boundary, Codex must stop and
ask for approval rather than silently expanding scope.

## Current Canonical Call Graph

Current production path:

```text
experienceService.ts
  -> authorBrainCanonical()
  -> extractAuthorReality() when no supplied graph exists
  -> buildAuthorRealityGraph()
  -> discoverAuthorCreativeDirection()
     -> verifyDiscoveryCandidates()
     -> repairDiscoveryCandidates() when needed
  -> createAuthorExperience()
     -> Structure Planner / deterministic plan
     -> derive/select semantic mechanic
     -> searchAuthorCreativeLensTreatments()
     -> QRE Mouth realization
     -> Mouth parsing, scoring, repair, fallback
  -> verifyAuthorCreativeGrounding()
  -> experienceService runtime/rendering projection
```

Preferred cognitive language:

```text
SUPPLIED MATERIAL
-> REALITY AUTHORITY
-> SEARCH FOR CREATIVE CHARGE
-> AMPLIFY
-> CONNECT OTHER SUPPLIED MATERIAL WHEN USEFUL
-> CREATIVE PRESSURE / TREATMENT WHEN USEFUL
-> EXPRESSION
-> GROUNDING
```

Reality Authority asks:

```text
What does this supplied material establish?
```

Creative cognition asks:

```text
What can I make from it?
```

Machine compatibility terminology may remain. Do not rename current TypeScript
fields such as `facts`, `evidence`, or `eventIds` unless a separate task
explicitly authorizes that compatibility work.

## Protected Boundaries

### 1. Reality Authority

Current files/functions:

- `apps/api/src/services/authorRealityAuthority.ts`
  - `inferAuthorRealityAuthority()`
  - `projectAuthorRealityEvidence()`
  - `AUTHOR_REALITY_AUTHORITY_DOCTRINE`
- `apps/api/src/services/authorBrainCanonical.ts`
  - `authorBrainCanonical()` preserves supplied facts, supplied graphs, active
    memory, and the current RealityGraph before creative work begins.
- `apps/api/src/services/authorRealityExtractor.ts`
  - `extractAuthorReality()` is the optional model extraction path only when a
    supplied graph is not already present.

Protected behavior: factual authority classification, supplied fact handling,
and authority doctrine. Do not weaken this layer to make creative output pass.

### 2. RealityGraph / Supplied Evidence Authority

Current files/functions:

- `apps/api/src/services/authorRealityGraph.ts`
  - `buildAuthorRealityGraph()`
  - `splitReality()`
  - `buildEventStructure()`
  - relation/entity/pattern derivation helpers in this file
- `apps/api/src/services/authorBrainCanonical.ts`
  - `authorBrainCanonical()` chooses either `input.realityGraph` or
    `buildAuthorRealityGraph()` and maps `world.events` into canonical supplied
    reality for downstream Author stages.

Protected behavior: supplied reality is closed; derived graph structure may
suggest meaning but must not invent events, causality, people, objects,
locations, motives, or outcomes.

### 3. Creative Discovery

Current files/functions:

- `apps/api/src/services/authorCreativeDiscovery.ts`
  - `AuthorCreativeCandidate`
  - `AuthorCreativeDiscovery`
  - `discoverAuthorCreativeDirection()`
  - `normalizeCandidate()`
  - selected/playable/background evidence selection inside
    `discoverAuthorCreativeDirection()`

Protected behavior: Discovery creates evidence-linked interpretation candidates
before Structure Planner narrows expression. Semantic Expansion work belongs
here unless a task explicitly authorizes another boundary.

### 4. Discovery Grounding and Repair

Current files/functions:

- `apps/api/src/services/authorCreativeDiscovery.ts`
  - `verifyDiscoveryCandidates()`
  - `repairDiscoveryCandidates()`
  - deterministic truth-floor helpers:
    `candidateCrossesDeterministicTruthFloor()`,
    `candidateCrossesOperationalServiceTruthFloor()`,
    `candidateReferencesUncitedEvidence()`

Protected behavior: Discovery grounding and repair decide which private
interpretations survive as grounded Author cognition. Do not loosen these
checks as a side effect of creativity work.

### 5. Structure Planner / Evidence Selection

Current files/functions:

- `apps/api/src/services/authorCreative.ts`
  - `createAuthorExperience()`
  - `normalizePlan()`
  - `fallbackPlan()`
  - `enforceMemoryStructure()`
  - `lockPlanToApprovedMeaning()`
  - `ensurePostLockMemoryCanvas()`

Protected behavior: selected evidence, authorized evidence, beat grouping,
memory structure, and plan locking. Do not alter evidence survival, beat order,
or planner prompt behavior unless the task explicitly authorizes Structure.

### 6. Creative Search / Treatment Generation

Current files/functions:

- `apps/api/src/services/authorCreative.ts`
  - `deriveAuthorSemanticMechanicCandidates()`
  - `selectAuthorSemanticMechanic()`
  - `searchAuthorCreativeLensTreatments()`
  - `assessAuthorCreativeTreatmentSet()`
  - `unsupportedTreatmentMaterialReason()`
  - treatment assignment helpers including `treatmentAsAssignment()`,
    `treatmentProductionLetter()`, and `treatmentVariantIndex()`
- `apps/api/src/services/authorCreativeDoctrine.ts`
  - `QRE_CREATIVE_OPERATING_DOCTRINE`

Protected behavior: creative pressure, semantic mechanic choice, treatment
generation, treatment set acceptance, and treatment assignment into Mouth.

### 7. Mouth / Final Expressive Realization

Current file/function:

- `apps/api/src/services/authorCreative.ts`
  - `createAuthorExperience()`
  - the `localModelGenerate()` call whose system role begins
    `"You are QRE Mouth."`
  - Mouth JSON schema, production parsing, nominated production selection, and
    scene construction inside `createAuthorExperience()`
  - `buildDeterministicMouthFallback()`

Canonical Mouth file/function protected:

- File: `apps/api/src/services/authorCreative.ts`
- Function: `createAuthorExperience()`
- Protected call: the QRE Mouth `localModelGenerate()` request beginning with
  system content `"You are QRE Mouth."`

The canonical Mouth prompt, Mouth doctrine, Mouth schema, realization
instructions, repair behavior, and output interpretation are protected.

Do not alter Mouth while working on upstream cognition unless the task
explicitly says:

```text
AUTHORIZE MOUTH CHANGE
```

Semantic Expansion, Relation Discovery, Perspective Discovery, Reality
Authority, model-provider work, performance work, business/domain work, or
frontend work do not implicitly authorize Mouth changes.

If a requested change appears to require Mouth modification:

```text
STOP.
Report the dependency.
Show the proposed Mouth change separately.
Wait for explicit approval.
```

### 8. Mouth Repair

Current files/functions:

- `apps/api/src/services/authorCreative.ts`
  - `repairNominatedMemoryProduction()`
  - `scoreMemorySequence()`
  - `buildDeterministicMouthFallback()`
  - Mouth fallback/recovery branches inside `createAuthorExperience()`
- `apps/api/src/services/authorCutFloor.ts`
  - `evaluateAuthorCut()`

Protected behavior: repair eligibility, repair prompt/schema, fallback reasons,
candidate rescoring, and deterministic fallback semantics.

### 9. Atomic Grounding

Current file/function:

- `apps/api/src/services/authorCreativeGroundingVerifier.ts`
  - `verifyAuthorCreativeGrounding()`
  - `beatClauses()`
  - `reconciledUnsupportedClaims()`
  - `hasUnsupportedSensoryClaim()`

Protected behavior: final clause-level factual firewall, support kinds,
unsupported claim handling, and accepted scene filtering. Grounding and Reality
Authority remain the factual firewall.

Do not weaken factual authority to make creative output pass. Creative
improvements happen upstream unless the task explicitly authorizes a grounding
change. A failed creative candidate is not by itself evidence that grounding
should be loosened.

### 10. Selection / Scoring / Acceptance

Current files/functions:

- `apps/api/src/services/authorCreative.ts`
  - `assessAuthorCreativeTreatmentSet()`
  - `scoreMemorySequence()`
  - `repairNominatedMemoryProduction()`
  - accepted treatment selection and nominated production selection inside
    `createAuthorExperience()`
- `apps/api/src/services/authorCutFloor.ts`
  - `evaluateAuthorCut()`
- `apps/api/src/services/authorCreativeDiscovery.ts`
  - selected candidate selection in `discoverAuthorCreativeDirection()`

Protected behavior: thresholds, scores, selection order, acceptance reasons,
fallback behavior, and winner selection. Do not alter these during unrelated
cognitive work. Any scoring change requires explicit authorization.

### 11. Model Transport

Current file/functions:

- `apps/api/src/services/localModelRuntime.ts`
  - `localModelGenerate()`
  - `request()`
  - `modelName()`
  - `fallbackModelName()`
  - `localModelConfig()`
  - `localModelHealthy()`

Protected behavior: provider transport, request format, fallback behavior,
timeouts, retries/fallback handling, and response extraction.

### 12. Token Budgets / Temperatures / Inference Settings

Current files/functions:

- `apps/api/src/services/localModelRuntime.ts`
  - `defaultTemperature()`
  - `defaultNumPredict()`
  - `defaultNumCtx()`
  - `timeoutMs()`
  - `headersTimeoutMs()`
  - `bodyTimeoutMs()`
  - `connectTimeoutMs()`
  - `keepAlive()`
- Per-stage inference settings at `localModelGenerate()` call sites:
  - `apps/api/src/services/authorRealityExtractor.ts`
  - `apps/api/src/services/authorCreativeDiscovery.ts`
  - `apps/api/src/services/authorCreative.ts`
  - `apps/api/src/services/authorCreativeGroundingVerifier.ts`

Do not alter `temperature`, `numPredict`, `numCtx`, context size, fallback
model, provider, retry/fallback behavior, or timeouts as a side effect of
cognitive work. These variables can materially change behavior and destroy
controlled comparison.

### 13. Runtime / Rendering Compatibility Boundary

Current files/functions:

- `apps/api/src/services/experienceService.ts`
  - imports and calls `authorBrainCanonical()`
  - `experienceBeats()`
  - `cinematicScenes()`
  - `moments()`
  - canonical diagnostics projection around `canonical.diagnostics`
- `apps/api/src/services/experienceCreationServices.ts`
  - renderability/complete checks against Author diagnostics
  - `authoredBy: "qre-author-canonical"`
  - `realizationPath: "authorBrainCanonical"`

Protected behavior: Author output contracts, diagnostics shape, scene/source ID
projection, renderability compatibility, and runtime labels. Runtime/rendering
work does not authorize Author cognition, Mouth, grounding, scoring, or prompt
changes.

## Prompt Protection

Treat model-facing language as architecture.

Do not casually rewrite prompts for style, clarity, cleanup, concision, or
"improvement."

Every model-visible wording change is a cognitive change.

Prompt changes must be:

- explicitly within task scope
- identified before editing
- shown in diff
- behaviorally justified

## Supplied Material Protection

"Supplied material" is the preferred cognitive term for everything supplied to
Author. Do not architect creative cognition around a narrow concept of "facts."

A supplied word, preference, state, event, relationship, duration, measurement,
object, name, phrase, or sequence can all be creative material.

Reality Authority may continue internally classifying evidence types because
those classifications determine what the supplied material establishes and what
concrete claims are permitted. That factual/evidence machinery must not imply
creative importance.

Creative cognition asks:

```text
What in the supplied material has creative charge, and what can it become
perceptually without changing material reality?
```

Input size does not determine creative importance. One word may contain enough
creative charge to dominate an entire realization.

Do not require equal creative representation of all supplied material. Do not
turn Material/Semantic Expansion into an exhaustive checklist, taxonomy, or
requirement to expand every item equally.

Discover more than you express. Internal creative exploration may be large.
Viewer-facing expression stops when the perception lands.

Do not introduce domain-specific shortcuts that cause `SERVICE`, `BUSINESS`,
`PET`, `IDENTITY`, `RELATIONSHIP`, `OBJECT`, `PLACE`, or other domains to
receive separate creative brains unless explicitly architected.

Domain context supplies reality/relevance. Universal Author performs cognition.

Relation Discovery and Perspective Discovery remain available cognitive
capabilities, not mandatory rituals that every realization must visibly
exercise.

Named creative pressures such as game, deadpan, noir, cyber, ritual, mission,
system, and related families remain valid and valuable creative possibilities.
Do not remove or weaken them merely to manufacture diversity.

No named creative family should become default gravity that repeatedly pulls
unrelated supplied material into the same perceptual neighborhood.

When the user explicitly chooses a lens, that lens may intentionally exert
strong pressure. When no lens is selected, Author remains free to discover
game, noir, cyber, deadpan, or anything else from the supplied material itself.

## No Hardcoded Creative Patches

Do not add special logic for:

- Coco
- Milo
- bows
- bacon
- dirt
- relationships
- specific people
- specific businesses
- specific sentences
- specific desired outputs
- domain-specific creative rules

Regression examples test universal cognition; they do not define it.

## Protected Recovery Points

Protected tags/checkpoints must never be rewritten, deleted, force-moved, or
used as writable working branches.

Current protected recovery point:

- `qre-author-gold-amplification-base-20260927`
  - tag object SHA: `2d8563155db0607d01d9d819fce0bda67fe755d8`
  - peeled commit SHA: `b342ea7b833b93ccf1b448a486c31283512a50d0`

Existing checkpoint/recovery branches and tags clearly marked as Author
recovery points:

- `author-identity-frozen-2026-09-21` (tag)
- `author-top-food-chain-checkpoint` (tag)
- `qre-author-gold-amplification-base-20260927` (tag)
- `qre-wow-business-author-v1` (tag)
- `backup-author-before-rebase` (branch)
- `backup/author-final-reset-before-sync` (branch)
- `backup/local-author-alignment` (branch)
- `backup/rebuild-author-final-reset` (branch)
- `checkpoint/author-gold-short-pass-20260926` (branch)
- `checkpoint/qre-wow-business-author` (branch)
- `qre/author-gold-forward` (branch)
- `qre/semantic-amplification-lab` (branch)
- `recovery/author-food-chain` (branch)
- `restore-sept6-author` (branch)

Do not modify any of them.

## Controlled Experiments

One architectural variable at a time.

For each Author experiment:

Before:

- state authorized boundary
- state protected boundaries
- git status
- baseline tests

During:

- modify only authorized files/behavior
- no opportunistic cleanup

After:

- git diff --stat
- exact files changed
- model-visible text changed?
- model-call count changed?
- token/temperature/runtime settings changed?
- grounding changed?
- Mouth changed?
- scoring changed?
- tests
- git status

If an After answer unexpectedly becomes yes:

```text
STOP before commit.
```
