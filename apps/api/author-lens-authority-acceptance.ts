import { resolveLensPolicy } from "./src/services/authorLensPolicy.js";
import { rankLensOpportunities } from "./src/services/authorLensRanking.js";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const envelope: RealityEnvelope = {
  subject: "the house",
  events: [
    { id: "e1", label: "geodrop", sourceIds: ["s1"], entities: ["house"] },
    { id: "e2", label: "cleaned kitchen", sourceIds: ["s2"], entities: ["kitchen"] },
    { id: "e3", label: "felt eyes on me", sourceIds: ["s3"], entities: ["cat"] },
    { id: "e4", label: "cleaned two bathrooms", sourceIds: ["s4"], entities: ["bathrooms"] },
    { id: "e5", label: "cat watched", sourceIds: ["s5"], entities: ["cat"] },
    { id: "e6", label: "final inspection", sourceIds: ["s6"], entities: ["house"] },
  ],
  relations: [
    { from: "e2", to: "e4", kind: "repeats", strength: 0.9 },
    { from: "e3", to: "e5", kind: "recontextualizes", strength: 0.95 },
    { from: "e4", to: "e6", kind: "causes", strength: 0.8 },
  ],
  suppliedTerms: ["house", "cat", "kitchen", "bathrooms"],
  suppliedPhrases: ["geodrop", "cleaned kitchen", "felt eyes on me", "cleaned two bathrooms", "cat watched", "final inspection"],
  suppliedEntities: ["house", "cat", "kitchen", "bathrooms"],
  suppliedActions: ["cleaned", "watched"],
  suppliedStates: [],
  openingEventIds: ["e1"],
  endpointEventId: "e6",
  carrierEventIds: ["e5", "e4"],
  unresolvedTensions: ["felt eyes on me"],
  recurringSignals: ["cat"],
  sensorySignals: ["eyes"],
  eventStructure: [],
  entityContinuity: [],
  patterns: [],
};

const before = JSON.stringify(envelope);
const none = resolveLensPolicy();
const game = resolveLensPolicy("game");
const spy = resolveLensPolicy("spy");
const horror = resolveLensPolicy("horror");

assert(none.name === "NONE", "NONE must be the native policy");
assert(none.humanSpine === "preserve", "NONE must preserve the human spine");
assert(game.worldOrbit.join("|") !== spy.worldOrbit.join("|"), "GAME and SPY must have distinct perceptual policies");
assert(spy.worldOrbit.join("|") !== horror.worldOrbit.join("|"), "SPY and HORROR must have distinct perceptual policies");
assert(game.environmentalOperators.join("|") !== horror.environmentalOperators.join("|"), "GAME and HORROR must have distinct environmental operators");
assert(game.forbiddenRealityMoves.some((move) => /invented concrete event/i.test(move)), "GAME must forbid invented concrete events");
assert(horror.forbiddenRealityMoves.some((move) => /invented/i.test(move)), "HORROR must retain reality guards");

const canonical = rankLensOpportunities(envelope);
assert(canonical.length > 0, "Canonical ranker returned no opportunities");
assert(canonical.some((candidate) => candidate.frame === "NONE"), "Canonical ranker must retain native NONE as a valid option");
assert(canonical.every((candidate) => resolveLensPolicy(candidate.frame).name === candidate.frame || candidate.frame === "NONE"), "Every ranked frame must resolve through the canonical LensPolicy");

assert(JSON.stringify(envelope) === before, "Lens ranking must not mutate supplied RealityEnvelope");

console.log("QRE LENS AUTHORITY ACCEPTANCE · PASS");
console.log("POLICY=canonical");
console.log("RANKING=canonical");
console.log("COMPATIBILITY_ADAPTER=removed");
console.log("REALITY=unchanged");
console.log(`CANDIDATES=${canonical.length}`);
console.log(`GAME=${game.worldOrbit.join(", ")}`);
console.log(`SPY=${spy.worldOrbit.join(", ")}`);
console.log(`HORROR=${horror.worldOrbit.join(", ")}`);
