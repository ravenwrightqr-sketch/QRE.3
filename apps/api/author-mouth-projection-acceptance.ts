import type { MouthCandidateBeat } from "@qre/contracts";
import { buildMouthCandidateMessages } from "./src/services/authorMouthCandidateSearchCanonical.js";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";

const envelope: RealityEnvelope = {
  subject: "Milo",
  events: [
    { id: "event-1", label: "Milo arrived nervous", sourceIds: [], entities: ["Milo"] },
    { id: "event-2", label: "Milo met the small dogs", sourceIds: [], entities: ["Milo", "small dogs"] },
    { id: "event-3", label: "The same small dogs returned", sourceIds: [], entities: ["small dogs"] },
  ],
  relations: [
    { from: "event-1", to: "event-2", kind: "changes", strength: 0.91 },
    { from: "event-2", to: "event-3", kind: "repeats", strength: 0.94 },
  ],
  suppliedTerms: ["Milo", "nervous", "small", "dogs", "returned"],
  suppliedPhrases: ["Milo arrived nervous", "Milo met the small dogs", "The same small dogs returned"],
  suppliedEntities: ["Milo", "small dogs"],
  suppliedActions: ["arrived", "met", "returned"],
  suppliedStates: ["nervous"],
  openingEventIds: ["event-1"],
  endpointEventId: "event-3",
  carrierEventIds: ["event-2"],
  unresolvedTensions: [],
  recurringSignals: ["small dogs"],
  sensorySignals: [],
  eventStructure: [],
  entityContinuity: [],
  patterns: [],
};

const beat: MouthCandidateBeat = {
  order: 1,
  role: "establishing",
  attentionFunction: "CANONICAL SEMANTIC TURN: INTERNAL THESIS MUST NEVER LEAK",
  creativeMove: "recontextualization",
  eventIds: ["event-1", "event-2", "event-3"],
  change: "INTERNAL THESIS PROSE MUST NOT APPEAR IN THE MODEL PROMPT",
  next: "What happens next?",
  relationKinds: ["changes", "repeats"],
  semanticRealization: {
    mechanism: "state_change",
    evidenceEventIds: ["event-1", "event-2", "event-3"],
    beforeEventIds: ["event-1"],
    afterEventIds: ["event-2"],
    before: "INTERNAL BEFORE PROSE",
    after: "INTERNAL AFTER PROSE",
    subject: "Milo",
    callback: {
      detail: "small dogs",
      eventIds: ["event-2", "event-3"],
      role: "recontextualization",
    },
    relation: {
      kind: "changes",
      fromEventId: "event-1",
      toEventId: "event-2",
    },
    realizationMove: "recontextualize_callback",
    creativeOpportunity: "state_to_callback",
    confidence: 0.995,
  },
  observerExperience: {
    objective: "INTERNAL OBSERVER OBJECTIVE",
    surprise: "INTERNAL OBSERVER SURPRISE",
    curiosity: "INTERNAL OBSERVER CURIOSITY",
    attention: ["INTERNAL ATTENTION"],
    landing: "INTERNAL LANDING",
    explanationForbidden: true,
  },
};

const messages = buildMouthCandidateMessages({
  envelope,
  beats: [beat],
  lens: "horror",
});

const userPayload = messages.find((message) => message.role === "user")?.content ?? "";

const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(`FAIL: ${message}`);
};

const parsed = JSON.parse(userPayload) as {
  beats: Array<Record<string, unknown>>;
};
const projected = parsed.beats[0];

assert(projected, "projected beat missing");
assert(projected.controlData, "structured semantic control data missing");
assert(projected.role === "establishing", "beat role missing from projection");
assert(projected.creativeMove === "recontextualization", "creative move missing from projection");
assert(!("meaning" in projected), "legacy semantic meaning prose still exposed");
assert(!("purpose" in projected), "legacy purpose prose still exposed");
assert(!("attentionFunction" in projected), "internal attention-function prose still exposed");
assert(!userPayload.includes("INTERNAL THESIS PROSE MUST NOT APPEAR"), "beat change leaked into model prompt");
assert(!userPayload.includes("INTERNAL BEFORE PROSE"), "semantic before prose leaked into model prompt");
assert(!userPayload.includes("INTERNAL AFTER PROSE"), "semantic after prose leaked into model prompt");
assert(userPayload.includes("state_change"), "semantic mechanism missing");
assert(userPayload.includes("recontextualize_callback"), "semantic realization move missing");
assert(userPayload.includes("event-1") && userPayload.includes("event-2") && userPayload.includes("event-3"), "approved evidence IDs missing");
assert(userPayload.includes("explanationForbidden"), "observer experience control data missing");

console.log("PASS: Mouth prompt projection · semantic control data structured · thesis prose hidden · event authority preserved");
