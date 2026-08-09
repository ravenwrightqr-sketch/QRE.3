/**

* ============================================================
* QRE COGNITIVE COMPILER — INTELLIGENCE ACCEPTANCE MATRIX
* ============================================================
*
* PURPOSE:
* Exercise the cognitive compiler against radically different
* human prompts and verify that cognition discovers a direction
* rather than merely selecting a template.
*
* CANONICAL PIPELINE UNDER TEST:
*
* PROMPT
* ↓
* COGNITIVE UNDERSTANDING
* ↓
* EVIDENCE
* ↓
* MEANING
* ↓
* HYPOTHESES
* ↓
* OPPORTUNITY SPACE
* ↓
* SELECTED EXPERIENCE DIRECTION
* ↓
* COGNITIVE PLAN
* ↓
* UNIVERSAL COMPILATION
* ↓
* BLUEPRINT
* ↓
* FLOW
* ↓
* MOMENTS
* ↓
* CINEMATIC SCENES
*Do not contaminate this layer with prose generation.
* ARCHITECTURE RULE:
* THE UNIVERSAL COMPILER IS THE SUBSTRATE.
* COGNITION IS THE DECISION-MAKING LAYER.
*
* THIS TEST PROTECTS THAT SEPARATION.
*
* TEST RULE:
* Assert intelligence invariants and prompt-specific semantic fit.
* Do NOT require one fixed story shape for every domain.
* Do NOT encode a hidden template library into the test.
*
* ============================================================
  */

import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

type OpportunityKey =
| "memory"
| "geographic"
| "social"
| "discovery"
| "temporal"
| "commercial";

type CognitiveResult = ReturnType<typeof compileCognitiveExperience>;

type Expected = {
prompt: string;
subjectIncludes: string;
opportunity?: OpportunityKey;
};

const cases: Expected[] = [
{
prompt: "Create a memorial for my grandmother",
subjectIncludes: "memorial",
opportunity: "memory",
},
{
prompt: "Make a QR experience for a nightclub",
subjectIncludes: "nightclub",
opportunity: "social",
},
{
prompt: "Teach someone how to make sourdough",
subjectIncludes: "sourdough",
},
{
prompt: "Create a treasure hunt for kids",
subjectIncludes: "treasure hunt",
opportunity: "discovery",
},
{
prompt: "A luxury watch brand wants something mysterious",
subjectIncludes: "luxury watch brand",
opportunity: "discovery",
},
{
prompt: "I want to preserve my wedding day forever",
subjectIncludes: "wedding day",
opportunity: "memory",
},
{
prompt: "My dog is missing",
subjectIncludes: "dog",
},
{
prompt: "Create something completely weird involving aliens and a gas station",
subjectIncludes: "something completely weird",
},
{
prompt: "My grandfather's old truck is the only thing left from his life",
subjectIncludes: "grandfather's old truck",
opportunity: "memory",
},
{
prompt: "Make my surfboard feel like it has traveled more than I have",
subjectIncludes: "surfboard",
opportunity: "geographic",
},
{
prompt: "I run a tattoo shop but I don't want another boring loyalty program",
subjectIncludes: "tattoo shop",
opportunity: "commercial",
},
{
prompt: "Turn a musician's guitar pick into a portal into their universe",
subjectIncludes: "musician's guitar pick",
opportunity: "discovery",
},
{
prompt: "My dog just turned ten and I want her story to keep growing after I'm gone",
subjectIncludes: "dog",
opportunity: "memory",
},
];

function opportunityValues(
  cognition: CognitiveResult["cognition"],
  key: OpportunityKey,
): string[] {
  switch (key) {
    case "memory":
      return cognition.memoryOpportunities;

    case "geographic":
      return cognition.geographicOpportunities;

    case "social":
      return cognition.socialOpportunities;

    case "discovery":
      return cognition.discoveryOpportunities;

    case "temporal":
      return cognition.temporalOpportunities;

    case "commercial":
      return cognition.commercialOpportunities;

    default:
      throw new Error(`Unknown opportunity key: ${key}`);
  }
}

/**

* Arrays in the cognitive plan represent multiple discovered
* semantic possibilities. The compiler must produce meaningful
* entries rather than empty strings.
  */
  function assertMeaningfulStringArray(
  value: readonly string[],
  label: string,
  prompt: string,
  ): void {
  if (!Array.isArray(value)) {
  throw new Error(`Plan field '${label}' is not an array: ${prompt}`);
  }

if (
value.length === 0 ||
value.every(
(item) => typeof item !== "string" || item.trim().length === 0,
)
) {
throw new Error(`Plan has no meaningful ${label}: ${prompt}`);
}
}

/**

* ============================================================
* COGNITIVE CONTINUITY ASSERTION
* ============================================================
*
* This verifies that cognition survives the entire handoff:
*
* understanding
* ```
   ↓
  ```
* hypothesis
* ```
   ↓
  ```
* direction
* ```
   ↓
  ```
* plan
* ```
   ↓
  ```
* blueprint
* ```
   ↓
  ```
* runtime
*
* If any layer silently invents a different direction, this test
* should fail.
  */
  function assertCognitiveContinuity(
  prompt: string,
  result: CognitiveResult,
  ): void {
  const cognition = result.cognition;
  const plan = cognition.plan;
  const selected = cognition.selectedHypothesis;

if (!cognition.subject.value.trim()) {
throw new Error(`No subject understanding: ${prompt}`);
}

if (!cognition.hypotheses.length) {
throw new Error(`No hypotheses generated: ${prompt}`);
}

if (!selected.kind.trim()) {
throw new Error(`No selected experience direction: ${prompt}`);
}

if (!Number.isFinite(selected.score)) {
throw new Error(`Selected hypothesis has no score: ${prompt}`);
}

if (plan.direction !== selected.kind) {
throw new Error(
`Plan direction drifted from selected hypothesis: ${prompt}`,
);
}

if (!plan.centralSubject.trim()) {
throw new Error(`Plan has no central subject: ${prompt}`);
}

assertMeaningfulStringArray(
plan.whyInteract,
"interaction rationale",
prompt,
);

assertMeaningfulStringArray(
plan.interactionModel,
"interaction model",
prompt,
);

assertMeaningfulStringArray(
plan.storyStructure,
"story structure",
prompt,
);

assertMeaningfulStringArray(
plan.futureEvolution,
"future evolution",
prompt,
);

if (!result.blueprint.cognitivePlan) {
throw new Error(`Cognitive plan did not reach blueprint: ${prompt}`);
}

if (result.flowSteps.length !== result.moments.length) {
throw new Error(`Flow/moment continuity failed: ${prompt}`);
}

if (result.cinematicScenes.length !== result.moments.length) {
throw new Error(`Moment/scene continuity failed: ${prompt}`);
}
}

let passed = 0;

for (const test of cases) {
const result = compileCognitiveExperience(test.prompt);
const cognition = result.cognition;

const subject = cognition.subject.value.toLowerCase();
const expectedSubject = test.subjectIncludes.toLowerCase();

const subjectPass =
subject.includes(expectedSubject) ||
expectedSubject.includes(subject);

const opportunityPass = test.opportunity
? opportunityValues(cognition, test.opportunity).length > 0
: true;

assertCognitiveContinuity(test.prompt, result);

if (!subjectPass) {
throw new Error(
`Subject inference failed: expected '${test.subjectIncludes}', got '${cognition.subject.value}'`,
);
}

if (!opportunityPass) {
throw new Error(
`Expected ${test.opportunity} opportunity but none was inferred: ${test.prompt}`,
);
}

passed += 1;

console.log(`\nPASS: ${test.prompt}`);
console.log("  subject:", cognition.subject.value);
console.log(
"  hypotheses:",
cognition.hypotheses.map((item) => `${item.kind}:${item.score}`),
);
console.log(
"  selected:",
cognition.selectedHypothesis.kind,
);
console.log("  direction:", cognition.plan.direction);

console.log("  opportunities:", {
memory: cognition.memoryOpportunities,
geographic: cognition.geographicOpportunities,
social: cognition.socialOpportunities,
discovery: cognition.discoveryOpportunities,
temporal: cognition.temporalOpportunities,
commercial: cognition.commercialOpportunities,
});

console.log("  plan:", {
whyInteract: cognition.plan.whyInteract,
interaction: cognition.plan.interactionModel,
progression: cognition.plan.progressionModel,
dynamic: cognition.plan.dynamicBehavior,
future: cognition.plan.futureEvolution,
});

console.log("  runtime:", {
blueprint: result.blueprint.type,
flowSteps: result.flowSteps.length,
moments: result.moments.length,
cinematicScenes: result.cinematicScenes.length,
});
}

/**

* ============================================================
* DIFFERENT-INPUT / DIFFERENT-DIRECTION INVARIANT
* ============================================================
*
* The universal substrate may be shared.
*
* The cognition should NOT collapse unrelated prompts into the
* same experience direction merely because the same renderer can
* technically render both.
  */
  const memorial = compileCognitiveExperience(
  "Create a memorial for my grandmother",
  );

const nightclub = compileCognitiveExperience(
"Make a QR experience for a nightclub",
);

if (
memorial.cognition.selectedHypothesis.kind ===
nightclub.cognition.selectedHypothesis.kind
) {
throw new Error(
`Cognitive collapse: unrelated prompts selected the same direction '${memorial.cognition.selectedHypothesis.kind}'.`,
);
}

if (
memorial.cognition.plan.centralSubject ===
nightclub.cognition.plan.centralSubject
) {
throw new Error(
"Cognitive collapse: unrelated prompts produced the same central subject.",
);
}

console.log(
"\nPASS: unrelated prompts produce distinct cognitive directions",
);

console.log("\n============================================================");
console.log("COGNITIVE COMPILER INTELLIGENCE MATRIX COMPLETE");
console.log("============================================================");
console.log(`TOTAL: ${cases.length}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${cases.length - passed}`);
console.log("============================================================");
