/*
 * QRE COGNITION HUMAN-EYE PROBE
 *
 * Purpose:
 * Test the real production RealityGraph -> Cognition boundary without invoking
 * Creative Realizer, artifact judging, SequencePlay, or retries downstream.
 *
 * This is deliberately ONE boundary at a time.
 */
import assert from "node:assert/strict";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";

type CaseName = "relationship" | "milo" | "housekeeping";

const CASES = {
  relationship: {
    prompt: "Create the living relationship memory experience from the supplied reality.",
    subject: "Alex",
    facts: [
      "Met Alex",
      "Felt nervous before meeting",
      "Kept talking for two hours",
      "Felt lighter afterward",
      "Met Alex again a week later",
    ],
    returning: true,
    visitNumber: 2,
  },
  milo: {
    prompt: "Create Milo's current experience from the supplied character reality.",
    subject: "Milo",
    facts: [
      "Milo loves walks",
      "Milo loves bacon",
      "Milo likes small dogs",
    ],
    returning: false,
    visitNumber: 1,
  },
  housekeeping: {
    prompt: "Create the post-service customer experience for a housekeeping company.",
    subject: "housekeeping service",
    facts: [
      "Arrived at 9:04 AM",
      "Cleaned the kitchen",
      "Cleaned two bathrooms",
      "Finished at 11:47 AM",
    ],
    returning: false,
    visitNumber: 1,
  },
} as const;

const requested = String(process.env.QRE_AUTHOR_CASE ?? "relationship").trim().toLowerCase();
assert.ok(requested in CASES, `Unknown QRE_AUTHOR_CASE: ${requested}`);
const name = requested as CaseName;
const input = CASES[name];

const graph = buildAuthorRealityGraph({
  prompt: input.prompt,
  subject: input.subject,
  facts: [...input.facts],
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

console.log(`\n=== QRE COGNITION HUMAN-EYE / ${name.toUpperCase()} ===`);

console.log("\nINPUT");
for (const fact of input.facts) console.log(`- ${fact}`);

console.log("\nREALITY");
for (const event of graph.events) {
  console.log(`- ${event.id}: ${event.label}`);
}

console.log("\nRELATIONS BEFORE MODEL");
for (const relation of graph.relations) {
  console.log(`- ${relation.from} -> ${relation.to} :: ${relation.kind} :: ${relation.strength}`);
}

const cognition = await buildAuthorCognitivePlan({
  prompt: input.prompt,
  subject: input.subject,
  facts: [...input.facts],
  sourceMoments: [],
  realityGraph: graph,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  returning: input.returning,
  visitNumber: input.visitNumber,
  movieMode: true,
});

console.log("\nMODEL");
console.log("MODEL:", cognition.model);
console.log("MODEL CALLS:", cognition.modelCalls);

console.log("\nINTERPRETATIONS");
for (const item of cognition.interpretations) {
  console.log(`- ${item.thesis}`);
  console.log(`  evidence: ${item.evidenceEventIds.join(", ")}`);
  console.log(`  opportunity: ${item.creativeOpportunity}`);
}

console.log("\nCANDIDATE STRUCTURES");
for (const candidate of cognition.latentMovieCandidates) {
  console.log(`\n[${candidate.id}] score=${candidate.score}`);
  console.log(`meaning: ${candidate.hypothesis.join(" | ")}`);
  console.log(`anchors: ${candidate.anchorEventIds.join(", ")}`);
  for (const step of candidate.trajectory) {
    console.log(`  ${step.order}. ${step.operation} [${step.eventIds.join(", ")}] :: ${step.viewerChange}`);
  }
}

console.log("\nSELECTED");
console.log("ID:", cognition.selectedMovie?.id ?? "NONE");
console.log("MEANING:", cognition.selectedMovie?.hypothesis.join(" | ") ?? "NONE");
console.log("ATTENTION:", cognition.attentionStrategy);
console.log("LENS:", cognition.selectedLens);

assert.ok(cognition.selectedMovie, "Cognition selected no grounded structure");
assert.ok(
  cognition.selectedMovie.anchorEventIds.every((id) => graph.events.some((event) => event.id === id)),
  "Selected structure contains unknown evidence",
);

console.log("\nHUMAN-EYE BAR");
console.log("- Did QRE notice something that exists only when multiple facts are considered together?");
console.log("- Is the selected meaning stronger than a fact list?");
console.log("- Did it avoid inventing psychology, relationship status, motive, or new events?");
console.log("- Is there enough accumulated meaning for a Realizer to express without explaining?");
console.log("\nSTOP HERE. DO NOT TEST REALIZER UNTIL THIS BOUNDARY IS GOOD.");
