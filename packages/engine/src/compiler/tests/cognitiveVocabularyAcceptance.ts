import type { MechanicSignal } from "../../experience/cognitiveMechanics.js";
import {
  inferCognitiveVocabulary,
  vocabularyBrief,
} from "../../experience/cognitiveVocabularyCore.js";
import { composeCognitiveTrajectory } from "../../experience/cognitiveTrajectory.js";

/**
 * GOAL
 * ----
 * Prove that expressive vocabulary is behavioral, compositional, and safely
 * carried into trajectory generation.
 *
 * PURPOSE
 * -------
 * Prevent the vocabulary layer from collapsing into synonyms, domain
 * templates, or abstract emotional prose.
 */

const signals = (...mechanics: MechanicSignal[]): MechanicSignal[] => mechanics;

const assertIncludes = (values: string[], expected: string, label: string) => {
  if (!values.includes(expected)) {
    throw new Error(`${label}: expected '${expected}', got [${values.join(", ")}]`);
  }
};

const luxury = inferCognitiveVocabulary({
  mechanics: signals(
    { mechanic: "excess", confidence: 0.97, evidence: ["disproportion"] },
    { mechanic: "transformation", confidence: 0.95, evidence: ["state change"] },
    { mechanic: "participation", confidence: 0.9, evidence: ["participant action"] },
  ),
});

const luxuryBrief = vocabularyBrief(luxury);
assertIncludes(luxuryBrief, "excess", "luxury vocabulary");
assertIncludes(luxuryBrief, "spectacle", "luxury vocabulary");
assertIncludes(luxuryBrief, "indulgence", "luxury vocabulary");
assertIncludes(luxuryBrief, "delight", "luxury vocabulary");

const horror = inferCognitiveVocabulary({
  mechanics: signals(
    { mechanic: "uncertainty", confidence: 0.96, evidence: ["threat"] },
    { mechanic: "escalation", confidence: 0.9, evidence: ["rising danger"] },
    { mechanic: "reveal", confidence: 0.94, evidence: ["hidden thing"] },
  ),
});

const horrorBrief = vocabularyBrief(horror);
assertIncludes(horrorBrief, "suspense", "horror vocabulary");
assertIncludes(horrorBrief, "anticipation", "horror vocabulary");
assertIncludes(horrorBrief, "revelation", "horror vocabulary");

const memory = inferCognitiveVocabulary({
  mechanics: signals(
    { mechanic: "memory", confidence: 0.96, evidence: ["past state"] },
    { mechanic: "continuation", confidence: 0.95, evidence: ["future state"] },
    { mechanic: "contribution", confidence: 0.8, evidence: ["new material"] },
    { mechanic: "accumulation", confidence: 0.95, evidence: ["growing whole"] },
  ),
});

const memoryBrief = vocabularyBrief(memory);
assertIncludes(memoryBrief, "memory", "memory vocabulary");
assertIncludes(memoryBrief, "legacy", "memory vocabulary");
assertIncludes(memoryBrief, "progression", "memory vocabulary");
assertIncludes(memoryBrief, "continuity", "memory vocabulary");

const trajectory = composeCognitiveTrajectory({});
if (!trajectory.vocabulary.length) {
  throw new Error("trajectory did not preserve expressive vocabulary");
}
if (!trajectory.beats.includes("orientation")) {
  throw new Error("trajectory lost experiential entry point");
}
if (!trajectory.beats.includes("payoff")) {
  throw new Error("trajectory lost payoff");
}

console.log("✓ luxury vocabulary: excess / spectacle / indulgence / delight");
console.log("✓ horror vocabulary: suspense / anticipation / revelation");
console.log("✓ memory vocabulary: memory / legacy / progression / continuity");
console.log("✓ vocabulary survives into cognitive trajectory");
console.log("✓ Mega Cog expressive vocabulary acceptance passed");
