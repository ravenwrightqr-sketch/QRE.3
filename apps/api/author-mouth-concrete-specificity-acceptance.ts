import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearchCanonical.js";
import type { MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";

const envelope: RealityEnvelope = {
  subject: "Coco",
  events: [
    {
      id: "event-blue-bow",
      label: "stole a blue bow",
      sourceIds: ["source-1"],
      entities: ["blue bow"],
    },
  ],
  relations: [],
  suppliedTerms: ["coco", "stole", "blue", "bow"],
  suppliedPhrases: ["stole a blue bow"],
  suppliedEntities: ["blue bow"],
  suppliedActions: ["stole"],
  suppliedStates: [],
  openingEventIds: [],
  endpointEventId: "event-blue-bow",
  carrierEventIds: [],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
};

const beat = {
  order: 1,
  eventIds: ["event-blue-bow"],
  attentionFunction: "recontextualize",
  role: "reveal",
  change: "Bring forward stole a blue bow.",
  next: "What comes next?",
  relationKinds: [],
  paysOff: [],
} as unknown as MouthCandidateBeat;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const preserved = scoreMouthCandidate({
  text: "A blue bow vanished.",
  beat,
  envelope,
});

const weakened = scoreMouthCandidate({
  text: "A blue thing vanished.",
  beat,
  envelope,
});

const substituted = scoreMouthCandidate({
  text: "A blue prize vanished.",
  beat,
  envelope,
});

assert(
  preserved.inventionRisk < 0.9 && preserved.forbiddenMoveRisk < 0.9,
  `Expected supplied concrete specificity to survive; got ${JSON.stringify(preserved)}`,
);

assert(
  weakened.inventionRisk >= 0.9 || weakened.forbiddenMoveRisk >= 0.9 || weakened.reasons.includes("unsafe-realization"),
  `Expected generic specificity downgrade to be rejected; got ${JSON.stringify(weakened)}`,
);

assert(
  substituted.inventionRisk >= 0.9 || substituted.forbiddenMoveRisk >= 0.9 || substituted.reasons.includes("unsafe-realization"),
  `Expected concrete noun substitution to be rejected; got ${JSON.stringify(substituted)}`,
);

console.log("QRE MOUTH CONCRETE SPECIFICITY ACCEPTANCE");
console.log("preserved=PASS");
console.log("blue thing=REJECTED");
console.log("blue prize=REJECTED");
console.log("status=PASS");
