import { buildRealityProvenance } from "./src/services/authorRealityProvenance.js";
import { validateAuthorProvenance } from "./src/services/authorProvenanceGate.js";

const ending = "Nobody wanted the night to end.";
const facts = [
  { text: "the DJ changed the song", provenance: buildRealityProvenance("the DJ changed the song", "memory", { subject: "wedding" }) },
  { text: "everyone moved to the floor", provenance: buildRealityProvenance("everyone moved to the floor", "memory", { subject: "wedding" }) },
  { text: ending, provenance: buildRealityProvenance(ending, "prompt", { subject: "wedding" }) },
];

const violations = validateAuthorProvenance([ending], facts);
if (violations.length) throw new Error(`ENDPOINT AUTHORITY FAILED: ${JSON.stringify(violations)}`);

const invented = validateAuthorProvenance(["The couple secretly owned the venue."], facts);
if (!invented.some((item) => item.reason === "unsupported_place" || item.reason === "unsupported_private_fact")) {
  throw new Error("ENDPOINT AUTHORITY FAILED: invented private/place claim passed");
}

console.log("AUTHOR ENDPOINT AUTHORITY ACCEPTANCE: PASS");
console.log(`authorized_endpoint=true`);
console.log(`invented_claim_blocked=${invented.length > 0}`);
