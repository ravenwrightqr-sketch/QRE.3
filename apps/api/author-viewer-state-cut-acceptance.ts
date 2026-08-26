import assert from "node:assert/strict";
import { buildMouthCandidateMessages } from "./src/services/authorMouthCandidateSearch.js";

const envelope = {
  subject: "Coco",
  events: [
    { id: "event-1", label: "Coco was groomed at Elm Street Grooming.", sourceIds: [], entities: ["Coco", "Elm Street Grooming"] },
    { id: "event-2", label: "Coco stole the red bow.", sourceIds: [], entities: ["Coco", "red bow"] },
  ],
  relations: [
    { from: "event-1", to: "event-2", kind: "converges", strength: 0.9 },
  ],
  suppliedTerms: ["Coco", "groomed", "Elm", "Street", "Grooming", "stole", "red", "bow"],
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
  unresolvedTensions: ["grooming and theft are now connected"],
  recurringSignals: [],
  sensorySignals: [],
};

const beats = [
  {
    order: 1,
    role: "arrival",
    attentionFunction: "hook",
    eventIds: ["event-1"],
    change: "Establish supplied evidence: Coco was groomed. Make this memorable.",
    next: "What relationship deserves the next cut?",
    frontier: "What relationship deserves the next cut?",
    obligations: ["Perform the approved semantic change."],
    forbiddenMoves: ["new object", "new action"],
    paysOff: [],
  },
  {
    order: 2,
    role: "payoff",
    attentionFunction: "payoff",
    eventIds: ["event-1", "event-2"],
    change: "The supplied endpoint lands after the accumulated path.",
    next: "What is now true at the supplied ending?",
    frontier: "What is now true at the supplied ending?",
    obligations: ["Terminate on the supplied endpoint exactly."],
    forbiddenMoves: ["new outcome"],
    paysOff: ["event-2"],
  },
];

const messages = buildMouthCandidateMessages({
  envelope,
  beats,
  lens: "comedy",
});

const user = JSON.parse(messages[1]!.content) as Record<string, unknown>;
const serialized = messages.map((message) => message.content).join("\n");
const modelBeats = user.beats as Array<Record<string, unknown>>;

assert.ok(serialized.includes("viewerState"), "viewer-state contract missing from Mouth prompt");
assert.ok(modelBeats[0]?.viewerState, "viewer-state cut was not derived");
assert.equal(modelBeats[0]?.role, undefined, "planner role leaked into Mouth prompt");
assert.equal(modelBeats[0]?.attentionFunction, undefined, "planner attention label leaked into Mouth prompt");
assert.equal(modelBeats[0]?.change, undefined, "planner change prose leaked into Mouth prompt");
assert.equal(modelBeats[0]?.next, undefined, "planner next-question prose leaked into Mouth prompt");
assert.equal(modelBeats[0]?.frontier, undefined, "planner frontier prose leaked into Mouth prompt");
assert.equal(modelBeats[0]?.obligations, undefined, "planner obligations leaked into Mouth prompt");
assert.equal(modelBeats[0]?.forbiddenMoves, undefined, "planner forbidden moves leaked into Mouth prompt");
assert.equal(modelBeats[0]?.creativeMove, undefined, "planner creative-move label leaked into Mouth prompt");
assert.equal(modelBeats[0]?.realizationMode, undefined, "planner realization mode leaked into Mouth prompt");
assert.equal(modelBeats[0]?.viewerState?.attentionMove, "orient", "opening cut should orient the viewer");
assert.equal(modelBeats[1]?.viewerState?.attentionMove, "land", "terminal cut should land");
assert.deepEqual(modelBeats[1]?.sourceLabels, ["Coco was groomed at Elm Street Grooming.", "Coco stole the red bow."], "source evidence must remain visible");

console.log("AUTHOR VIEWER STATE CUT ACCEPTANCE: PASS");
console.log(`ViewerBeats=${modelBeats.length}`);
console.log(`OpeningMove=${String(modelBeats[0]?.viewerState?.attentionMove)}`);
console.log(`PayoffMove=${String(modelBeats[1]?.viewerState?.attentionMove)}`);
console.log(`OpeningCuriosity=${String(modelBeats[0]?.viewerState?.curiosityPressure)}`);
console.log(`PayoffPressure=${String(modelBeats[1]?.viewerState?.payoffPressure)}`);
