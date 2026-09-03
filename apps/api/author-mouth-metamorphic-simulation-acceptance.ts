import type { MouthRealizationAuthority } from "@qre/contracts";
import { evaluateRealizationBoundary } from "./src/services/authorRealizationBoundary.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR MOUTH METAMORPHIC SIMULATION FAILED: ${message}`);
  }
}

function signature(authority: MouthRealizationAuthority): string {
  return JSON.stringify({
    reality: authority.reality,
    earnedInterpretations: authority.earnedInterpretations,
    forbiddenMoves: authority.forbiddenMoves,
    evidenceEventIds: authority.evidenceEventIds,
  });
}

const baseReality = {
  eventIds: ["event-flirt-1", "event-flirt-2"],
  entities: ["Milo"],
  actions: ["flirts", "dates"],
  objects: [],
  states: ["charming"],
};

const baseMeaning = {
  mechanism: "repeated romantic attention",
  before: "charm is incidental",
  after: "charm becomes a recurring pattern",
  relationKind: "recurrence",
  realizationMove: "characterization",
  creativeOpportunity: "imply the pattern without naming the label",
  feltEffect: "recognition with a grin",
  viewerShift: "the viewer infers a familiar romantic archetype",
  realizationDirection: "allude rather than explain",
  languageAim: "make the pattern click without stating the thesis",
};

const authorityA: MouthRealizationAuthority = {
  reality: baseReality,
  meaning: baseMeaning,
  earnedInterpretations: [
    "recurring romantic attention",
    "social magnetism",
    "familiar romantic archetype",
    "pattern rather than accident",
  ],
  permittedRealizationModes: [
    "characterization",
    "implication",
    "understatement",
    "compression",
  ],
  inferenceBudget: "strongly-interpretive",
  creativeMoves: [
    "characterization",
    "implication",
    "understatement",
  ],
  forbiddenMoves: [
    "new concrete event",
    "new location",
    "new object",
    "new identity fact",
  ],
  evidenceEventIds: [
    "event-flirt-1",
    "event-flirt-2",
  ],
};

/*
 * METAMORPHIC RELATION 1:
 *
 * Change the realization/lens surface while holding source evidence and
 * earned meaning constant. Concrete reality authority must remain invariant.
 */
const authorityB: MouthRealizationAuthority = {
  ...authorityA,
  permittedRealizationModes: [
    "characterization",
    "implication",
    "irony",
    "juxtaposition",
  ],
  creativeMoves: [
    "characterization",
    "implication",
    "irony",
  ],
};

assert(
  signature(authorityA) === signature(authorityB) ||
    JSON.stringify(authorityA.reality) === JSON.stringify(authorityB.reality),
  "changing realization style altered concrete reality authority",
);
assert(
  JSON.stringify(authorityA.evidenceEventIds) ===
    JSON.stringify(authorityB.evidenceEventIds),
  "changing realization style altered evidence ownership",
);

/*
 * METAMORPHIC RELATION 2:
 *
 * Add an unrelated fact to the world. The beat's local authority must not
 * expand merely because another event now exists globally.
 */
const authorityWithForeignFact: MouthRealizationAuthority = {
  ...authorityA,
  reality: {
    ...authorityA.reality,
    eventIds: [...authorityA.reality.eventIds, "event-foreign"],
  },
};

assert(
  authorityWithForeignFact.reality.eventIds.includes("event-foreign"),
  "metamorphic fixture did not add the foreign event",
);

const baseCandidate = evaluateRealizationBoundary({
  text: "Milo loves bacon.",
  subject: "Milo",
  localReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
  ],
  globalReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
    "Milo loves bacon",
  ],
  semantic: authorityA.earnedInterpretations,
});

const withForeignFact = evaluateRealizationBoundary({
  text: "Milo loves bacon.",
  subject: "Milo",
  localReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
  ],
  globalReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
    "Milo loves bacon",
  ],
  semantic: authorityWithForeignFact.earnedInterpretations,
});

assert(
  baseCandidate.inventionRisk >= 0.9,
  "foreign fact was not rejected before mutation",
);
assert(
  withForeignFact.inventionRisk >= 0.9,
  "foreign fact became allowed after unrelated-world mutation",
);

/*
 * METAMORPHIC RELATION 3:
 *
 * Different language realizations of the same earned interpretation may
 * differ lexically while preserving the semantic contract.
 */
const realizationA = evaluateRealizationBoundary({
  text: "Milo, quietly magnetic.",
  subject: "Milo",
  localReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
  ],
  semantic: [
    "quietly magnetic",
    ...authorityA.earnedInterpretations,
  ],
});

const realizationB = evaluateRealizationBoundary({
  text: "Milo, impossible to miss.",
  subject: "Milo",
  localReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
  ],
  semantic: [
    "impossible to miss",
    ...authorityA.earnedInterpretations,
  ],
});

assert(
  realizationA.inventionRisk < 0.9,
  "approved semantic realization A was rejected",
);
assert(
  realizationB.inventionRisk < 0.9,
  "approved semantic realization B was rejected",
);
assert(
  realizationA.inventionRisk < 0.9 &&
    realizationB.inventionRisk < 0.9,
  "semantic paraphrase lost reality safety invariance",
);

/*
 * METAMORPHIC RELATION 4:
 *
 * A genuinely new concrete identity claim is never rescued merely because
 * the beat permits strong interpretation.
 */
const inventedIdentity = evaluateRealizationBoundary({
  text: "Milo became a playboy.",
  subject: "Milo",
  localReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
  ],
  semantic: [
    ...authorityA.earnedInterpretations,
    "playboy is the viewer's inferred archetype",
  ],
});

assert(
  inventedIdentity.inventionRisk >= 0.9,
  "strong semantic interpretation incorrectly authorized a new identity fact",
);

console.log("AUTHOR MOUTH METAMORPHIC SIMULATION: PASS");
console.log("REALITY_AUTHORITY_INVARIANT=TRUE");
console.log("EVIDENCE_OWNERSHIP_INVARIANT=TRUE");
console.log("FOREIGN_FACT_STAYS_REJECTED=TRUE");
console.log("SEMANTIC_PARAPHRASE_ALLOWED=TRUE");
console.log("NEW_IDENTITY_FACT_STAYS_REJECTED=TRUE");
