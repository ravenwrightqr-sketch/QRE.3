import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearch.js";
import type { MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const envelope: RealityEnvelope = {
  subject: "Coco",
  events: [
    {
      id: "event-1",
      label: "Coco was groomed at Elm Street Grooming.",
      sourceIds: [],
      entities: ["Coco", "Elm Street Grooming"],
    },
    {
      id: "event-2",
      label: "Coco stole the red bow.",
      sourceIds: [],
      entities: ["Coco", "red bow"],
    },
  ],
  relations: [
    { from: "event-1", to: "event-2", kind: "converges", strength: 0.9 },
  ],
  suppliedTerms: ["coco", "groomed", "elm", "street", "grooming", "stole", "red", "bow"],
  suppliedPhrases: [
    "Coco was groomed at Elm Street Grooming.",
    "Coco stole the red bow.",
  ],
  suppliedEntities: ["Coco", "Elm Street Grooming", "red bow"],
  suppliedActions: ["groomed", "stole"],
  suppliedStates: [],
  openingEventIds: ["event-1"],
  endpointEventId: "event-2",
  carrierEventIds: ["event-1"],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
};

const beat: MouthCandidateBeat = {
  order: 1,
  eventIds: ["event-1", "event-2"],
  relationKinds: ["converges"],
  attentionFunction: "turn",
  role: "reframe",
};

const literal = scoreMouthCandidate({
  text: "Coco stole the red bow.",
  beat,
  envelope,
});

const interpretation = scoreMouthCandidate({
  text: "Coco looked good in red.",
  beat,
  envelope,
});

assert(interpretation.reasons.includes("derivable-interpretation"), "interpretive candidate was not recognized");
assert(!interpretation.reasons.includes("fact-restatement"), "interpretive candidate was treated as literal restatement");
assert(interpretation.inventionRisk < 0.35, "interpretive candidate was treated as invented");
assert(interpretation.score > literal.score, `interpretive candidate did not beat literal restatement: ${interpretation.score} <= ${literal.score}`);

console.log("AUTHOR MOUTH INTERPRETIVE RANKING ACCEPTANCE: PASS");
console.log(`LiteralScore=${literal.score}`);
console.log(`InterpretiveScore=${interpretation.score}`);
console.log(`InterpretiveMeaning=${interpretation.meaningScore}`);
console.log(`InterpretiveReasons=${interpretation.reasons.join(",")}`);
