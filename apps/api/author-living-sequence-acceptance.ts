import { scoreMouthCandidate } from "./src/services/authorMouth.js";

type Any = Record<string, unknown>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR LIVING SEQUENCE ACCEPTANCE FAILED: ${message}`);
}

const envelope = {
  subject: "Milo",
  events: [
    { id: "event-1", label: "Milo is a Pomeranian", sourceIds: ["fact-1"], entities: ["Milo"] },
    { id: "event-2", label: "Milo loves walks", sourceIds: ["fact-2"], entities: ["Milo", "walks"] },
    { id: "event-3", label: "Milo loves bacon", sourceIds: ["fact-3"], entities: ["Milo", "bacon"] },
  ],
  relations: [],
  suppliedTerms: ["Milo", "Pomeranian", "walks", "small dogs", "bacon"],
  suppliedPhrases: ["Milo loves walks", "Milo loves bacon"],
  suppliedEntities: ["Milo", "Pomeranian", "small dogs", "bacon"],
  suppliedActions: ["walks", "loves"],
  suppliedStates: [],
  openingEventIds: ["event-1"],
  endpointEventId: "event-3",
  carrierEventIds: ["event-2"],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
  eventStructure: [],
  entityContinuity: [],
  patterns: [],
} as Any;

const relationshipBeat = {
  order: 3,
  role: "reveal",
  eventIds: ["event-3"],
  attentionFunction: "Turn the supplied preference into lived sequence language rather than a profile statement.",
  change: "Milo's supplied affection for bacon becomes immediately salient.",
  next: "What happens when bacon enters the scene?",
  frontier: "What happens when bacon enters the scene?",
  relationKinds: ["preference"],
  semanticRealization: {
    mechanism: "expectation_shift",
    evidenceEventIds: ["event-3"],
    beforeEventIds: ["event-1"],
    afterEventIds: ["event-3"],
    before: "Milo is a Pomeranian",
    after: "Milo loves bacon",
    subject: "Milo",
    relation: { kind: "preference", fromEventId: "event-1", toEventId: "event-3" },
    realizationMove: "recognize",
    creativeOpportunity: "recognition",
    confidence: 0.95,
  },
  observerExperience: {
    objective: "Make the supplied preference felt in the viewer's experience.",
    surprise: "A mundane preference becomes the scene's immediate pressure point.",
    curiosity: "Does bacon become the next thing on Milo's mind?",
    attention: ["bacon"],
    landing: "Land the preference through voice, anticipation, status, or consequence.",
    explanationForbidden: true,
  },
} as Any;

const literal = scoreMouthCandidate({
  text: "Milo loves bacon.",
  beat: relationshipBeat,
  envelope,
});

const experiential = scoreMouthCandidate({
  text: "Do I smell bacon?",
  beat: relationshipBeat,
  envelope,
});

const walkBeat = {
  ...relationshipBeat,
  order: 2,
  eventIds: ["event-2"],
  semanticRealization: {
    ...relationshipBeat.semanticRealization,
    evidenceEventIds: ["event-2"],
    beforeEventIds: ["event-1"],
    afterEventIds: ["event-2"],
    before: "Milo is a Pomeranian",
    after: "Milo loves walks",
    relation: { kind: "preference", fromEventId: "event-1", toEventId: "event-2" },
  },
} as Any;

const walkLine = scoreMouthCandidate({
  text: "Fucking fab walk now.",
  beat: walkBeat,
  envelope,
});

assert(experiential.score > literal.score, "experiential realization did not outrank trait-list prose");
assert(!literal.reasons.includes("creative-realization-form"), "literal preference sentence was treated as creative form");
assert(walkLine.score > 0, "compressed walk realization was rejected outright");
assert(experiential.reasons.includes("approved-semantic-realization"), "experience question lost semantic authorization");
assert(walkLine.reasons.includes("approved-semantic-realization"), "compressed walk line lost semantic authorization");

console.log("PASS literal preference is demoted");
console.log(`  literal=${literal.score} reasons=${literal.reasons.join(",")}`);
console.log(`  experiential=${experiential.score} reasons=${experiential.reasons.join(",")}`);
console.log("PASS compressed preference remains playable");
console.log(`  walk=${walkLine.score} reasons=${walkLine.reasons.join(",")}`);
console.log("AUTHOR LIVING SEQUENCE ACCEPTANCE: PASS");
console.log("FACTS_ARE_MEMORY=TRUE");
console.log("RELATIONSHIPS_BECOME_PLAY=TRUE");
console.log("TRAIT_LIST_IS_NOT_THE_SCRIPT=TRUE");
console.log("ONE_MOUTH=TRUE");
