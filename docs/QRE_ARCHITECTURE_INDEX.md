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

- `packages/contracts/src/cogauthor/cognitiveAuthorContext.ts` — canonical author context contract.
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
- `apps/api/src/services/authorMoviePipeline.ts` — universal author result → MovieBeatPlan.
- `packages/contracts/src/cogauthor/movieBeatPlan.ts` — canonical timeline contract.
- `apps/api/src/services/authorMovieBeatPlan.ts` — deterministic media/timeline organizer.
- `apps/api/src/services/experienceService.ts` — consumes MovieBeatPlan and renders runtime scenes.

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
MemoryRepository + AnalyticsRepository
        ↓
next IdentityState
        ↓
next CognitiveAuthorContext
        ↓
better next experience
```

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

The fastest signals to inspect when debugging or advancing the beast are:

| Signal | Meaning |
|---|---|
| `AUTHOR_INPUT_ACCEPTED` | Authoring input was accepted into the learning loop and projected into memory. |
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

author:provenance         → provenance permissions

author:provenance-gate    → reality firewall

author:domain-cognition   → domain evidence/tension layer

author:domain-movie       → domain opportunity → movie bridge

author:movie-beat-plan    → timeline/media planning

author:movie-pipeline     → Mouth → MovieBeatPlan

author:full-circle        → author → timeline → runtime shape

author:learning-loop      → input → memory + analytics + identity isolation
```

## Current advancement target

The immediate goal after the author stack is green is to prove a two-pass adaptive loop:

```text
Input A → Movie A
Input B → persisted learning/memory
        → rebuilt IdentityState
        → rebuilt CognitiveAuthorContext
        → Movie B materially changes because of B
```

That acceptance is the proof that QRE is not merely storing information; it is using accumulated reality to improve the next experience.
