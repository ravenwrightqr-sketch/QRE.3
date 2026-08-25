# QRE PRODUCTION TODO · AUTHOR / LEARNING / CLOSED-LOOP

**Status:** ACTIVE PRODUCTION ROADMAP  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-24

This is the working TODO for turning the current connected architecture into a universal, measurable, production Author.

## P0 · Prove the Author actually learns

- [ ] Build a deterministic two-round acceptance: Round 1 creates state + learning evidence; Round 2 recovers both and demonstrates a measurable Author decision change.
- [ ] Make the acceptance expose the exact changed decisions, not only changed diagnostics.
- [ ] Compare Round 1 vs Round 2 on: selected movie family, relation pattern, tempo, attention arc, revisit/callback usage, and Mouth realization behavior.
- [ ] Prove learned preference can change strategy without changing RealityGraph evidence.
- [ ] Add a minimum-confidence rule so weak history cannot oversteer the Author.
- [ ] Add bounded decay / revision so preferences evolve rather than becoming permanent personality labels.

## P0 · Author readout / truth / golden output

- [ ] Build one production Author readout that prints the entire decision chain in compact form: world read → learned profile → movie candidates → selected trajectory → tempo → beat jobs → Mouth output → gates → final scenes.
- [ ] Make readout distinguish source truth from derived interpretation, learned preference, and model realization.
- [ ] Run the readout across multiple subjects and sparse/dense RealityGraphs.
- [ ] Add explicit failure reasons for any empty or partial movie, failed endpoint, weak carry-forward, repetition, or Mouth rejection.
- [ ] Make the readout prove that no hidden planner language reaches viewer-facing scenes.

## P0 · Tempo becomes a real Author primitive

- [ ] Turn behavioral rhythm from a profile number into an explicit tempo decision consumed by trajectory search and beat planning.
- [ ] Define tempo states such as accelerate, hold, tighten, revisit, escalate, release, reopen.
- [ ] Make tempo stateful across the experience, not a one-time label.
- [ ] Let learned preference bias tempo only within evidence-supported bounds.
- [ ] Acceptance-test that the same reality can produce a meaningfully different tempo for two learned profiles without fabricating facts.

## P1 · Close the hidden learning circles

- [ ] Version the behavioral profile inside Author Experience State so learned preference is recoverable as a bounded snapshot as well as recomputable from analytics.
- [ ] Record confidence, evidence count, and last-updated information for each learned dimension.
- [ ] Distinguish stable preference from transient session behavior.
- [ ] Retire stale preferences safely rather than accumulating contradictory signals forever.
- [ ] Add a governed mapping from all analytics classes to learning consumers so every event is explicitly observed, learned, or ignored.

## P1 · World continuity / social graph

- [ ] Test cross-path future threads such as Coco → Jim → apples across multiple experiences.
- [ ] Verify a thread opened in one asset can be discovered later from another related asset when authorized by memory/world relationships.
- [ ] Verify consumed futures retire and become historical evidence.
- [ ] Add tests for unresolved futures that remain live across several chapters.
- [ ] Add tests where two different people/assets independently contribute to the same world relationship.
- [ ] Preserve provenance for every cross-world learned fact.

## P1 · Mouth production quality

- [ ] Create a multi-round Mouth benchmark built from realistic service receipts, events, pet stories, people, places, and social encounters.
- [ ] Score Mouth output on: specificity, attitude, compression, semantic turn, callback, repetition, invention risk, next-beat pull, and endpoint quality.
- [ ] Add tests for bad model behavior already observed: generic filler, question leakage, repeated lines, planner language, physical invention, and endpoint contamination.
- [ ] Prove learned behavior profile changes realization style without changing approved beat semantics.
- [ ] Test multiple local models against the same Author decision boundary without weakening truth gates.

## P1 · Universalization

- [ ] Expand acceptance beyond Coco and Mike/Joe into generic non-pet domains.
- [ ] Include: restaurant, wedding, rave/concert, neighbor, real estate, service receipt, travel/event, friendship, and city-scale connection cases.
- [ ] Include sparse graphs with only facts, dense graphs with many relations, recurring worlds, cross-asset worlds, and no-clock cases.
- [ ] Verify domain-specific language never becomes domain-specific Author logic.
- [ ] Keep all new intelligence inside canonical semantic owners.

## P1 · Full closed-loop runtime test

- [ ] Exercise the actual experience route, not only direct acceptance services.
- [ ] Scan/create → produce experience → play/replay/share/abandon → persist analytics → derive learning → persist state → create next experience.
- [ ] Verify no in-memory-only learning is required for adaptation.
- [ ] Verify the next request can recover everything necessary from persistence.
- [ ] Verify analytics write failures do not silently corrupt Author truth or memory.
- [ ] Verify partial experience failure does not persist a false “completed” state.

## P2 · Production observability

- [ ] Add a single Author diagnostic envelope with IDs connecting experience, state snapshot, learning snapshot, movie candidate, trajectory, Mouth candidate, and final scenes.
- [ ] Make every learning signal traceable to source analytics events.
- [ ] Make every learned profile dimension explainable by counted evidence without exposing internal diagnostics to end users.
- [ ] Add regression snapshots for representative worlds.
- [ ] Add performance budgets for movie search, cognition, Mouth generation, and persistence.

## P2 · Documentation discipline

- [ ] Keep `docs/AUTHOR_ARCHITECTURE_INDEX.md` canonical for ownership and boundaries.
- [ ] Keep `docs/AUTHOR_CURRENT_STATE.md` canonical for what is actually live.
- [ ] Keep `docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md` canonical for runtime/analytics boundaries.
- [ ] Keep focused protocol docs only where they describe a still-live semantic law.
- [ ] Delete superseded “next world”, duplicate goal/master, and monolithic reference documents when their information is absorbed here.
- [ ] Update docs in the same change as architecture changes.

## Golden acceptance target

The production Author is ready when one test can demonstrate:

```text
USER / WORLD
  ↓
REALITY
  ↓
MEMORY + STATE
  ↓
LEARNED PREFERENCES
  ↓
MOVIE SEARCH
  ↓
AUTHOR TRAJECTORY + TEMPO
  ↓
MOUTH
  ↓
TRUTH-SAFE EXPERIENCE
  ↓
OBSERVATION
  ↓
LEARNING
  ↓
NEXT EXPERIENCE IS DIFFERENT FOR A REASON
```

The system must get better at serving the same person without requiring the person to learn how the system works.
