import { buildRealityProvenance } from "./src/services/authorRealityProvenance.js";
import { validateAuthorProvenance } from "./src/services/authorProvenanceGate.js";

const subject = "Coco";
const positiveOnly = [
  {
    text: "Coco loves dogs.",
    provenance: buildRealityProvenance("Coco loves dogs.", "memory", { subject }),
  },
];

const explicitNegative = [
  {
    text: "Coco doesn't like humans.",
    provenance: buildRealityProvenance("Coco doesn't like humans.", "prompt", { subject }),
  },
];

const inferredNegative = validateAuthorProvenance(
  ["Coco doesn't like humans."],
  positiveOnly,
);

const explicitNegativeAccepted = validateAuthorProvenance(
  ["Coco doesn't like humans."],
  explicitNegative,
);

const creativeUseOfPositive = validateAuthorProvenance(
  ["Coco loves dogs."],
  positiveOnly,
);

console.log("QRE SUBJECT PROVENANCE ACCEPTANCE");
console.log(`INFERENCE REJECTED: ${inferredNegative.length > 0 ? "PASS" : "FAIL"}`);
console.log(`EXPLICIT FACT ACCEPTED: ${explicitNegativeAccepted.length === 0 ? "PASS" : "FAIL"}`);
console.log(`SUPPLIED FACT ACCEPTED: ${creativeUseOfPositive.length === 0 ? "PASS" : "FAIL"}`);

if (inferredNegative.length === 0) {
  throw new Error("SUBJECT PROVENANCE INVARIANT FAILED: positive preference allowed unsupported negative relationship");
}
if (explicitNegativeAccepted.length !== 0) {
  throw new Error("SUBJECT PROVENANCE INVARIANT FAILED: explicit user fact was rejected");
}
if (creativeUseOfPositive.length !== 0) {
  throw new Error("SUBJECT PROVENANCE INVARIANT FAILED: supplied subject fact was rejected");
}

console.log("SUBJECT PROVENANCE ACCEPTANCE: PASS");
