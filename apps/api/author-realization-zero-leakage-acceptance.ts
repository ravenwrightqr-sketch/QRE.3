import { evaluateRealizationBoundary } from "./src/services/authorRealizationBoundary.js";
import { evaluateCut } from "./src/services/authorCutPolicy.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ELITE REALIZATION BOUNDARY FAILED: ${message}`);
}

const subject = "Milo";
const localReality = [
  "Milo is a small dog",
  "Milo wears a dog tag",
];
const globalReality = [
  ...localReality,
  "Milo loves bacon",
  "Milo loves walks",
  "Milo likes small dogs",
];

const semantic = [
  "identity becomes unmistakable",
  "small becomes memorable",
  "felt recognition",
  "quiet confidence",
];

const foreignFact = evaluateRealizationBoundary({
  text: "Milo loves bacon.",
  subject,
  localReality,
  globalReality,
  semantic,
});
assert(foreignFact.inventionRisk >= 0.9, "global-but-foreign fact was allowed");
assert(foreignFact.foreignTokens.includes("bacon"), "foreign token was not identified");

const inventedObject = evaluateRealizationBoundary({
  text: "Milo on a leash.",
  subject,
  localReality,
  globalReality,
  semantic,
});
assert(inventedObject.inventionRisk >= 0.9, "invented object escaped boundary");
assert(inventedObject.novelConcreteTokens.includes("leash"), "novel concrete object was not identified");

const inventedPlace = evaluateRealizationBoundary({
  text: "Milo in the park.",
  subject,
  localReality,
  globalReality,
  semantic,
});
assert(inventedPlace.inventionRisk >= 0.9, "invented setting escaped boundary");
assert(inventedPlace.novelConcreteTokens.includes("park"), "novel concrete setting was not identified");

const inventedAction = evaluateRealizationBoundary({
  text: "Milo ran away.",
  subject,
  localReality,
  globalReality,
  semantic,
});
assert(inventedAction.inventionRisk >= 0.9, "invented action escaped boundary");
assert(inventedAction.novelConcreteTokens.includes("ran"), "novel concrete action was not identified");

const figurative = evaluateRealizationBoundary({
  text: "Milo, unmistakable.",
  subject,
  localReality,
  globalReality,
  semantic,
});
assert(figurative.inventionRisk < 0.9, "legitimate figurative language was over-rejected");

const recontextualized = evaluateRealizationBoundary({
  text: "Milo, quietly important.",
  subject,
  localReality,
  globalReality,
  semantic: [...semantic, "quietly important"],
});
assert(recontextualized.inventionRisk < 0.9, "semantic language was incorrectly treated as concrete invention");

const finalCut = evaluateCut(
  "Milo in the park.",
  {
    subject,
    facts: localReality,
    moments: localReality,
  },
  {
    role: "turn",
    semanticAuthority: semantic,
  },
);
assert(finalCut.accepted === false, "canonical viewer gate allowed invented setting");
assert(finalCut.reasons.includes("novel-concrete-reality"), "viewer gate missed novel concrete reality");

console.log("ELITE REALIZATION ZERO-LEAKAGE ACCEPTANCE: PASS");
console.log("FOREIGN_FACT_REJECTED=TRUE");
console.log("INVENTED_OBJECT_REJECTED=TRUE");
console.log("INVENTED_SETTING_REJECTED=TRUE");
console.log("INVENTED_ACTION_REJECTED=TRUE");
console.log("FIGURATIVE_LANGUAGE_ALLOWED=TRUE");
console.log("SEMANTIC_LANGUAGE_ALLOWED=TRUE");
console.log("VIEWER_GATE_REJECTS_INVENTION=TRUE");
