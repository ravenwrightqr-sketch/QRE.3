import { buildMovieCognition } from "./src/services/authorMovieCognition.js";
import type { AuthorBrainTruth } from "@qre/contracts";

const input: AuthorBrainTruth = {
  subject: "Coco",
  facts: [
    "came in nervous",
    "got a bath",
    "stole a blue bow",
    "left looking fabulous",
  ],
  sourceMoments: [],
  memoryContext: [],
  presenceSummary: [],
  trajectory: [],
  prompt: "Write a 5-line sequence about Coco. Final line: Peace was temporary.",
};

const cognition = buildMovieCognition(input, "Peace was temporary.");
const selected = cognition.selected;
const sourceIndexByText = new Map(cognition.facts.map((fact) => [fact.text, fact.index]));
const indices = selected.trajectory.map((text) => sourceIndexByText.get(text)).filter((value): value is number => value !== undefined);

if (!selected.states.length) throw new Error("COGNITIVE STATE INVARIANT FAILED: no state transitions");
if (indices.some((value, index) => index > 0 && value < indices[index - 1]!)) {
  throw new Error(`COGNITIVE CHRONOLOGY INVARIANT FAILED: ${indices.join(" -> ")}`);
}
if (selected.trajectory.some((text) => !sourceIndexByText.has(text))) {
  throw new Error("COGNITIVE REALITY INVARIANT FAILED: trajectory contains an unsupplied fact");
}

console.log("PASS cognitive-state chronology");
console.log(`SELECTED=${selected.operation}`);
console.log(`TRAJECTORY=${selected.trajectory.join(" | ")}`);
console.log(`STATES=${selected.states.length}`);
