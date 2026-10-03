import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyAuthorGroundingVerifications } from "./src/services/authorCreativeGroundingVerifier.ts";

const authorCreative = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const groundingVerifier = readFileSync(new URL("./src/services/authorCreativeGroundingVerifier.ts", import.meta.url), "utf8");
const canonical = readFileSync(new URL("./src/services/authorBrainCanonical.ts", import.meta.url), "utf8");

assert.match(
  authorCreative,
  /In IDENTITY, the supplied SUBJECT name is authorized identity reality and may be used as a rhetorical anchor anywhere in A\/B\/C when it improves the production\./,
  "Identity Mouth must explicitly authorize the supplied subject name as rhetorical identity material.",
);

assert.match(
  authorCreative,
  /Its use is optional and non-templated; do not mechanically repeat it or derive new facts from the name itself\./,
  "Identity name use must be optional and non-templated.",
);

assert.doesNotMatch(
  authorCreative,
  /MEMORY[\s\S]{0,260}supplied SUBJECT name is authorized identity reality/,
  "Subject-name rhetorical permission must not be added to Memory instructions.",
);

assert.equal(
  authorCreative.includes("${name}'s world") ||
    authorCreative.includes("Milo's world") ||
    authorCreative.includes("Milo’s world"),
  false,
  "Identity name permission must not insert a fixed name-world phrase.",
);

assert.equal(
  /\bMilo\b/.test(authorCreative),
  false,
  "Identity name permission must not hardcode Milo in production Author code.",
);

assert.equal(
  /\bpets?\b|\bdog\b/i.test(authorCreative),
  false,
  "Identity name permission must not hardcode pets or dogs in production Author code.",
);

assert.match(
  authorCreative,
  /const usesProductionMajorMouth = isMemoryMode \|\| isIdentityMode;/,
  "Identity must still use the shared production-major Mouth topology.",
);

assert.match(
  authorCreative,
  /required: usesProductionMajorMouth\s*\?\s*\["productions", "selectedProduction", "selectionReason"\]\s*:\s*\["variantsByBeat"\]/s,
  "Identity must still request A/B/C production-major output rather than variantsByBeat.",
);

assert.match(
  authorCreative,
  /const usesWholeProductionSelection = isIdentityMode \|\| \(isMemoryMode && lensSearchEnabled\);/,
  "Identity whole-production selection must remain intact.",
);

assert.match(
  authorCreative,
  /variantsByBeat: isIdentityMode\s*\?\s*\[\]/,
  "Identity diagnostics must still report no variantsByBeat topology.",
);

assert.match(
  groundingVerifier,
  /SUBJECT_NAME is supplied identity reality\./,
  "Grounding must receive narrow authority for the supplied subject name in Identity mode.",
);

assert.match(
  groundingVerifier,
  /the name itself authorizes no action, place, relationship, motive, preference, occurrence, or factual state beyond SUPPLIED_REALITY\./,
  "Grounding must not let the subject name widen factual authority.",
);

assert.match(
  canonical,
  /verifyAuthorCreativeGrounding\(\{[\s\S]*?subject,/,
  "Canonical Author must pass the supplied subject into grounding.",
);

const identityEvidence = [
  { id: "event-1", text: "loves walks" },
  { id: "event-2", text: "loves bacon" },
  { id: "event-3", text: "loves small dogs" },
];

const nameAnchorSurvives = applyAuthorGroundingVerifications({
  scenes: [{
    text: "Milo has priorities.",
    kind: "line",
    sourceEventIds: ["event-1", "event-2", "event-3"],
  }],
  suppliedReality: identityEvidence,
  verifications: [{
    sceneIndex: 0,
    clauseIndex: 0,
    supported: true,
    supportKind: "FIGURATIVE",
    sourceEventIds: ["event-1", "event-2", "event-3"],
    concreteClaims: [],
    unsupportedClaims: [],
  }],
});

assert.equal(
  nameAnchorSurvives[0]?.text,
  "Milo has priorities.",
  "A supported Identity rhetorical subject-name anchor should survive grounding reconstruction.",
);

const inventedFactRejected = applyAuthorGroundingVerifications({
  scenes: [{
    text: "Milo moved to Paris.",
    kind: "line",
    sourceEventIds: ["event-1", "event-2", "event-3"],
  }],
  suppliedReality: identityEvidence,
  verifications: [{
    sceneIndex: 0,
    clauseIndex: 0,
    supported: false,
    supportKind: "UNSUPPORTED",
    sourceEventIds: [],
    concreteClaims: ["Milo moved to Paris"],
    unsupportedClaims: ["Milo moved to Paris"],
  }],
});

assert.equal(
  inventedFactRejected.length,
  0,
  "The supplied subject name alone must not authorize an invented action/place fact.",
);

console.log("AUTHOR IDENTITY NAME ANCHOR GREEN - OPTIONAL SUBJECT RHETORIC - NO FACTUAL WIDENING");
