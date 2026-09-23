import assert from "node:assert/strict";
import {
  assessAuthorCreativeTreatmentSet,
  unsupportedLensMaterialReason,
  type AuthorCreativeTreatment,
} from "./src/services/authorCreative.js";

const strongTreatments: AuthorCreativeTreatment[] = [
  {
    id: "treatment-1",
    treatment:
      "Dry comedy built from a repeated phrase that changes meaning across the sequence and lands as a callback.",
    devices: ["callback", "repeated motif", "contrast"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-2",
    treatment:
      "Noir pressure built from clipped rhythm, withheld emphasis, and a final recontextualization of the opening anchor.",
    devices: ["withheld emphasis", "clipped rhythm", "recontextualization"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-3",
    treatment:
      "Ceremonial absurdity built from refrain, escalating importance, and a payoff that returns to the opening wording.",
    devices: ["refrain", "escalation", "payoff"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-4",
    treatment:
      "NONE / Bare Reality. Let the supplied facts carry the sequence naturally.",
    devices: ["bare reality"],
    intensity: "LIGHT",
  },
];

const lexicalOnlyTreatments: AuthorCreativeTreatment[] = [
  {
    id: "treatment-1",
    treatment: "Use elevated vocabulary for each supplied action.",
    devices: ["formal wording"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-2",
    treatment: "Use terse synonyms for each supplied action.",
    devices: ["terse wording"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-3",
    treatment: "Use polished declarative wording for each supplied action.",
    devices: ["polished wording"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-4",
    treatment: "NONE / Bare Reality.",
    devices: ["bare reality"],
    intensity: "LIGHT",
  },
];

const missingBare: AuthorCreativeTreatment[] = strongTreatments
  .slice(0, 3)
  .concat({
    id: "treatment-4",
    treatment:
      "Quiet understatement using a delayed payoff and callback to the first supplied anchor.",
    devices: ["understatement", "payoff", "callback"],
    intensity: "LIGHT",
  });

const strong = assessAuthorCreativeTreatmentSet(strongTreatments);
assert.equal(strong.complete, true, strong.reasons.join("; "));
assert.equal(strong.bareCount, 1);
assert.equal(strong.expressiveCount, 3);
assert.ok(strong.sequenceRelationshipCount >= 2);

const lexical = assessAuthorCreativeTreatmentSet(lexicalOnlyTreatments);
// The sequence-device heuristic is diagnostic, not an admission gate. Mouth
// realization and truth grounding decide whether these conceptions actually
// work; Lens vocabulary alone must not block model-discovered strategies.
assert.equal(lexical.complete, true, lexical.reasons.join("; "));
assert.ok(lexical.sequenceRelationshipCount < 2);

const noBare = assessAuthorCreativeTreatmentSet(missingBare);
assert.equal(noBare.complete, false);
assert.ok(noBare.reasons.includes("requires exactly one bare treatment"));



const creativeFreedomCases = [
  "Use an almost bureaucratic delivery as deadpan comedy.",
  "Let the sequence feel precise, urgent, ceremonial, and slightly unhinged.",
  "Treat 'Bathrooms: Two. Neutralized.' as obvious performed heist framing.",
  "Use score-like game rhetoric as a motif without claiming a real score exists.",
  "Let spotless function as comic overstatement rather than a literal inspection result.",
];

for (const text of creativeFreedomCases) {
  assert.equal(
    unsupportedLensMaterialReason({
      text,
      suppliedRealityText:
        "Arrived at 9:04 AM. Cleaned the kitchen. Cleaned two bathrooms. Finished at 11:47 AM.",
      selectedFrame: "operation",
    }),
    undefined,
    `creative rhetoric should survive: ${text}`,
  );
}

const realityViolationCases = [
  "Introduce a new object: a rubber duck.",
  "Add a strange smell that follows the cleaner through the sequence.",
  "The housekeeping service used a checklist for the work.",
  "The service returns weekly.",
  "They signed a contract at the end.",
];

for (const text of realityViolationCases) {
  assert.ok(
    unsupportedLensMaterialReason({
      text,
      suppliedRealityText:
        "Arrived at 9:04 AM. Cleaned the kitchen. Cleaned two bathrooms. Finished at 11:47 AM.",
      selectedFrame: "operation",
    }),
    `reality-changing treatment should fail: ${text}`,
  );
}

console.log(
  "AUTHOR LENS CONTRACT GREEN · 4 TREATMENTS · 1 BARE · 3 EXPRESSIVE · OPEN CREATIVE VOCABULARY",
);
