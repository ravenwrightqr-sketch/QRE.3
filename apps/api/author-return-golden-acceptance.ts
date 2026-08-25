import type { AuthorExperienceState, RealityGraph } from "@qre/contracts";
import { buildAuthorBehaviorProfile } from "./src/services/authorBehaviorProfile.js";
import { adaptAuthorExperienceState } from "./src/services/authorAdaptiveTempo.js";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function graph(): RealityGraph {
  const labels = [
    "nervous arrival",
    "bath completed",
    "blue bow stolen",
    "left looking fabulous",
    "old nervousness mattered differently later",
    "the visit kept coming back to the bow",
  ];

  return {
    evidence: labels.map((text, index) => ({
      id: `evidence-${index + 1}`,
      text,
      kind: "fact",
    })),
    events: labels.map((label, index) => ({
      id: `event-${index + 1}`,
      label,
      sourceIds: [`evidence-${index + 1}`],
      entities: label.split(/\s+/),
      salient: true,
      provenance: "explicit",
    })),
    relations: [
      { from: "event-1", to: "event-2", kind: "changes", strength: 0.82 },
      { from: "event-2", to: "event-3", kind: "recontextualizes", strength: 0.86 },
      { from: "event-3", to: "event-4", kind: "changes", strength: 0.90 },
      { from: "event-1", to: "event-4", kind: "recontextualizes", strength: 0.84 },
      { from: "event-2", to: "event-5", kind: "recontextualizes", strength: 0.72 },
      { from: "event-3", to: "event-6", kind: "repeats", strength: 0.80 },
    ],
    unresolvedTensions: ["what changed between arrival and departure"],
    recurringSignals: ["blue bow", "nervous"],
    sensorySignals: [],
  };
}

const reality = graph();
const realitySnapshot = JSON.stringify(reality);
const candidates = searchUniversalMovieCandidates({ graph: reality, lens: "funny", limit: 8 });
assert(candidates.length >= 2, "return golden requires competing universal movie candidates");

const movie = candidates[0];
assert(Boolean(movie), "return golden requires a selected movie");

const round1State = buildAuthorExperienceState({
  graph: reality,
  movie,
  lens: "funny",
  memoryContext: [],
  round: 1,
});

const round1 = adaptAuthorExperienceState(
  round1State,
  buildAuthorBehaviorProfile([]),
);

const round2Profile = buildAuthorBehaviorProfile([
  "accepted: short punchy attitude",
  "accepted: callback",
  "accepted: surprise",
  "behavior-preference: revisit continuity",
  "behavior-preference: early hit",
  "prior tempo: revisit",
  "engagement:1",
  "friction:0",
  "replay:true",
]);

const round2StateBase = buildAuthorExperienceState({
  graph: reality,
  movie,
  lens: "funny",
  memoryContext: [
    ...round1.memoryHooks,
    "revisit:event-1",
    "revisit:event-2",
    "carry:blue bow",
  ],
  priorExperienceStates: [round1],
  round: 2,
});

const round2 = adaptAuthorExperienceState(round2StateBase, round2Profile);

const round3Profile = buildAuthorBehaviorProfile([
  "accepted: short punchy attitude",
  "accepted: short punchy callback",
  "accepted: surprise reframe",
  "accepted: meaningful callback",
  "behavior-preference: revisit continuity",
  "behavior-preference: accelerate after setup",
  "prior tempo: revisit",
  "prior tempo: accelerate",
  "engagement:1",
  "friction:0",
  "replay:true",
  "replay:true",
]);

const round3StateBase = buildAuthorExperienceState({
  graph: reality,
  movie,
  lens: "funny",
  memoryContext: [
    ...round2.memoryHooks,
    "revisit:event-3",
    "revisit:event-4",
    "future:event-6",
    "carry:blue bow",
  ],
  priorExperienceStates: [round1, round2],
  round: 3,
});

const round3 = adaptAuthorExperienceState(round3StateBase, round3Profile);

assert(JSON.stringify(reality) === realitySnapshot, "source reality changed across rounds");
assert(round2Profile.confidence > 0, "round 2 did not learn any preference");
assert(round3Profile.confidence >= round2Profile.confidence, "learned confidence regressed unexpectedly");
assert(round2.memoryHooks.some((hook) => hook.startsWith("learned:")), "round 2 did not persist learned hooks");
assert(round3.memoryHooks.some((hook) => hook.startsWith("learned:")), "round 3 lost learned hooks");
assert(round3.tempo.nextBeatPull !== round1.tempo.nextBeatPull, "returning state did not change beat pull");
assert(
  round3.tempo.compression !== round1.tempo.compression ||
    round3.tempo.revealSpacing !== round1.tempo.revealSpacing ||
    round3.tempo.holdPressure !== round1.tempo.holdPressure ||
    round3.tempo.urgency !== round1.tempo.urgency,
  "returning state did not change tempo shape",
);
assert(round3.revisitedEventIds.length >= round1.revisitedEventIds.length, "revisit memory did not accumulate");
assert(round3.memoryHooks.some((hook) => hook.includes("adapted-tempo:")), "adaptive tempo decision was not persisted");
assert(round3.selectedMovieId === movie.id, "selected movie identity drifted unexpectedly");

console.log("AUTHOR RETURN GOLDEN ACCEPTANCE: PASS");
console.log(`RealityEvents=${reality.events.length}`);
console.log(`Movie=${movie.id}`);
console.log(`Round1Tempo=${round1.tempo.mode}`);
console.log(`Round2Tempo=${round2.tempo.mode}`);
console.log(`Round3Tempo=${round3.tempo.mode}`);
console.log(`Round1Pull=${round1.tempo.nextBeatPull}`);
console.log(`Round2Pull=${round2.tempo.nextBeatPull}`);
console.log(`Round3Pull=${round3.tempo.nextBeatPull}`);
console.log(`Round1Compression=${round1.tempo.compression}`);
console.log(`Round2Compression=${round2.tempo.compression}`);
console.log(`Round3Compression=${round3.tempo.compression}`);
console.log(`Round2Confidence=${round2Profile.confidence}`);
console.log(`Round3Confidence=${round3Profile.confidence}`);
console.log(`Round3Revisits=${round3.revisitedEventIds.length}`);
console.log(`Round3Hooks=${round3.memoryHooks.length}`);
console.log("TRUTH_INVARIANT=UNCHANGED");
