/** QRE SUPER COG — INTELLIGENCE ACCEPTANCE MATRIX */

import { compileSuperCogExperience } from "../../experience/superCogContext.js";

type OpportunityKey = "memory" | "geographic" | "social" | "discovery" | "temporal" | "commercial";
type Expected = { prompt: string; subjectIncludes: string; opportunity?: OpportunityKey };

const cases: Expected[] = [
  { prompt: "Create a memorial for my grandmother", subjectIncludes: "memorial", opportunity: "memory" },
  { prompt: "Make a QR experience for a nightclub", subjectIncludes: "nightclub", opportunity: "social" },
  { prompt: "Teach someone how to make sourdough", subjectIncludes: "sourdough" },
  { prompt: "Create a treasure hunt for kids", subjectIncludes: "treasure hunt", opportunity: "discovery" },
  { prompt: "A luxury watch brand wants something mysterious", subjectIncludes: "luxury watch brand", opportunity: "discovery" },
  { prompt: "I want to preserve my wedding day forever", subjectIncludes: "wedding day", opportunity: "memory" },
  { prompt: "My dog is missing", subjectIncludes: "dog" },
  { prompt: "Create something completely weird involving aliens and a gas station", subjectIncludes: "something completely weird" },
  { prompt: "My grandfather's old truck is the only thing left from his life", subjectIncludes: "grandfather's old truck", opportunity: "memory" },
  { prompt: "Make my surfboard feel like it has traveled more than I have", subjectIncludes: "surfboard", opportunity: "geographic" },
  { prompt: "I run a tattoo shop but I don't want another boring loyalty program", subjectIncludes: "tattoo shop", opportunity: "commercial" },
  { prompt: "Turn a musician's guitar pick into a portal into their universe", subjectIncludes: "musician's guitar pick", opportunity: "discovery" },
  { prompt: "My dog just turned ten and I want her story to keep growing after I'm gone", subjectIncludes: "dog", opportunity: "memory" },
];

function opportunityValues(cognition: ReturnType<typeof compileSuperCogExperience>["cognition"], key: OpportunityKey): string[] {
  return cognition[`${key}Opportunities` as `${OpportunityKey}Opportunities`] ?? [];
}

function assertMeaningful(value: readonly string[], label: string, prompt: string): void {
  if (!value.length || value.some((item) => !item.trim())) throw new Error(`No meaningful ${label}: ${prompt}`);
}

function assertContinuity(prompt: string, result: ReturnType<typeof compileSuperCogExperience>): void {
  const { cognition } = result;
  if (!cognition.subject.value.trim()) throw new Error(`No subject: ${prompt}`);
  if (!cognition.hypotheses.length) throw new Error(`No hypotheses: ${prompt}`);
  if (!Number.isFinite(cognition.selectedHypothesis.score)) throw new Error(`No hypothesis score: ${prompt}`);
  if (cognition.plan.direction !== cognition.selectedHypothesis.kind) throw new Error(`Direction drift: ${prompt}`);
  if (cognition.plan.centralSubject !== cognition.subject.value) throw new Error(`Subject drift: ${prompt}`);
  assertMeaningful(cognition.plan.whyInteract, "interaction rationale", prompt);
  assertMeaningful(cognition.plan.interactionModel, "interaction model", prompt);
  assertMeaningful(cognition.plan.storyStructure, "story structure", prompt);
  assertMeaningful(cognition.plan.futureEvolution, "future evolution", prompt);
  if (!result.blueprint.cognitivePlan) throw new Error(`Plan lost at blueprint: ${prompt}`);
  if (result.flowSteps.length !== result.moments.length) throw new Error(`Flow/moment mismatch: ${prompt}`);
  if (result.cinematicScenes.length !== result.moments.length) throw new Error(`Moment/scene mismatch: ${prompt}`);
  if (result.story.beats.length !== result.moments.length) throw new Error(`Beat/moment mismatch: ${prompt}`);
}

let passed = 0;
for (const test of cases) {
  const result = compileSuperCogExperience(test.prompt);
  const subject = result.cognition.subject.value.toLowerCase();
  const expected = test.subjectIncludes.toLowerCase();
  assertContinuity(test.prompt, result);
  if (!subject.includes(expected) && !expected.includes(subject)) throw new Error(`Subject inference failed: expected '${test.subjectIncludes}', got '${result.cognition.subject.value}'`);
  if (test.opportunity && !opportunityValues(result.cognition, test.opportunity).length) throw new Error(`Expected ${test.opportunity} opportunity: ${test.prompt}`);
  passed += 1;
}

const memorial = compileSuperCogExperience("Create a memorial for my grandmother");
const nightclub = compileSuperCogExperience("Make a QR experience for a nightclub");
if (memorial.cognition.selectedHypothesis.kind === nightclub.cognition.selectedHypothesis.kind) throw new Error("Cognitive collapse between memorial and nightclub.");
if (memorial.cognition.plan.centralSubject === nightclub.cognition.plan.centralSubject) throw new Error("Subject collapse between unrelated prompts.");

const remembered = compileSuperCogExperience("Max came back to the same groomer", {
  memories: [{ summary: "Max's earlier grooming visit", entities: ["Max", "groomer"] }],
});
if (!remembered.cognition.plan.memoryModel.length) throw new Error("Accumulated memory did not reach the cognitive plan.");
if (remembered.genome.memory < 0.9) throw new Error("Accumulated memory did not reach the genome.");

console.log(`SUPER COG ACCEPTANCE: ${passed}/${cases.length} passed + memory context`);
