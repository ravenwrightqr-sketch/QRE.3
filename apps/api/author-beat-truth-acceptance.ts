import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const suppliedFacts = [
  "Coco was groomed at Elm Street Grooming on Friday.",
  "Coco stole the red bow.",
  "Coco left looking fabulous.",
];

const result = await groundAuthorBeat({
  subject: "Coco",
  facts: suppliedFacts,
  moments: [],
  memory: [],
  beat: {
    order: 1,
    role: "escalation",
    gainKind: "reinterpretation",
    change: "The red bow changes the reading of the grooming.",
    frontier: "What the stolen bow now means.",
    nextNeed: "Push the existing meaning further.",
    necessity: "The beat should make the supplied sequence feel sharper.",
  },
});

/*
 * The complete supplied truth set must survive the gate.
 */
for (const fact of suppliedFacts) {
  assert(
    result.approvedEvidence.includes(fact),
    `TRUTH GATE FAILURE: supplied fact was dropped: "${fact}"`,
  );
}

/*
 * The gate may select/interpret evidence, but its creative opportunity
 * must not become a concrete scene claim.
 */
const opportunity = result.creativeOpportunity.toLowerCase();

const forbiddenConcreteClaims = [
  /\bsmiled?\b/,
  /\blaughed?\b/,
  /\bwalked?\b/,
  /\bran\b/,
  /\bsat\b/,
  /\bstood\b/,
  /\bopened?\b/,
  /\bclosed?\b/,
  /\bheld\b/,
  /\btouched?\b/,
  /\blooked?\s+at\b/,
  /\bsaw\b/,
  /\bnoticed?\b/,
  /\bwhispered?\b/,
  /\bshouted?\b/,
  /\broom\b/,
  /\bwindow\b/,
  /\bdoor\b/,
  /\bchair\b/,
  /\btable\b/,
  /\blights?\b/,
  /\bsunset\b/,
  /\bsunlight\b/,
  /\bweather\b/,
  /\bpeople\b/,
  /\beveryone\b/,
  /\bsomeone\b/,
  /\bnobody\b/,
  /\bsurprised?\b/,
  /\bshocked?\b/,
  /\bcried?\b/,
  /\bbody\b/,
  /\bface\b/,
  /\boutcome\b/,
];

for (const pattern of forbiddenConcreteClaims) {
  assert(
    !pattern.test(opportunity),
    `TRUTH GATE LEAK: creativeOpportunity contains unsupported concrete claim: ${pattern}`,
  );
}

/*
 * The gate must retain a usable evidence-backed opportunity.
 */
assert(
  result.creativeOpportunity.trim().length > 0,
  "TRUTH GATE FAILURE: creative opportunity is empty.",
);

assert(
  result.sourceBoundary.includes(
    "upstream beat is never evidence",
  ),
  "TRUTH GATE FAILURE: source boundary contract disappeared.",
);

assert(
  result.sourceBoundary.includes(
    "Approved evidence is the complete supplied truth set",
  ),
  "TRUTH GATE FAILURE: approved evidence boundary disappeared.",
);

/*
 * Forbidden claims are allowed as diagnostics, but the truth gate must
 * never put them into approvedEvidence.
 */
for (const forbidden of result.forbiddenClaims) {
  assert(
    !result.approvedEvidence.includes(forbidden),
    `TRUTH GATE LEAK: forbidden claim entered approved evidence: "${forbidden}"`,
  );
}

/*
 * Concrete source material remains the only thing authoritatively approved.
 */
assert(
  result.approvedEvidence.every(
    (value) =>
      suppliedFacts.includes(value) ||
      value === undefined,
  ),
  "TRUTH GATE LEAK: approved evidence contains material outside supplied truth.",
);

console.log(
  "AUTHOR BEAT TRUTH ACCEPTANCE: PASS",
);

console.log(
  `ApprovedEvidence=${result.approvedEvidence.length}`,
);

console.log(
  `ForbiddenClaims=${result.forbiddenClaims.length}`,
);

console.log(
  `CreativeOpportunity=${result.creativeOpportunity}`,
);