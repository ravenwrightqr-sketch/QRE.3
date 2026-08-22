import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { resolveLearnedCreativeLens } from "./src/services/authorCreativeLearningPressure.js";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

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
const baselineLens = String((baseline.authored.field as any)?.movieCognition?.selected?.lens?.id ?? "");
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
const learnedSelectedLens = String((learned.authored.field as any)?.movieCognition?.selected?.lens?.id ?? "");
assert.equal(learnedSelectedLens, "courtroom");
assert.notEqual(learnedSelectedLens, baselineLens, "learned selection must materially change the creative competition");

const explicit = await authorMoviePipeline({
  ...base,
  lens: "noir",
  cognitiveContext: learnedContext,
});
const explicitSelectedLens = String((explicit.authored.field as any)?.movieCognition?.selected?.lens?.id ?? "");
assert.equal(explicitSelectedLens, "noir", "explicit lens intent must outrank learned preference");

const rejectedOnly: CognitiveAuthorContext = {
  ...baseContext,
  creativeLearning: {
    ...baseContext.creativeLearning,
    rejected: ["rejected courtroom"],
    avoidedPatterns: ["courtroom"],
  },
};
assert.equal(resolveLearnedCreativeLens(rejectedOnly), undefined, "rejected-only learning must not create a lens preference");

assert.deepEqual(base.facts, learned.authored.field?.packet?.reality?.slice(2, 6), "learning must not rewrite the supplied reality packet");

console.log("AUTHOR ADAPTIVE LEARNING ACCEPTANCE: PASS");
console.log(`baselineLens=${baselineLens}`);
console.log(`learnedLens=${learnedSelectedLens}`);
console.log(`explicitLens=${explicitSelectedLens}`);
console.log("realityPreserved=true");
