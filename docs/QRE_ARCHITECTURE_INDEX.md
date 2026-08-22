# QRE ARCHITECTURE INDEX — CANONICAL

## Purpose

This is the quick-reference map for the QRE cognitive/experience stack. It exists so future work starts from what already exists instead of recreating or duplicating subsystems.

## Runtime ownership

| Layer | What it does | Owns decisions? | Storage? |
|---|---|---:|---:|
| Contracts | Canonical TypeScript shapes shared across packages | No | No |
| Engine cognition | Parses reality, builds world/context, detects significance and patterns | Yes | No |
| IdentityState | Persistent cognitive snapshot of one QRE identity | Represents accumulated state | No |
| CognitiveAuthorContext | Single structured packet sent into authoring | No; carries context | No |
| Super Cog / Author Brain | Chooses what matters, movie trajectory, creative opportunity | Yes | No |
| Mouth | Renders selected grounded text | Only wording | No |
| Provenance Gate | Blocks unsupported reality claims | Yes, enforcement only | No |
| MovieBeatPlan | Chooses exact playable timeline and media order | Yes; single timeline owner | No |
| ExperienceService | Converts the chosen plan into runtime scenes | No competing author decisions | No |
| Player / Runtime | Presents timing, transitions, crop, audio, interaction | Presentation only | No |
| MemoryRepository | Persists identity-scoped entities/facts/relations/events | Persistence only | Yes |
| AnalyticsRepository | Persists behavioral/learning signals | Persistence only | Yes |
| CreativeLearning | Stores explicit/observed creative feedback and autonomous patterns | Feeds future selection | Yes |
| Presence / Geo | Supplies return state, place, time, semantic geo roles | Evidence/context | Yes where applicable |

## File map

### Identity and accumulated world

- `packages/contracts/src/cogauthor/identityState.ts` — canonical IdentityState contract.
- `apps/api/src/services/authorIdentityState.ts` — composes memory, events, presence, analytics, creative learning, traits, preferences, activities, goals, intentions, relationships, recurrence, and context into IdentityState.

### Cognitive author packet

- `packages/contracts/src/cogauthor/cognitiveAuthorContext.ts` — canonical author context contract, including geo, presence, media, provenance, learning, and authoring rules.
- `apps/api/src/services/authorCognitiveContext.ts` — builds the single structured packet consumed by authoring.

### Reality and safety

- `packages/contracts/src/cogauthor/realityProvenance.ts` — author-side provenance permissions/forbidden expansions.
- `apps/api/src/services/authorRealityProvenance.ts` — maps facts into author provenance.
- `apps/api/src/services/authorProvenanceGate.ts` — validates authored output against provenance and user-authorized creative endpoints.

### Domain cognition

- `apps/api/src/services/authorDomainCognition.ts` — universal domain-aware evidence typing, tensions, signatures, and opportunities.
- `apps/api/src/services/authorDomainMovieBridge.ts` — converts domain opportunities into movie operations without creating domain-specific brains.

### Movie authoring

- `apps/api/src/services/authorBrainUniversal.ts` — universal author/Mouth orchestration and movie candidate selection.
- `apps/api/src/services/authorMovieCognition.ts` — fact relationships, trajectory candidates, and the existing genre/lens catalog. Do not create a second lens engine.
- `apps/api/src/services/authorMoviePipeline.ts` — universal author result → MovieBeatPlan.
- `packages/contracts/src/cogauthor/movieBeatPlan.ts` — canonical timeline contract.
- `apps/api/src/services/authorMovieBeatPlan.ts` — deterministic media/timeline organizer.
- `apps/api/src/services/experienceService.ts` — consumes MovieBeatPlan and renders runtime scenes.

### Media bridge

- `packages/contracts/src/media.ts` — shared MediaAsset contract used by runtime/media layers.
- `packages/contracts/src/cogauthor/cognitiveAuthorContext.ts` — media evidence channel for Cognition.
- `apps/api/src/services/authorMediaBridge.ts` — normalizes supplied media, preserves observed timestamps/roles, attaches provenance, and orders evidence chronologically for Cognition/Beat planning.
- `apps/api/author-media-context-acceptance.ts` — proves media normalization, chronology, roles, and provenance attachment.

### Learning and write-back

- `apps/api/src/services/authorLearningLoop.ts` — universal authoring input → memory projection + analytics learning signal.
- `apps/api/src/services/memoryProjection.ts` — converts cognition/world evidence into MemoryWriteBatch.
- `apps/api/src/repositories/memoryRepository.ts` — identity-scoped durable memory persistence; supersedes changed facts and writes audit records.
- `apps/api/src/repositories/analyticsRepository.ts` — durable analytics/event persistence and reporting metrics.
- `apps/api/src/services/creativeLearning.ts` — explicit creative feedback plus autonomous creative learning signals.

### Geo and presence

- `packages/engine/src/geo/geoMemoryLayer.ts` — geographic memory/correlation layer.
- `packages/engine/src/presence/checkIn.ts` — presence/check-in signals.
- `packages/engine/src/runtime/locationRuntime.ts` — runtime location behavior.
- `apps/api/src/repositories/geoMemoryRepository.ts` — API persistence for geographic memory.

## Canonical full loop

```text
USER / GUEST / STAFF INPUT
        ↓
reality typing + provenance
        ↓
Memory / Geo / Presence / Analytics / Creative Learning / Domain Cognition / Media
        ↓
IdentityState
        ↓
CognitiveAuthorContext
        ↓
Super Cog / Universal Author
        ↓
Mouth
        ↓
Provenance Gate
        ↓
MovieBeatPlan  ← ONLY TIMELINE OWNER
        ↓
ExperienceService
        ↓
Player
        ↓
scan / replay / contribution / outcome
        ↓
AuthorLearningLoop
        ↓
MemoryRepository + AnalyticsRepository + CreativeLearning
        ↓
next IdentityState
        ↓
next CognitiveAuthorContext
        ↓
better next experience
```

## Current completion trajectory

**Do these in order. Do not advance to the next layer until the current layer has a passing acceptance.**

### 1. Live media ingestion bridge — PARTIAL

The contract and canonical normalization module now exist. `authorMediaBridge.ts` normalizes supplied media, preserves chronology/role metadata, and attaches provenance. The live `experienceService` hookup is still required.

Required production path:

```text
uploaded / supplied media
→ normalized MediaAsset
→ evidence metadata + chronology + role + provenance
→ CognitiveAuthorContext.media
→ MovieBeatPlan
→ silent media beats
→ Player
```

Acceptance currently proves normalization; the remaining acceptance must prove an actual media item entering the live compile path and becoming a playable silent media beat.

### 2. Live provenance-context bridge — TODO

The live compile path currently provides `provenanceFacts: []` even though the identity layer already has grounded evidence.

Required:

```text
IdentityState / typed evidence
→ AuthorRealityProvenance
→ CognitiveAuthorContext.provenanceFacts
→ Mouth
→ Provenance Gate
```

Acceptance must prove an actual grounded fact carries provenance into the live author call and an unsupported object/place/person remains rejected.

### 3. Universal input-route learning — TODO

`compileExperience` now uses the learning coordinator. Other user/guest/staff input routes must be audited so they cannot bypass the learning hook.

Known bypass to close:

```text
POST /experience/memory/:assetId
```

This route currently writes directly through `MemoryRepository` and must use the same coordinator.

### 4. Post-play outcome learning — TODO

```text
movie
→ scan / replay / completion / abandon / save / CTA / contribution / rejection
→ behavioral + creative signal
→ identity-scoped learning write-back
→ IdentityState
→ CognitiveAuthorContext
→ next MovieBeatPlan
```

Acceptance must prove the next movie materially changes when new evidence/outcomes warrant it.

### 5. Owner/operator reporting — TODO

Expose concise operational signals without forcing end users into a learning dashboard.

Minimum reporting:

- accepted input
- recurring patterns
- meaningful state changes
- creative accept/reject patterns
- replay/completion/friction
- CTA performance when configured
- media contribution counts
- provenance/reality rejects
- current identity confidence

### 6. Genre-fluid Mouth hardening — AFTER ALL ABOVE

The existing lens catalog in `authorMovieCognition.ts` is the foundation. Do not create another lens system.

Target:

```text
REAL FACTS
→ approved meaning / relationship
→ existing lens search
→ candidate realization
→ REALITY GATE
→ MEANING EXECUTION GATE
→ ATTENTION CUT GATE
→ CREATIVE LOCK GATE
→ DIVERSITY GATE
→ BEAM / BEST LINE
```

The lens may change framing, tone, emphasis, implication, and genre. It may not create new factual reality.

## Learning rules

1. Accepted user evidence becomes identity-scoped memory evidence.
2. Learning signals describe behavior/selection; they do not rewrite historical truth.
3. A user's or asset's facts never leak into another identity's context.
4. Changed facts supersede prior active facts instead of silently deleting history.
5. Creative learning affects future selection/style; it does not create factual evidence.
6. Geo and presence are context/evidence, not automatic creative permission.
7. The model cannot convert a missing fact into reality merely because it makes a better story.
8. Explicit user-authorized creative endpoints may be rendered exactly when requested.

## Product behavior rules

- Cognition organizes by default.
- Dashboard is the intentional manual override.
- Photos are first-class silent beats unless source media visibly contains text.
- Five-ish text beats are the default attention unit, not a hard lifetime limit.
- Business CTAs are opt-in; default movies do not become advertisements.
- Story payoff, personality landing, portal action, and business CTA are separate concepts.
- The physical QRE remains the persistent doorway; the digital world accumulates behind it.

## Reporting / observability index

| Signal | Meaning |
|---|---|
| `AUTHOR_INPUT_ACCEPTED` | Authoring input entered the universal learning path and was projected into memory. |
| `AI_CREATIVE_ACCEPTED` | User/system accepted an authored creative result. |
| `AI_CREATIVE_REJECTED` | Authored creative result was rejected; useful for creative avoidance learning. |
| `AI_VARIATION_SELECTED` | A generated variation was selected; useful for style/trajectory learning. |
| `SCAN` | QRE identity was scanned. |
| `FLOW_COMPLETE` | Experience completed. |
| `EXPERIENCE_REPLAY` | Experience was replayed. |
| `CTA_CLICK` | Configured action was activated. |
| `MEMORY_CREATED` | A contribution/memory became accepted durable experience data. |
| `ERROR` | Runtime failure/friction signal. |

## Acceptance map

```text
author:fast               → universal author stability
author:cognitive-context  → context packet completeness
author:media-context      → media normalization + chronology + provenance
author:provenance         → provenance permissions
author:provenance-gate    → reality firewall
author:domain-cognition   → domain evidence/tension layer
author:domain-movie       → domain opportunity → movie bridge
author:movie-beat-plan    → timeline/media planning
author:movie-pipeline     → Mouth → MovieBeatPlan
author:full-circle        → author → timeline → runtime shape
author:learning-loop      → input → memory + analytics + identity isolation
```

## Definition of full circle

```text
USER INPUT
→ Reality / Provenance
→ Memory + Geo + Presence + Analytics + Media
→ IdentityState
→ CognitiveAuthorContext
→ Super Cog
→ Mouth
→ Provenance Gate
→ MovieBeatPlan
→ ExperienceService
→ Player
→ Outcome / New Input
→ Universal Learning Loop
→ stronger IdentityState
→ materially changed next experience
```

This is the finish line before expanding the creative lens universe further.
