# QRE PRODUCTION TODO · AUTHOR / LEARNING / CLOSED-LOOP

**Status:** ACTIVE PRODUCTION ROADMAP  
**Branch:** `author/mouth-production-product-final`  
**Updated:** 2026-08-25

This is the working TODO for turning the current connected architecture into a universal, measurable, production Author.

## P0 · Prove the Author actually learns

- [x] Build a deterministic two-round acceptance: Round 1 creates state + learning evidence; Round 2 recovers both and demonstrates a measurable Author decision change.
- [ ] Make the acceptance expose the exact changed decisions, not only changed diagnostics.
- [ ] Compare Round 1 vs Round 2 on: selected movie family, relation pattern, tempo, attention arc, revisit/callback usage, and Mouth realization behavior.
- [x] Prove learned preference can change strategy without changing RealityGraph evidence.
- [ ] Add a minimum-confidence rule so weak history cannot oversteer the Author.
- [ ] Add bounded decay / revision so preferences evolve rather than becoming permanent personality labels.
- [ ] Run the new three-round return-golden acceptance against the local production stack and promote it to a required production gate.
- [ ] Expand the return-golden acceptance so the actual runtime route persists and recovers state between visits rather than simulating persistence in-process.

## P0 · Author readout / truth / golden output

- [x] Build one production Author readout that prints the entire decision chain in compact form: world read → learned profile → movie candidates → selected trajectory → tempo → beat jobs/state → Mouth output → gates → final scenes.
- [x] Make readout distinguish source truth from derived interpretation, learned preference, and model realization.
- [ ] Run the readout across multiple subjects and sparse/dense RealityGraphs.
- [x] Add explicit failure reasons for any empty or partial movie, failed endpoint, weak carry-forward, repetition, or Mouth rejection where those boundaries are already available to the readout.
- [x] Make the readout prove that no hidden planner language reaches viewer-facing scenes.
- [ ] Wire readout IDs into a durable production diagnostic envelope so a single experience can be traced across state, learning, movie, Mouth, gates, and final scenes.

## P0 · Tempo becomes a real Author primitive

- [x] Turn behavioral rhythm from a profile number into an explicit tempo decision consumed by trajectory/state adaptation.
- [x] Define tempo states such as accelerate, hold, tighten, revisit, release, reopen.
- [x] Make tempo stateful across the experience, not a one-time label.
- [x] Let learned preference bias tempo only within evidence-supported bounds.
- [x] Acceptance-test that the same reality can produce a meaningfully different tempo shape for two learned profiles without fabricating facts.
- [ ] Feed learned tempo back into trajectory search and beat planning so preference changes not only state metrics but the selected semantic route when multiple truth-safe candidates exist.

## P1 · Close the hidden learning circles

- [ ] Version the behavioral profile inside Author Experience State so learned preference is recoverable as a bounded snapshot as well as recomputable from analytics.
- [ ] Record confidence, evidence count, and last-updated information for each learned dimension.
- [ ] Distinguish stable preference from transient session behavior.
- [ ] Retire stale preferences safely rather than accumulating contradictory signals forever.
- [x] Add a governed mapping from all analytics classes to learning consumers so every event is explicitly observed, learned, or ignored.

## P1 · World continuity / social graph

- [ ] Test cross-path future threads such as Coco → Jim → apples across multiple experiences.
- [ ] Verify a thread opened in one asset can be discovered later from another related asset when authorized by memory/world relationships.
- [x] Verify consumed futures retire and become historical evidence.
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

- [x] Keep `docs/AUTHOR_ARCHITECTURE_INDEX.md` canonical for ownership and boundaries.
- [x] Keep `docs/AUTHOR_CURRENT_STATE.md` canonical for what is actually live.
- [x] Keep `docs/RUNTIME_AND_ANALYTICS_CURRENT_STATE.md` canonical for runtime/analytics boundaries.
- [ ] Keep focused protocol docs only where they describe a still-live semantic law.
- [x] Delete superseded “next world”, duplicate goal/master, and monolithic reference documents when their information is absorbed here.
- [x] Update docs in the same change as architecture changes.

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

The current three-round `author-return-golden-acceptance.ts` proves the deterministic semantic/adaptation core. The remaining production step is to run that same proof through the real persistence/runtime path.

The system must get better at serving the same person without requiring the person to learn how the system works.


And this is actually a useful architectural discovery: your repo currently has database configuration nested under packages/db, while Prisma commands are being run from the workspace root. We should eventually make the DB tooling invocation consistently load the canonical DB environment rather than relying on us manually setting it. That belongs on the production-hardening TODO after we get this runtime proof green.