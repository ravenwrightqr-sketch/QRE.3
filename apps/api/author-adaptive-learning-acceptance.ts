import assert from "node:assert/strict";
import type { AuthorBrainTruth, AuthorResult, CognitiveAuthorContext } from "@qre/contracts";
import { isMemorialContext, resolveLearnedCreativeLens } from "./src/services/authorCreativeLearningPressure.js";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

function selectedLens(result: AuthorResult): string {
  const field = result.field;
  const cognition = field.movieCognition;
  if (!cognition || typeof cognition !== "object" || Array.isArray(cognition)) throw new Error("adaptive acceptance: missing movieCognition");
  const selected = (cognition as Record<string, unknown>).selected;
  if (!selected || typeof selected !== "object" || Array.isArray(selected)) throw new Error("adaptive acceptance: missing selected hypothesis");
  const lens = (selected as Record<string, unknown>).lens;
  if (!lens || typeof lens !== "object" || Array.isArray(lens)) throw new Error("adaptive acceptance: missing selected lens");
  const id = (lens as Record<string, unknown>).id;
  if (typeof id !== "string" || !id) throw new Error("adaptive acceptance: missing selected lens id");
  return id;
}

function realityPacket(result: AuthorResult): string[] {
  const packet = result.field.packet;
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) throw new Error("adaptive acceptance: missing packet");
  const reality = (packet as Record<string, unknown>).reality;
  if (!Array.isArray(reality) || !reality.every((value) => typeof value === "string")) {
    throw new Error("adaptive acceptance: missing reality packet");
  }
  return reality;
}

const baseContext: CognitiveAuthorContext = {
  creativeLearning: {
    accepted: [],
    rejected: [],
    preferences: [],
    successfulLenses: [],
    avoidedPatterns: [],
    usedPhrases: [],
    noveltyPressure: 0.5,
  },
  textBeatTarget: 5,
  photoBeatsAreSilent: true,
};

const base: AuthorBrainTruth = {
  prompt: "Write a 5-line sequence about Coco. Final line: Peace was temporary.",
  subject: "Coco",
  lens: "neutral",
  facts: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  sourceMoments: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  memoryContext: ["returns for grooming"],
  creativeLearningContext: [],
  trajectory: ["hook", "question", "turn", "escalation", "payoff"],
  cognitiveContext: baseContext,
};

const baseline = await authorMoviePipeline(base);
const baselineLens = selectedLens(baseline.authored);
assert.ok(baselineLens, "baseline author must expose the selected movie lens");

const learnedContext: CognitiveAuthorContext = {
  ...baseContext,
  creativeLearning: {
    ...baseContext.creativeLearning,
    successfulLenses: ["BEHAVIORAL_WINNER: courtroom / compact / cinematic-request"],
    accepted: ["account preference: preferred courtroom framing"],
    rejected: ["account preference: rejected deadpan style"],
    avoidedPatterns: ["deadpan"],
  },
};

const learnedLens = resolveLearnedCreativeLens(learnedContext);
assert.equal(learnedLens, "courtroom");

const learned = await authorMoviePipeline({
  ...base,
  cognitiveContext: learnedContext,
});
const learnedSelectedLens = selectedLens(learned.authored);
assert.equal(learnedSelectedLens, "courtroom");
assert.notEqual(learnedSelectedLens, baselineLens, "learned selection must materially change the creative competition");

const explicit = await authorMoviePipeline({
  ...base,
  lens: "noir",
  cognitiveContext: learnedContext,
});
const explicitSelectedLens = selectedLens(explicit.authored);
assert.equal(explicitSelectedLens, "noir", "explicit lens intent must outrank learned preference outside protected contexts");

const rejectedOnly: CognitiveAuthorContext = {
  ...baseContext,
  creativeLearning: {
    ...baseContext.creativeLearning,
    rejected: ["rejected courtroom"],
    avoidedPatterns: ["courtroom"],
  },
};
assert.equal(resolveLearnedCreativeLens(rejectedOnly), undefined, "rejected-only learning must not create a lens preference");

const memorialContext: CognitiveAuthorContext = {
  ...learnedContext,
  creativeLearning: {
    ...learnedContext.creativeLearning,
    successfulLenses: ["BEHAVIORAL_WINNER: spy / memorial request"],
  },
};
assert.equal(isMemorialContext(["memorial experience"]), true);
assert.equal(resolveLearnedCreativeLens(memorialContext), undefined, "memorial learning must not produce a learned lens");

const memorial: AuthorBrainTruth = {
  ...base,
  prompt: "Create a memorial experience remembering Coco.",
  lens: "spy",
  cognitiveContext: memorialContext,
};
const memorialResult = await authorMoviePipeline(memorial);
assert.equal(selectedLens(memorialResult.authored), "neutral", "memorial contexts must never become incompatible genre experiences");

assert.deepEqual(
  base.facts,
  realityPacket(learned.authored).slice(2, 6),
  "learning must not rewrite the supplied reality packet",
);

console.log("AUTHOR ADAPTIVE LEARNING ACCEPTANCE: PASS");
console.log(`baselineLens=${baselineLens}`);
console.log(`learnedLens=${learnedSelectedLens}`);
console.log(`explicitLens=${explicitSelectedLens}`);
console.log("memorialLens=neutral");
console.log("realityPreserved=true");
