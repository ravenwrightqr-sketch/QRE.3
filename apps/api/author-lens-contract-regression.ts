import assert from "node:assert/strict";
import {
  assessAuthorCreativeTreatmentSet,
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
assert.equal(lexical.complete, false);
assert.ok(
  lexical.reasons.includes("requires at least two sequence-level expressive treatments"),
);

const noBare = assessAuthorCreativeTreatmentSet(missingBare);
assert.equal(noBare.complete, false);
assert.ok(noBare.reasons.includes("requires exactly one bare treatment"));

console.log(
  "AUTHOR LENS CONTRACT GREEN · 4 TREATMENTS · 1 BARE · 3 EXPRESSIVE · SEQUENCE-LEVEL CONCEPTION",
);
