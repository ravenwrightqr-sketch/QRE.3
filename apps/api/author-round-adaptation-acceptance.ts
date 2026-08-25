import type { AuthorExperienceState, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { adaptAuthorExperienceState } from "./src/services/authorAdaptiveTempo.js";
import { buildAuthorBehaviorProfile, type AuthorBehaviorProfile } from "./src/services/authorBehaviorProfile.js";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function graph(): RealityGraph {
  const labels = [
    "nervous arrival",
    "bath completed",
    "pink bows came next",
    "mirror approved",
    "fabulous",
    "peace is temporary",
  ];

  return {
    evidence: labels.map((text, index) => ({ id: `evidence-${index + 1}`, text, kind: "fact" })),
    events: labels.map((label, index) => ({
      id: `event-${index + 1}`,
      label,
      sourceIds: [`evidence-${index + 1}`],
      entities: label.split(/\s+/),
      salient: true,
      provenance: "explicit",
    })),
    relations: [
      { from: "event-1", to: "event-2", kind: "changes", strength: 0.84 },
      { from: "event-2", to: "event-3", kind: "after", strength: 0.82 },
      { from: "event-3", to: "event-4", kind: "recontextualizes", strength: 0.86 },
      { from: "event-4", to: "event-5", kind: "changes", strength: 0.88 },
      { from: "event-5", to: "event-6", kind: "contrasts", strength: 0.9 },
      { from: "event-3", to: "event-6", kind: "repeats", strength: 0.78 },
    ],
    unresolvedTensions: ["peace is temporary"],
    recurringSignals: ["pink bows", "fabulous"],
    sensorySignals: [],
  };
}

const reality = graph();
const candidates = searchUniversalMovieCandidates({ graph: reality, lens: "funny", limit: 8 });
assert(candidates.length >= 2, "adaptation requires competing movie candidates");

const movie: LatentMovieCandidate = candidates[0];
const baseState = buildAuthorExperienceState({
  graph: reality,
  movie,
  lens: "funny",
  memoryContext: ["carry: pink bows", "prior tempo: hold"],
  round: 2,
});

const neutral: AuthorBehaviorProfile = buildAuthorBehaviorProfile([]);
const learned = buildAuthorBehaviorProfile([
  "accepted: short punchy attitude",
  "accepted: callback",
  "accepted: surprise",
  "behavior-preference: revisit continuity",
  "behavior-preference: early hit",
  "prior tempo: accelerate",
  "engagement:1",
  "friction:0",
  "replay:true",
]);

const neutralState: AuthorExperienceState = adaptAuthorExperienceState(baseState, neutral);
const learnedState: AuthorExperienceState = adaptAuthorExperienceState(baseState, learned);

assert(learned.confidence > neutral.confidence, "learned profile confidence did not increase");
assert(learnedState.memoryHooks.some((hook) => hook.startsWith("learned:callback:")), "learned callback state was not persisted");
assert(learnedState.tempo.nextBeatPull !== neutralState.tempo.nextBeatPull, "learned preference did not alter next beat pull");
assert(
  learnedState.tempo.compression !== neutralState.tempo.compression ||
    learnedState.tempo.revealSpacing !== neutralState.tempo.revealSpacing ||
    learnedState.tempo.holdPressure !== neutralState.tempo.holdPressure,
  "learned preference did not alter tempo shape",
);
assert(JSON.stringify(reality) === JSON.stringify(graph()), "adaptation changed source reality");

console.log("AUTHOR ROUND ADAPTATION ACCEPTANCE: PASS");
console.log(`RealityEvents=${reality.events.length}`);
console.log(`NeutralTempo=${neutralState.tempo.mode}`);
console.log(`LearnedTempo=${learnedState.tempo.mode}`);
console.log(`NeutralPull=${neutralState.tempo.nextBeatPull}`);
console.log(`LearnedPull=${learnedState.tempo.nextBeatPull}`);
console.log(`NeutralCompression=${neutralState.tempo.compression}`);
console.log(`LearnedCompression=${learnedState.tempo.compression}`);
console.log(`LearnedConfidence=${learned.confidence}`);
console.log(`AdaptationHooks=${learnedState.memoryHooks.filter((hook) => hook.startsWith("learned:")).length}`);
