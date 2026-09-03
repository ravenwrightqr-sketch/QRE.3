import {
  isAuthorizedMouthCandidate,
  scoreMouthCandidate,
} from "./src/services/authorMouth.js";
import type { MouthCandidateBeat } from "@qre/contracts";

const envelope = {
  subject: "Coco",
  events: [
    { id: "e1", label: "came in nervous" },
    { id: "e2", label: "stole a blue bow" },
  ],
  suppliedPhrases: ["left looking fabulous"],
  suppliedEntities: ["Coco", "blue bow"],
  suppliedActions: ["came in nervous", "stole a blue bow"],
  suppliedStates: ["nervous", "fabulous"],
  recurringSignals: [],
  sensorySignals: [],
  unresolvedTensions: [],
} as any;

const literalBeat: MouthCandidateBeat = {
  order: 1,
  role: "establishing",
  attentionFunction: "Preserve supplied reality.",
  eventIds: ["e1"],
};

const semanticBeat: MouthCandidateBeat = {
  order: 2,
  role: "reveal",
  attentionFunction: "Realize the approved semantic turn without inventing an event.",
  eventIds: ["e1", "e2"],
  relationKinds: ["convergence"],
  semanticRealization: {
    mechanism: "convergence",
    evidenceEventIds: ["e1", "e2"],
    beforeEventIds: ["e1"],
    afterEventIds: ["e2"],
    before: "nervous arrival",
    after: "bold little takeover",
    subject: "Coco",
    realizationMove: "recontextualize_callback",
    creativeOpportunity: "status_turn",
    confidence: 0.9,
  } as any,
};

function assert(name: string, condition: unknown): void {
  if (!condition) throw new Error(`MOUTH ACCEPTANCE FAILED: ${name}`);
  console.log(`PASS: ${name}`);
}

const literal = scoreMouthCandidate({
  text: "came in nervous",
  beat: literalBeat,
  envelope,
});
assert("literal supplied event is authorized", isAuthorizedMouthCandidate(literal));

const generic = scoreMouthCandidate({
  text: "A swirl. Then, quiet.",
  beat: literalBeat,
  envelope,
});
assert("generic atmospheric language without approved meaning is rejected", !isAuthorizedMouthCandidate(generic));

const invented = scoreMouthCandidate({
  text: "Coco chased the bow outside",
  beat: semanticBeat,
  envelope,
});
assert("unsupported concrete action remains rejected", !isAuthorizedMouthCandidate(invented));

const semantic = scoreMouthCandidate({
  text: "The nervous arrival became the takeover.",
  beat: semanticBeat,
  envelope,
});
assert("approved semantic realization can be authorized", isAuthorizedMouthCandidate(semantic));
assert("semantic candidate carries approved-realization reason", semantic.reasons.includes("approved-semantic-realization"));

console.log("UNIVERSAL MOUTH ACCEPTANCE GREEN · STRUCTURED AUTHORITY · TRUTH BOUNDARY · NO ATMOSPHERIC BYPASS");
