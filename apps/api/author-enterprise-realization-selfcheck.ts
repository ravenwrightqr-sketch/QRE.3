import { buildMeaningSpine } from "./src/services/authorMeaningSpine.js";
import {
  ENTERPRISE_MOUTH_ACCEPTANCE_MATRIX,
  ENTERPRISE_MOUTH_STRUCTURAL_INVARIANTS,
} from "./src/services/authorEnterpriseMouthAcceptanceMatrix.js";
import { getEnterpriseMouthPolicy } from "./src/services/authorEnterpriseMouthPolicy.js";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";

const envelope: RealityEnvelope = {
  subject: "SelfCheck",
  events: [
    {
      id: "event-1",
      label: "arrived nervous",
      sourceIds: ["source-1"],
      entities: ["SelfCheck", "nervous"],
    },
    {
      id: "event-2",
      label: "became fierce",
      sourceIds: ["source-2"],
      entities: ["SelfCheck", "fierce"],
    },
    {
      id: "event-3",
      label: "left smiling",
      sourceIds: ["source-3"],
      entities: ["SelfCheck", "smiling"],
    },
  ],
  relations: [
    {
      from: "event-1",
      to: "event-2",
      kind: "changes",
      strength: 0.82,
    },
    {
      from: "event-2",
      to: "event-3",
      kind: "changes",
      strength: 0.74,
    },
  ],
  suppliedTerms: ["arrived", "nervous", "became", "fierce", "left", "smiling"],
  suppliedPhrases: ["arrived nervous", "became fierce", "left smiling"],
  suppliedEntities: ["SelfCheck"],
  suppliedActions: ["arrived", "became", "left"],
  suppliedStates: ["nervous", "fierce", "smiling"],
  openingEventIds: ["event-1"],
  endpointEventId: "event-3",
  carrierEventIds: ["event-1", "event-2"],
  unresolvedTensions: ["vulnerability vs attitude"],
  recurringSignals: ["nervous"],
  sensorySignals: [],
};

const beats = [
  {
    order: 1,
    role: "arrival",
    attentionFunction: "hook",
    creativeMove: "none",
    realizationMode: "direct_grounded_realization",
    eventIds: ["event-1"],
    change: "Establish the supplied opening state.",
    next: "What changes next?",
    frontier: "What changes next?",
    setsUp: ["arrived nervous"],
    paysOff: [],
  },
  {
    order: 2,
    role: "reframe",
    attentionFunction: "reframe",
    creativeMove: "contrast",
    realizationMode: "semantic_contrast",
    eventIds: ["event-1", "event-2"],
    change: "Nervous changes into fierce.",
    next: "What does that alter?",
    frontier: "What does that alter?",
    setsUp: ["arrived nervous"],
    paysOff: ["became fierce"],
  },
  {
    order: 3,
    role: "payoff",
    attentionFunction: "payoff",
    creativeMove: "recontextualization",
    realizationMode: "payoff_compression",
    eventIds: ["event-2", "event-3"],
    change: "The supplied ending becomes earned.",
    next: "What remains true?",
    frontier: "What remains true?",
    setsUp: ["became fierce"],
    paysOff: ["left smiling"],
  },
] as const;

const spine = buildMeaningSpine({
  envelope,
  beats,
  premise: "self-check",
});

if (spine.beats.length !== 3) {
  throw new Error("Meaning Spine self-check failed: wrong beat count.");
}

if (spine.beats[1]?.relationKinds.length !== 1) {
  throw new Error("Meaning Spine self-check failed: relation not captured.");
}

if (spine.beats[1]?.kind !== "contrast") {
  throw new Error("Meaning Spine self-check failed: contrast kind not derived.");
}

const previousMode = process.env.QRE_ENTERPRISE_MOUTH_MODE;
const previousFast = process.env.QRE_ENTERPRISE_MOUTH_DEV_FAST;
const previousNoModel = process.env.QRE_ENTERPRISE_MOUTH_NO_MODEL;

process.env.QRE_ENTERPRISE_MOUTH_MODE = "dev-fast";
delete process.env.QRE_ENTERPRISE_MOUTH_DEV_FAST;
delete process.env.QRE_ENTERPRISE_MOUTH_NO_MODEL;

const fastPolicy = getEnterpriseMouthPolicy();

process.env.QRE_ENTERPRISE_MOUTH_MODE = "full";
const fullPolicy = getEnterpriseMouthPolicy();

if (fastPolicy.maxTotalModelCalls !== 2) {
  throw new Error("Enterprise policy self-check failed: dev-fast call budget.");
}

if (fullPolicy.maxTotalModelCalls !== 3) {
  throw new Error("Enterprise policy self-check failed: full call budget.");
}

if (fastPolicy.variantsPerBeat >= fullPolicy.variantsPerBeat) {
  throw new Error("Enterprise policy self-check failed: fast candidate budget.");
}

if (ENTERPRISE_MOUTH_ACCEPTANCE_MATRIX.length < 6) {
  throw new Error("Acceptance matrix self-check failed: cross-domain coverage is too small.");
}

if (ENTERPRISE_MOUTH_STRUCTURAL_INVARIANTS.length < 8) {
  throw new Error("Acceptance invariant self-check failed: insufficient invariant coverage.");
}

if (previousMode === undefined) delete process.env.QRE_ENTERPRISE_MOUTH_MODE;
else process.env.QRE_ENTERPRISE_MOUTH_MODE = previousMode;

if (previousFast === undefined) delete process.env.QRE_ENTERPRISE_MOUTH_DEV_FAST;
else process.env.QRE_ENTERPRISE_MOUTH_DEV_FAST = previousFast;

if (previousNoModel === undefined) delete process.env.QRE_ENTERPRISE_MOUTH_NO_MODEL;
else process.env.QRE_ENTERPRISE_MOUTH_NO_MODEL = previousNoModel;

console.log("ENTERPRISE REALIZATION SELF-CHECK: PASS");
console.log(`spineBeats=${spine.beats.length}`);
console.log(`matrixCases=${ENTERPRISE_MOUTH_ACCEPTANCE_MATRIX.length}`);
console.log(`fastMaxCalls=${fastPolicy.maxTotalModelCalls}`);
console.log(`fullMaxCalls=${fullPolicy.maxTotalModelCalls}`);
