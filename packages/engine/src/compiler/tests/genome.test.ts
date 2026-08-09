/**
 * =============================================================
 * QRE SUPER COG — INTELLIGENCE ACCEPTANCE MATRIX
 * =============================================================
 *
 * The substrate may stay universal.
 * Cognition must stay prompt-native.
 *
 * This suite protects:
 * - subject authority
 * - hypothesis generation
 * - direction selection
 * - opportunity discovery
 * - plan continuity
 * - variable realization
 * - flow/moment/scene continuity
 * - absence of legacy template phrases
 *
 * =============================================================
 */

import {
  compileCognitiveExperience,
} from "../../experience/cognitiveExperienceCompiler.js";

type OpportunityKey =
  | "memory"
  | "geographic"
  | "social"
  | "discovery"
  | "temporal"
  | "commercial";

type Expected = {
  prompt: string;
  subjectIncludes: string;
  opportunity?: OpportunityKey;
};

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

function opportunityValues(cognition: ReturnType<typeof compileCognitiveExperience>["cognition"], key: OpportunityKey): string[] {
  return cognition[`${key}Opportunities` as `${OpportunityKey}Opportunities`] ?? [];
}

function assertMeaningfulStringArray(value: readonly string[], label: string, prompt: string): void {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`Plan has no meaningful ${label}: ${prompt}`);
  }
}

function assertCognitiveContinuity(prompt: string, result: ReturnType<typeof compileCognitiveExperience>): void {
  const cognition = result.cognition;
  const plan = cognition.plan;
  const selected = cognition.selectedHypothesis;

  if (!cognition.subject.value.trim()) throw new Error(`No subject understanding: ${prompt}`);
  if (!cognition.hypotheses.length) throw new Error(`No hypotheses generated: ${prompt}`);
  if (!selected.kind.trim()) throw new Error(`No selected experience direction: ${prompt}`);
  if (!Number.isFinite(selected.score)) throw new Error(`Selected hypothesis has no score: ${prompt}`);
  if (plan.direction !== selected.kind) throw new Error(`Plan direction drifted: ${prompt}`);
  if (plan.centralSubject !== cognition.subject.value) throw new Error(`Plan subject drifted: ${prompt}`);

  assertMeaningfulStringArray(plan.whyInteract, "interaction rationale", prompt);
  assertMeaningfulStringArray(plan.interactionModel, "interaction model", prompt);
  assertMeaningfulStringArray(plan.storyStructure, "story structure", prompt);
  assertMeaningfulStringArray(plan.futureEvolution, "future evolution", prompt);

  if (!result.blueprint.cognitivePlan) throw new Error(`Cognitive plan did not reach blueprint: ${prompt}`);
  if (result.flowSteps.length !== result.moments.length) throw new Error(`Flow/moment continuity failed: ${prompt}`);
  if (result.cinematicScenes.length !== result.moments.length) throw new Error(`Moment/scene continuity failed: ${prompt}`);
  if (result.story.beats.length !== result.moments.length) throw new Error(`Beat/moment continuity failed: ${prompt}`);
}

let passed = 0;

for (const test of cases) {
  const result = compileCognitiveExperience(test.prompt);
  const subject = result.cognition.subject.value.toLowerCase();
  const expected = test.subjectIncludes.toLowerCase();
  const subjectPass = subject.includes(expected) || expected.includes(subject);

  assertCognitiveContinuity(test.prompt, result);

  if (!subjectPass) {
    throw new Error(`Subject inference failed: expected '${test.subjectIncludes}', got '${result.cognition.subject.value}'`);
  }

  if (test.opportunity && opportunityValues(result.cognition, test.opportunity).length === 0) {
    throw new Error(`Expected ${test.opportunity} opportunity: ${test.prompt}`);
  }

  passed += 1;
}

const memorial = compileCognitiveExperience("Create a memorial for my grandmother");
const nightclub = compileCognitiveExperience("Make a QR experience for a nightclub");

if (memorial.cognition.selectedHypothesis.kind === nightclub.cognition.selectedHypothesis.kind) {
  throw new Error("Cognitive collapse: memorial and nightclub selected the same direction.");
}

if (memorial.cognition.plan.centralSubject === nightclub.cognition.plan.centralSubject) {
  throw new Error("Cognitive collapse: unrelated prompts produced the same subject.");
}

console.log(`SUPER COG ACCEPTANCE: ${passed}/${cases.length} passed`);
