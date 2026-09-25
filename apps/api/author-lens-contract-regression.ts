import assert from "node:assert/strict";
import {
  assessAuthorCreativeTreatmentSet,
  unsupportedTreatmentMaterialReason,
  type AuthorCreativeTreatment,
} from "./src/services/authorCreative.js";

const strongTreatments: AuthorCreativeTreatment[] = [
  {
    id: "treatment-1",
    relationUnderPressure:
      "a bounded sequence gains pressure as repeated language accumulates",
    lensPressure: "deadpan comic pressure",
    treatment:
      "Dry comedy built from a repeated phrase that changes meaning across the sequence and lands as a callback.",
    perceptionDelta: "The same ordinary sequence can become funnier as its repeated language accumulates pressure.",
    expressiveBehaviors: ["callback", "repeated motif", "contrast"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-2",
    relationUnderPressure:
      "bounded timing creates sequence pressure without changing chronology",
    lensPressure: "withheld severity",
    treatment:
      "Pressure built from clipped rhythm, withheld emphasis, and a final recontextualization of the opening anchor.",
    perceptionDelta: "The bounded timing can make the sequence feel tighter without inventing urgency or danger.",
    expressiveBehaviors: ["withheld emphasis", "clipped rhythm", "recontextualization"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-3",
    relationUnderPressure:
      "ordinary completion can be re-statused by the final anchor",
    lensPressure: "formal importance",
    treatment:
      "Formal importance built from refrain, scale shift, and a payoff that returns to the opening wording.",
    perceptionDelta: "The work can be perceived as having disproportionate significance without adding a new event.",
    expressiveBehaviors: ["refrain", "scale shift", "payoff"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-4",
    relationUnderPressure: "supplied reality in natural sequence",
    lensPressure: "none",
    treatment:
      "NONE / Bare Reality. Let the supplied facts carry the sequence naturally.",
    perceptionDelta: "No added perception; direct supplied reality remains visible as the control.",
    expressiveBehaviors: ["bare reality"],
    intensity: "LIGHT",
  },
];

const lexicalOnlyTreatments: AuthorCreativeTreatment[] = [
  {
    id: "treatment-1",
    relationUnderPressure: "the same supplied actions occur in sequence",
    lensPressure: "formal synonym pressure",
    treatment: "Use elevated vocabulary for each supplied action.",
    perceptionDelta: "The same facts sound more formal but no new perception is created.",
    expressiveBehaviors: ["formal wording"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-2",
    relationUnderPressure: "the same supplied actions occur in sequence",
    lensPressure: "terse synonym pressure",
    treatment: "Use terse synonyms for each supplied action.",
    perceptionDelta: "The same facts sound shorter but no new relationship is revealed.",
    expressiveBehaviors: ["terse wording"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-3",
    relationUnderPressure: "the same supplied actions occur in sequence",
    lensPressure: "polished synonym pressure",
    treatment: "Use polished declarative wording for each supplied action.",
    perceptionDelta: "The same facts sound polished but no latent structure is revealed.",
    expressiveBehaviors: ["polished wording"],
    intensity: "MEDIUM",
  },
  {
    id: "treatment-4",
    relationUnderPressure: "supplied reality in natural sequence",
    lensPressure: "none",
    treatment: "NONE / Bare Reality.",
    perceptionDelta: "No added perception; direct supplied reality remains visible as the control.",
    expressiveBehaviors: ["bare reality"],
    intensity: "LIGHT",
  },
];

const missingBare: AuthorCreativeTreatment[] = strongTreatments
  .slice(0, 3)
  .concat({
    id: "treatment-4",
    relationUnderPressure:
      "the opening anchor can return as payoff without adding facts",
    lensPressure: "quiet callback pressure",
    treatment:
      "Quiet understatement using a delayed payoff and callback to the first supplied anchor.",
    perceptionDelta: "The final anchor can make the opening feel newly deliberate.",
    expressiveBehaviors: ["understatement", "payoff", "callback"],
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
  "The evidence is red.",
  "The defendant is fluffy.",
  "Loadout upgraded: red bow.",
];

for (const text of creativeFreedomCases) {
  assert.equal(
    unsupportedTreatmentMaterialReason({
      text,
      suppliedRealityText:
        "Arrived at 9:04 AM. Cleaned the kitchen. Cleaned two bathrooms. Finished at 11:47 AM.",
      semanticMechanic: "bounded_progression",
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
  "The case was filed yesterday.",
  "Lawyer already notified.",
  "The room went silent.",
  "Visuals employ forensic analysis with dramatic lighting.",
];

for (const text of realityViolationCases) {
  assert.ok(
    unsupportedTreatmentMaterialReason({
      text,
      suppliedRealityText:
        "Arrived at 9:04 AM. Cleaned the kitchen. Cleaned two bathrooms. Finished at 11:47 AM.",
      semanticMechanic: "bounded_progression",
    }),
    `reality-changing treatment should fail: ${text}`,
  );
}

console.log(
  "AUTHOR LENS CONTRACT GREEN · 4 TREATMENTS · 1 BARE · 3 EXPRESSIVE · OPEN CREATIVE VOCABULARY",
);
