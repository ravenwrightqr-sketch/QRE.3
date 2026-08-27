# QRE Author Trajectory

## Law

**QRE may surprise us.**

Guardrails protect truth, provenance, architecture, and safety. They do not become a stylistic cage. A brilliant grounded cut may win even when it breaks a preference. Style is scored, not written in stone.

**Universality law:** examples teach the shape of behavior; they are never domain rules. Do not hard-code a subject, industry, prop, color, place, stock phrase, or one-off example merely because it exposed an edge case. Every new rule must generalize across subjects, contexts, and future supplied material. Prefer fewer, stronger principles over exception piles.

## Canonical production trajectory

`SOURCE REALITY → REALITY GRAPH → COGNITION → MOVIE / TRAJECTORY → GROUNDED CUTS → MOUTH REALIZATION → CREATIVE/TRUTH GATING → FINAL SEQUENCE → PLAYER`

## Architectural ownership

- `authorBrainCanonical.ts` is the canonical creative orchestrator.
- `authorRealityGraph.ts` owns explicit source reality structure.
- `authorCognition.ts` owns cognitive interpretation and attention/movie planning.
- `authorUniversalMovieSearch.ts` owns universal trajectory discovery.
- `authorMouthCandidateSearch.ts` owns viewer-facing language candidates and source provenance.
- `authorMouthInterpretation.ts` distinguishes source grounding, creative framing, and unsupported concrete invention.
- `authorMouthSequenceBeamSearch.ts` selects the strongest connected candidate sequence.
- `authorAttentionEditor.ts` and `authorSequenceArcGate.ts` gate sequence quality.
- `localModelRuntime.ts` supplies model language realization; it does not own QRE reality.
- `experienceService.ts` is a production adapter only: it supplies context, calls the canonical Author once, and projects/persists the result.
- `memoryProjection.ts` persists `RealityGraph` data using contracts-only types.
- `experienceCreationServices.ts` is the persistence boundary and refuses rejected/non-renderable canonical Author output.

## Hard boundaries

1. No unsupported consequential world event may be smuggled into a viewer cut.
2. Every renderable cut must retain source provenance.
3. Planner metadata is never promoted into source truth.
4. Legacy creative paths must not be reachable from production Author wiring.
5. Model choice may vary; QRE architecture may not drift with the model.
6. API persistence projections must not depend on engine-internal cognition types.
7. Experience creation must consume one canonical Author result, not compose a second creative pass.
8. Memory interpretation endpoints may record reality without silently invoking creative authoring.

## Creative doctrine

- Literal facts are safe but do not automatically win.
- Grounded interpretation can be stronger than literal restatement.
- Cross-fact meaning is allowed when the supplied corpus supports it.
- A creative line may be fragmentary, compressed, odd, funny, sharp, emotional, strange, or longer when the realization earns it.
- Attitude is first-class: rhetorical framing, status play, mock authority, absurdity, melodrama, irony, confidence, menace, comedy, and other posture can be invented as framing without becoming source facts.
- Supplied preferences, actions, relationships, states, details, and other collected material may be amplified, compressed, connected, repeated, or reframed when the resulting claim remains grounded.
- A short action fragment may compress an explicitly supplied action; compression itself does not create a new occurrence.
- The creative target is the minimum reality commitment that produces the maximum viewer reward.
- **Do not hard-code the example. Generalize the behavior.**

## Recorded moves

### 2026-08-26 — Canonical Author convergence

- Established `authorBrainCanonical.ts` as the production creative orchestrator.
- Removed the old API `authorBrainUniversal.ts` Master Author.
- Removed `author-acceptance-suite.ts`, which directly exercised the obsolete Master Author.
- Removed the obsolete `cinematicAuthor.ts` adapter from the production Author path.
- Removed the obsolete sequence patch script used for repeated fragile text patching.
- Tightened Mouth provenance so only real event IDs resolve to source labels; planner `setsUp` / `paysOff` metadata cannot become source truth.
- Added whole-source creative interpretation support so candidates can derive meaning across supplied facts.
- Added bounded creative-bet evaluation: grounded creative interpretation may survive low literal overlap; unsupported concrete world events remain unsafe.
- Aligned the sequence selector so semantic quality and sequence fit contribute to ranking instead of literal grounding alone.
- Added a deterministic creative-bet acceptance test covering grounded interpretation, cross-fact framing, literal source, invented actions, and invented body actions.
- Added architecture/wiring guards that reject the legacy Author paths and require the canonical production path.

### 2026-08-26 — Production reachability convergence

- Replaced `experienceService.ts` so the production compile path invokes `authorBrainCanonical` exactly once.
- Removed legacy `compileCognitiveExperience`, production `authorMicroBeats`, and the duplicate movie-search pass from the production compile path.
- Changed Author-state provenance from `qre-universal-author` to `qre-author-canonical`.
- Reworked `/experience/memory/:assetId` writes to build deterministic `RealityGraph` memory facts instead of invoking the legacy cognitive compiler.
- Replaced the API memory projection dependency on engine `WorldModel` with the contracts-owned `RealityGraph` type.
- Changed experience creation to require an accepted, renderable, complete canonical Author result and to identify the author from canonical metadata.
- Added `scripts/verify-author-reachability.mjs` and wired it into the root `author:guard` / build path.

### 2026-08-26 — Expressive cut spectrum

- Added a deterministic cut-spectrum acceptance harness proving that one-word cuts, preference-to-inner-framing, cross-fact compression, grounded action fragments, and high-attitude framing are valid creative lanes.
- Added rejection coverage for unsupported physical events and unsupported location events.
- Added rejection coverage for inferred sensory and movement scenes that introduce unsupplied concrete situations.
- Expanded the interpretation boundary so creative attitude can be strong without weakening concrete-world provenance.
- Removed example-specific prop/color/scenery acceptance logic after observing that it was overfitting the proof harness.
- Reframed the Mouth policy around universal behavioral principles: use collected reality, maximize creative expression inside it, and guard unsupported concrete claims rather than enumerating forbidden domains.
- Replaced example-specific prop/color/scenery rules with a universal language-level distinction between creative framing and unsupported concrete world assertions.

## Current cleanup rule

Do not revive deleted Author generations or create parallel creative adapters. When a new capability is needed, extend the canonical path or replace a canonical component deliberately, then record the move here before continuing.

Before adding a new rule, ask: **is this a universal principle, or are we hard-coding the example that happened to reveal it?** If it is the latter, do not add it. Generalize instead.
