# QRE COMPLETION TRAJECTORY — CANONICAL

## Rule

Do not add another brain, timeline owner, persistence system, or lens system while a lower-level bridge is still incomplete.

Finish the existing architecture in dependency order. Every bridge gets an acceptance test and an entry in `QRE_ARCHITECTURE_INDEX.md`.

## Current architecture status

### GREEN — already wired and acceptance-covered

- Contracts → canonical shared shapes.
- IdentityState → accumulated identity/world snapshot.
- CognitiveAuthorContext → single structured author packet.
- Geo → semantic place/time context.
- Presence → return/visit context.
- Analytics → behavioral signals supplied to cognition.
- Creative learning → accepted/rejected patterns and creative preferences.
- Domain cognition → typed opportunities/tensions without domain-specific brains.
- Provenance contract → permissions/forbidden expansions.
- Provenance gate → grounded output firewall.
- Universal author / Mouth → author selection and grounded realization.
- MovieBeatPlan → single timeline owner.
- Author Movie Pipeline → author result → MovieBeatPlan.
- ExperienceService → renders MovieBeatPlan into runtime scenes.
- Author input learning → memory projection + `AUTHOR_INPUT_ACCEPTED` signal.
- Identity-scoped learning acceptance → new evidence reaches the next CognitiveAuthorContext and does not leak across identities.
- Live media ingestion → existing Knowledge image evidence reaches `CognitiveAuthorContext.media` through the canonical media source/bridge.

## REQUIRED BEFORE CREATIVE-LENS EXPANSION

### 1. Live media ingestion bridge — GREEN

The existing media abstraction is now wired through the real compile path.

Production path:

```text
existing Knowledge image evidence
→ `authorMediaSource`
→ `authorMediaBridge`
→ `CognitiveAuthorContext.media`
→ `authorMoviePipeline`
→ `MovieBeatPlan`
→ silent photo beat
→ Player
```

The source adapter reads the existing `Insight(type=KNOWLEDGE)` representation. No second media repository was introduced. `MediaAsset` remains the canonical cross-layer media shape.

Validation:

```powershell
pnpm --filter @qre/api author:media-context
pnpm --filter @qre/api author:live-media-bridge
```

The live acceptance injects media at the production seam and verifies the returned canonical author context, chronology/provenance, and silent-photo contract.

### 2. Live provenance-context bridge

Current production author context still constructs `provenanceFacts: []` in `experienceService`.

Required production path:

```text
IdentityState / typed evidence
→ AuthorRealityProvenance
→ CognitiveAuthorContext.provenanceFacts
→ Mouth
→ Provenance Gate
```

Acceptance must prove an actual grounded fact carries provenance into the live author call and an unsupported object/place/person remains rejected.

### 3. Universal input-path learning

`compileExperience` now uses `AuthorLearningLoop`, but not every input route is yet normalized through it.

Known bypass to close:

```text
POST /experience/memory/:assetId
```

This route currently writes directly through `MemoryRepository` and must use the same learning coordinator so direct memory updates also produce the learning signal and feed the next IdentityState.

Audit every other route that accepts user/guest/staff reality and ensure it follows the same rule.

### 4. Post-play outcome learning

Required path:

```text
movie plays
→ scan / replay / completion / abandon / save / CTA / contribution / rejection
→ behavioral + creative learning
→ identity-scoped write-back
→ next IdentityState
→ next CognitiveAuthorContext
→ materially different next MovieBeatPlan when evidence warrants it
```

Acceptance must prove Input A → Movie A → Outcome/Input B → Movie B changes because of the new world evidence.

### 5. Reporting to owner/operator

Expose a concise operational learning report without creating a learning dashboard requirement for end users.

Minimum signals:

- new evidence accepted
- recurring patterns discovered
- meaningful state changes
- creative patterns accepted/rejected
- replay/completion/friction
- CTA performance when configured
- media contribution counts
- provenance/reality rejects
- current identity confidence

## AFTER THE BRIDGES ARE GREEN: CREATIVE LENS HARDENING

The lens catalog already exists in `authorMovieCognition`.

Do not create a second lens engine.

Harden the existing pipeline in this order:

```text
REAL FACTS
→ reality typing
→ approved meaning / relationship
→ existing lens search
→ candidate realization
→ reality gate
→ meaning execution gate
→ attention-cut gate
→ creative-lock gate
→ diversity gate
→ beam / best line
```

Default fallback remains an emergency safety rail, not the preferred winner.

For middle beats, ranking should favor:

- attention change
- forward pull
- next-need
- semantic execution
- creative distinctiveness
- provenance safety

Lens freedom may change framing, tone, emphasis, implication, and genre. It may not create a new person, place, object, body detail, relationship, literal event, dialogue, or chronology.

## DRIFT RULES

1. One universal brain.
2. One canonical author context.
3. One timeline owner: `MovieBeatPlan`.
4. One durable memory truth layer: `MemoryRepository`.
5. One learning coordinator for accepted input and outcomes.
6. No direct input-route writes that bypass learning unless explicitly documented as infrastructure-only.
7. No second lens engine.
8. No generated text attached to photo beats by default.
9. No business CTA unless explicitly configured/entitled.
10. Learning changes future selection; it never silently rewrites historical reality.
11. Dashboard manual ordering is an override, not a second source of historical truth.
12. Every new bridge gets an acceptance test and an architecture-index entry.
13. Media storage can evolve independently of authoring because the author boundary is `MediaAsset` / `CognitiveAuthorMedia`, not the persistence representation.

## Definition of "full circle"

QRE is not considered fully adaptive until this passes:

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

That is the finish line before expanding the creative universe further.
