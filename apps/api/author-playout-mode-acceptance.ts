import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sourceMoments = [
  "9:04 AM Maria started the housekeeping service",
  "Maria cleaned the kitchen",
  "Maria cleaned bathroom one",
  "Maria cleaned bathroom two",
  "11:47 AM Maria finished the housekeeping service",
];

const result = await authorBrainCanonical({
  prompt: "Send the service receipt.",
  subject: "Maria",
  playoutMode: "operational",
  movieMode: false,
  facts: [],
  sourceMoments,
  memoryContext: [
    "Maria likes jazz",
    "This business has worked with Maria before",
  ],
  trajectory: [],
  domainContext: {
    category: "business",
    businessType: "housekeeping",
    businessName: "Example Housekeeping",
    serviceType: "housekeeping",
    serviceName: "home cleaning",
    subjectKind: "person",
  },
});

const visible = result.scenes
  .map((scene) => scene.text)
  .join(" ");

assert(
  result.diagnostics.modelCalls === 0,
  "Operational receipt invoked a model.",
);

assert(
  result.diagnostics.truthSafe === true,
  "Operational receipt was not truth-safe.",
);

assert(
  result.diagnostics.authored === false,
  "Operational receipt incorrectly claimed creative authorship.",
);

assert(
  result.diagnostics.qualityStatus === "ACCEPTED",
  "Operational receipt was not accepted as a factual playout.",
);

assert(
  /kitchen/i.test(visible) &&
    /bathroom one/i.test(visible) &&
    /bathroom two/i.test(visible),
  "Operational receipt dropped supplied service events.",
);

assert(
  !/jazz/i.test(visible),
  "Operational receipt replayed remembered personal context as current service reality.",
);

assert(
  !/\b(?:homeowner|home owner|tenant|renter|landlord|occupant|resident|airbnb host|host|guest|client|customer|owner)\b/i.test(
    visible,
  ),
  "Operational receipt invented an unsupplied relationship role.",
);

console.log("AUTHOR PLAYOUT MODE ACCEPTANCE");
console.log(
  JSON.stringify(
    {
      scenes: result.scenes,
      diagnostics: result.diagnostics,
      status: "PASS",
    },
    null,
    2,
  ),
);
