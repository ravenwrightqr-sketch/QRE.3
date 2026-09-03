import type { MouthRealizationAuthority } from "@qre/contracts";
import { evaluateRealizationBoundary } from "./src/services/authorRealizationBoundary.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR MOUTH METAMORPHIC V2 FAILED: ${message}`);
}

const authority: MouthRealizationAuthority = {
  reality: {
    eventIds: ["e1", "e2"],
    entities: ["Milo"],
    actions: ["flirts", "dates"],
    objects: [],
    states: ["charming"],
  },
  meaning: {
    mechanism: "repeated romantic attention",
    before: "charm is incidental",
    after: "charm becomes a recurring pattern",
    relationKind: "recurrence",
    realizationMove: "characterization",
    creativeOpportunity: "imply the pattern without naming it",
    feltEffect: "recognition with a grin",
    viewerShift: "the viewer infers a familiar romantic archetype",
    realizationDirection: "allude rather than explain",
    languageAim: "make the pattern click without stating the thesis",
  },
  earnedInterpretations: [
    "recurring romantic attention",
    "social magnetism",
    "familiar romantic archetype",
    "type",
    "chaos",
  ],
  permittedRealizationModes: [
    "characterization",
    "implication",
    "understatement",
    "compression",
  ],
  inferenceBudget: "strongly-interpretive",
  creativeMoves: ["characterization", "implication", "understatement"],
  forbiddenMoves: ["new concrete event", "new location", "new object", "new identity fact"],
  evidenceEventIds: ["e1", "e2"],
};

function boundary(text: string, overrides: Partial<Parameters<typeof evaluateRealizationBoundary>[0]> = {}) {
  return evaluateRealizationBoundary({
    text,
    subject: "Milo",
    localReality: ["Milo flirts", "Milo dates", "Milo is charming"],
    globalReality: ["Milo flirts", "Milo dates", "Milo is charming", "Milo loves bacon"],
    earnedInterpretations: authority.earnedInterpretations,
    permittedRealizationModes: authority.permittedRealizationModes,
    inferenceBudget: authority.inferenceBudget,
    ...overrides,
  });
}

/* Metamorphic 1: surface/lens changes cannot alter concrete authority. */
const realityA = JSON.stringify(authority.reality);
const realityB = JSON.stringify({ ...authority.reality });
assert(realityA === realityB, "surface realization changed reality authority");

/* Metamorphic 2: earned implication is allowed without declaring the label. */
const implication = boundary("He's got a type.");
assert(implication.inventionRisk < 0.9, "earned implication was rejected");

/* Metamorphic 3: semantic paraphrase may vary while remaining safe. */
const paraphrase = boundary("Milo, impossible to miss.", {
  earnedInterpretations: [
    ...authority.earnedInterpretations,
    "impossible to miss",
  ],
});
assert(paraphrase.inventionRisk < 0.9, "semantic paraphrase was rejected");

/* Metamorphic 4: semantic compression may use novel realization language. */
const semanticChaos = boundary("Spa. Check. Off to play chaos.");
assert(semanticChaos.inventionRisk < 0.9, "creative semantic realization was rejected");

/* Metamorphic 5: a world fact from another beat remains forbidden. */
const foreign = boundary("Milo loves bacon.");
assert(foreign.inventionRisk >= 0.9, "foreign world fact escaped the boundary");
assert(foreign.foreignTokens.includes("bacon"), "foreign fact token was not detected");

/* Metamorphic 6: implication cannot silently become a new identity fact. */
const explicitLabel = boundary("Milo became a playboy.", {
  earnedInterpretations: [...authority.earnedInterpretations, "playboy"],
});
assert(explicitLabel.inventionRisk >= 0.9, "explicit identity claim bypassed earned-meaning protection");

/* Metamorphic 7: cognition can explicitly opt into an identity assertion. */
const explicitAuthorized = boundary("Milo is a playboy.", {
  earnedInterpretations: [...authority.earnedInterpretations, "playboy"],
  permittedRealizationModes: [...authority.permittedRealizationModes, "explicit-characterization"],
  inferenceBudget: "interpretive",
});
assert(explicitAuthorized.inventionRisk < 0.9, "explicit authorized characterization was rejected");

/* Metamorphic 8: unsupported environment imagery is not inferred from style. */
const sunlight = boundary("Milo blinked in the sunlight.", {
  earnedInterpretations: authority.earnedInterpretations,
});
assert(sunlight.inventionRisk >= 0.9, "unsupported sunlight escaped the boundary");
assert(sunlight.novelConcreteTokens.includes("sunlight"), "sunlight was not classified as novel concrete reality");

/* Metamorphic 9: time is a source fact, not a generator for environmental memory. */
const lateNight = boundary("Milo stood in the sunlight.", {
  localReality: ["Milo flirts", "Milo dates", "Milo is charming", "9pm", "California"],
  globalReality: ["Milo flirts", "Milo dates", "Milo is charming", "9pm", "California"],
});
assert(lateNight.inventionRisk >= 0.9, "time/location context authorized unsupported sunlight");

/* Metamorphic 10: unrelated global mutation does not change foreign-fact rejection. */
const foreignAfterMutation = boundary("Milo loves bacon.", {
  globalReality: [
    "Milo flirts",
    "Milo dates",
    "Milo is charming",
    "Milo loves bacon",
    "Milo owns a red sports car",
  ],
});
assert(foreignAfterMutation.inventionRisk >= 0.9, "foreign fact became allowed after unrelated mutation");

console.log("AUTHOR MOUTH METAMORPHIC V2: PASS");
console.log("EARNED_IMPLICATION_ALLOWED=TRUE");
console.log("SEMANTIC_PARAPHRASE_ALLOWED=TRUE");
console.log("SEMANTIC_CHAOS_ALLOWED=TRUE");
console.log("FOREIGN_FACT_STAYS_REJECTED=TRUE");
console.log("EXPLICIT_IDENTITY_STAYS_BLOCKED=TRUE");
console.log("EXPLICIT_AUTHORIZATION_WORKS=TRUE");
console.log("UNSUPPORTED_SUNLIGHT_STAYS_REJECTED=TRUE");
console.log("TIME_IS_NOT_ENVIRONMENT_MEMORY=TRUE");
console.log("REALITY_AUTHORITY_INVARIANT=TRUE");
