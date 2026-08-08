import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

type OpportunityKey = "memory" | "geographic" | "social" | "discovery" | "temporal" | "commercial";
type Expected = {
  prompt: string;
  subjectIncludes: string;
  hypothesis: string;
  opportunity?: OpportunityKey;
};

const cases: Expected[] = [
  { prompt: "Create a memorial for my grandmother", subjectIncludes: "memorial", hypothesis: "memory", opportunity: "memory" },
  { prompt: "Make a QR experience for a nightclub", subjectIncludes: "nightclub", hypothesis: "identity" },
  { prompt: "Teach someone how to make sourdough", subjectIncludes: "sourdough", hypothesis: "utility" },
  { prompt: "Create a treasure hunt for kids", subjectIncludes: "treasure hunt", hypothesis: "game" },
  { prompt: "A luxury watch brand wants something mysterious", subjectIncludes: "luxury watch brand", hypothesis: "discovery" },
  { prompt: "I want to preserve my wedding day forever", subjectIncludes: "wedding day", hypothesis: "memory", opportunity: "memory" },
  { prompt: "My dog is missing", subjectIncludes: "dog", hypothesis: "utility" },
  { prompt: "Create something completely weird involving aliens and a gas station", subjectIncludes: "something completely weird", hypothesis: "story" },
  { prompt: "My grandfather's old truck is the only thing left from his life", subjectIncludes: "grandfather's old truck", hypothesis: "memory", opportunity: "memory" },
  { prompt: "Make my surfboard feel like it has traveled more than I have", subjectIncludes: "surfboard", hypothesis: "journey", opportunity: "geographic" },
  { prompt: "I run a tattoo shop but I don't want another boring loyalty program", subjectIncludes: "tattoo shop", hypothesis: "commerce", opportunity: "commercial" },
  { prompt: "Turn a musician's guitar pick into a portal into their universe", subjectIncludes: "musician's guitar pick", hypothesis: "discovery", opportunity: "discovery" },
  { prompt: "My dog just turned ten and I want her story to keep growing after I'm gone", subjectIncludes: "dog", hypothesis: "memory", opportunity: "memory" },
];

function opportunityValues(cognition: ReturnType<typeof compileCognitiveExperience>["cognition"], key: OpportunityKey): string[] {
  switch (key) {
    case "memory": return cognition.memoryOpportunities;
    case "geographic": return cognition.geographicOpportunities;
    case "social": return cognition.socialOpportunities;
    case "discovery": return cognition.discoveryOpportunities;
    case "temporal": return cognition.temporalOpportunities;
    case "commercial": return cognition.commercialOpportunities;
  }
}

let passed = 0;

for (const test of cases) {
  const result = compileCognitiveExperience(test.prompt);
  const cognition = result.cognition;
  const subject = cognition.subject.value.toLowerCase();
  const expectedSubject = test.subjectIncludes.toLowerCase();
  const subjectPass = subject.includes(expectedSubject) || expectedSubject.includes(subject);
  const hypothesisPass = cognition.selectedHypothesis.kind === test.hypothesis;
  const planPass = Boolean(
    cognition.plan.centralSubject &&
    cognition.plan.whyInteract.length &&
    cognition.plan.interactionModel.length &&
    cognition.plan.storyStructure.length &&
    cognition.plan.futureEvolution.length,
  );
  const opportunityPass = test.opportunity ? opportunityValues(cognition, test.opportunity).length > 0 : true;
  const runtimePass = Boolean(
    result.blueprint.cognitivePlan &&
    result.flowSteps.length === result.moments.length &&
    result.cinematicScenes.length === result.moments.length,
  );

  const ok = subjectPass && hypothesisPass && planPass && opportunityPass && runtimePass;
  if (ok) passed += 1;

  console.log(`\n${ok ? "PASS" : "FAIL"}: ${test.prompt}`);
  console.log("  subject:", cognition.subject);
  console.log("  hypothesis:", cognition.selectedHypothesis.kind, cognition.selectedHypothesis.score);
  console.log("  dimensions:", cognition.selectedHypothesis.dimensions);
  console.log("  emotional:", cognition.emotionalIntent);
  console.log("  affordances:", cognition.affordances);
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
    creative: cognition.plan.creativePossibilities,
  });

  if (!subjectPass) throw new Error(`Subject inference failed: expected ${test.subjectIncludes}, got ${cognition.subject.value}`);
  if (!hypothesisPass) throw new Error(`Hypothesis inference failed: expected ${test.hypothesis}, got ${cognition.selectedHypothesis.kind}`);
  if (!planPass) throw new Error("Cognitive plan is incomplete.");
  if (!opportunityPass) throw new Error(`Expected ${test.opportunity} opportunity but none was inferred.`);
  if (!runtimePass) throw new Error("Cognitive result did not compile into a complete runtime shape.");
}

console.log("\n============================================================");
console.log("COGNITIVE EXPERIENCE MATRIX COMPLETE");
console.log("============================================================");
console.log(`TOTAL: ${cases.length}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${cases.length - passed}`);
console.log("============================================================");
