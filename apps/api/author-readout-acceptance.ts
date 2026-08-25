import type { RealityGraph } from "@qre/contracts";

import { buildAuthorBehaviorProfile } from "./src/services/authorBehaviorProfile.js";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";
import { buildAuthorReadout, summarizeAuthorReadout } from "./src/services/authorReadout.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";

function graph(
  labels: string[],
  relations: Array<[number, number, RealityGraph["relations"][number]["kind"], number]>,
  recurringSignals: string[] = [],
  unresolvedTensions: string[] = [],
): RealityGraph {
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
      entities: label.split(/\s+/).slice(0, 4),
      salient: true,
      provenance: "explicit",
    })),
    relations: relations.map(([from, to, kind, strength]) => ({
      from: `event-${from + 1}`,
      to: `event-${to + 1}`,
      kind,
      strength,
    })),
    unresolvedTensions,
    recurringSignals,
    sensorySignals: [],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const reality = graph(
  [
    "nervous arrival",
    "bath completed",
    "blue bow stolen",
    "left looking fabulous",
    "old nervousness mattered differently later",
    "the visit kept coming back to the bow",
  ],
  [
    [0, 1, "changes", 0.82],
    [1, 2, "recontextualizes", 0.86],
    [2, 3, "changes", 0.9],
    [0, 3, "recontextualizes", 0.84],
    [1, 4, "recontextualizes", 0.72],
    [2, 5, "repeats", 0.8],
  ],
  ["blue bow", "nervous"],
  ["what changed between arrival and departure"],
);

const candidates = searchUniversalMovieCandidates({
  graph: reality,
  lens: "funny",
  limit: 8,
});

assert(candidates.length >= 2, "readout requires competing movie candidates");

const selectedMovie = candidates[0];
assert(Boolean(selectedMovie), "readout requires selected movie");

const state = buildAuthorExperienceState({
  graph: reality,
  movie: selectedMovie,
  lens: "funny",
  memoryContext: ["prior tempo: revisit", "carry: blue bow"],
  round: 2,
});

const learnedProfile = buildAuthorBehaviorProfile([
  "accepted: short punchy attitude",
  "accepted: callback",
  "accepted: surprise",
  "behavior-preference: revisit continuity",
  "prior tempo: revisit",
  "engagement:1",
  "friction:0",
]);

const readout = buildAuthorReadout({
  experienceId: "readout-test-1",
  assetId: "asset-coco",
  subject: "Coco",
  round: 2,
  graph: reality,
  learnedProfile,
  movieCandidates: candidates,
  selectedMovie,
  experienceState: state,
  mouthLines: [
    "The nerves showed up first. The bow had other plans.",
    "By the time fabulous arrived, it was wearing blue.",
  ],
  finalScenes: [
    "The nerves showed up first. The bow had other plans.",
    "By the time fabulous arrived, it was wearing blue.",
  ],
});

assert(readout.version === 1, "readout version missing");
assert(readout.sourceTruth.eventCount === reality.events.length, "source truth event count mismatch");
assert(readout.movieSearch.candidateCount === candidates.length, "candidate count mismatch");
assert(readout.movieSearch.selected?.id === selectedMovie.id, "selected movie mismatch");
assert(readout.experienceState?.tempo.mode === state.tempo.mode, "tempo mismatch");
assert(readout.realization.mouthLines.length === 2, "mouth readout missing lines");
assert(readout.realization.finalScenes.length === 2, "scene readout missing scenes");
assert(readout.invariants.truthPreserved, "truth invariant failed");
assert(readout.invariants.learnedPreferenceOnly, "learning boundary failed");
assert(readout.invariants.movieSelectedBeforeMouth, "movie-before-mouth invariant failed");
assert(readout.invariants.noPlannerLanguage, "planner language leaked into mouth readout");
assert(readout.invariants.noPartialSuccess, "readout contains failed gate");

console.log("AUTHOR READOUT ACCEPTANCE: PASS");
console.log(`Candidates=${readout.movieSearch.candidateCount}`);
console.log(`Selected=${readout.movieSearch.selected?.id ?? "none"}`);
console.log(`Tempo=${readout.experienceState?.tempo.mode ?? "none"}`);
console.log(`Continuation=${readout.experienceState?.continuationValue ?? 0}`);
console.log(`Lookahead=${readout.experienceState?.lookaheadValue ?? 0}`);
console.log(`LearningConfidence=${readout.learnedProfile.confidence}`);
console.log(`Gates=${readout.gates.filter((gate) => gate.passed).length}/${readout.gates.length}`);

for (const line of summarizeAuthorReadout(readout)) {
  console.log(line);
}
