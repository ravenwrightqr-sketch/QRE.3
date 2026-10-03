# QRE AUTHOR · FINISH ROADMAP

**Status:** active finish list
**Branch:** `fuck-you-bitch-is-awake`
**Updated:** 2026-10-03

This roadmap starts from checkpoint `83e45219` plus the canonical doctrine in `AUTHOR_CURRENT.md`.

## P0 · Unify Identity

Goal: Identity keeps its subject/context semantics but stops using the older `variantsByBeat` + local selector as a separate writing topology.

Current source state: Identity now enters the shared production-major Mouth contract and whole-production selection path while retaining Identity-specific semantic inputs. Isolated Milo Identity live validation proved the topology. Follow-up refinement: the supplied Identity subject name is authorized identity material for optional rhetorical anchoring, without widening factual authority.

Do:
- move Identity onto the same production-major Author writing/selection architecture used by Memory where appropriate
- retain Identity-specific subject, durable context, permissions, provenance, and world truth
- keep Identity capable of character synthesis and rhetorical POV
- compare Milo Identity against Milo Memory and canonical non-Identity cases
- add deterministic regression coverage so Identity cannot silently regress to list-like fact coverage

Do not:
- make Identity a special creative prompt island
- lose persistent subject/world context
- weaken grounding
- force Identity into Memory-specific semantics that do not apply

## P0 · Preserve creative treatment through the full stack

Goal: a discovered rhetorical world/stance survives synthesis and selection unless truth requires rejection.

Current protection: `protectedExpressiveRealizations` preserves strong authorized expressive material.

Next:
- make treatment/stance preservation explicit at the universal level, not tied to one phrase
- verify later stages preserve GAME/SPY/NOIR/COURTROOM/etc. rhetorical framing when it is grounded
- test that factual setup is added only when it strengthens the treatment
- verify no hardcoded service/domain mappings are required

Target law:

> Transform the rhetorical world, never the factual world.

## P0 · Deterministic AUTO treatment selection

Goal: creator does not need to choose a lens for ordinary use.

Target:

```text
input reality
  -> eligible treatment candidates
  -> deterministic selection under stable rules
  -> A/B/C production search under that pressure
  -> grounding
  -> preserved treatment through synthesis
```

Requirements:
- default `AUTO`
- optional future creator override (`GAME`, `SPY`, `NOIR`, etc.)
- requested treatment may not invent evidence
- incompatible requested treatment should lighten/fallback, not fabricate
- no domain lookup table as the creative engine

## P1 · ExperiencePlayout / SequenceComposer

Goal: separate Author semantics from phone presentation.

Current source state: v2 text reveal splitting is implemented. One final grounded Author scene becomes one or more deterministic TEXT Playout items with provenance. Timing, IMAGE, VIDEO, frontend rendering, and analytics remain future work.

Input:
- final Author beats
- source provenance
- supplied media metadata
- optional timing/pacing preferences

Output:
- ordered presentation items

Initial item kinds:
- `TEXT`
- `IMAGE`
- `VIDEO`

Core law:

```text
Author beat count != viewer reveal count
```

A multi-sentence Author beat may become multiple timed text reveals without changing Author semantics.

## P1 · Media composition

Goal: user-uploaded media becomes part of the experience timeline without forcing Author to write less.

Rules:
- supplied image/video is provenance-bearing presentation material
- one image may become one visual beat by default, but is not guaranteed screen time
- media attaches to the event/context it actually documents
- Playout decides placement around text reveals
- media cannot imply unsupported events
- adding media does not reduce Author sequence length mechanically

Example:

```text
TEXT
TEXT
IMAGE (before)
TEXT
TEXT
IMAGE (after)
TEXT
```

## P1 · Timing / phone playback

Start with readable tendencies, not hard constants.

- short text may need ~1–2 seconds
- longer text may need more
- images may need more than text
- pauses can be explicit presentation decisions
- reveal timing belongs to Playout/frontend, not Author cognition

Do not put animation vocabulary back into Author prompts.

## P1 · Validation expansion

Keep canonical cases:
- Coco
- Coco blind
- Housekeeping/service receipt
- Relationship/memory
- Milo Memory
- Milo Identity
- Real estate House

Add once treatment selection is ready:
- moving service with possible spy/heist treatment
- restaurant/service receipt
- wedding/event memory
- travel/city experience
- repair/service call
- sparse one-observation input
- dense multi-event input

Every test should distinguish:
- Author failure
- grounding failure
- selection/flattening failure
- Playout failure
- infrastructure invalid (429/provider/etc.)

## P1 · Diagnostics

Capture enough to reconstruct why an experience won:
- provider/model
- source commit
- flags
- raw A/B/C
- authority/auditor results
- authorized pool
- protected expressive realizations
- assembler
- synthesizer
- eligibility
- winner
- canonical grounding
- final Author beats
- final Playout reveals once implemented

## Parked until the above is stable

- broad learning/autonomous preference refactors
- global scorer rewrites without evidence
- camera-rule redesign
- domain-specific Author modules
- hardcoded favorite phrases
- weakening truth gates to increase creativity
- frontend/media logic inside Author

## Immediate order

1. Identity unification.
2. Universal treatment/stance preservation verification.
3. AUTO treatment selection.
4. Lock another checkpoint.
5. Build `ExperiencePlayout` / `SequenceComposer` v1 text transport. Done.
6. Add sentence-by-sentence reveal behavior. Done for deterministic text reveals.
7. Add IMAGE/VIDEO timeline items.
8. Tune timing and phone UX.
9. Re-run cross-domain acceptance end to end.
