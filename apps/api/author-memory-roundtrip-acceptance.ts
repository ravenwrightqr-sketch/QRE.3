import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import {
  buildAuthorExperienceState,
  summarizeAuthorExperienceState,
} from "./src/services/authorExperienceState.js";
import {
  authorExperienceMemoryContext,
  authorExperienceStateToMemoryBatch,
  extractAuthorExperienceStates,
} from "./src/services/authorExperienceMemory.js";
import type { MemoryContext } from "@qre/contracts";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`AUTHOR MEMORY ROUNDTRIP FAILURE: ${message}`);
}

const roundOneGraph = buildAuthorRealityGraph({
  prompt: "Create a video receipt for Coco's grooming visit.",
  subject: "Coco",
  place: "Elm Street Grooming",
  facts: [
    "Coco is a poodle.",
    "Coco was nervous.",
    "Coco had blue bows in her ears.",
    "Coco was happy after the bath.",
    "Coco jumped around when picked up.",
  ],
  sourceMoments: [
    "Coco was groomed at Elm Street Grooming.",
  ],
});

const roundOneState = buildAuthorExperienceState({
  graph: roundOneGraph,
  lens: "comedy",
  round: 1,
  priorScenes: [],
  memoryContext: [],
});

const roundOneBatch = authorExperienceStateToMemoryBatch({
  assetId: "asset-coco-test",
  userId: "user-test",
  state: roundOneState,
  sourceRef: "author-memory-roundtrip-acceptance",
});

const memoryContext: MemoryContext = {
  facts: [],
  relations: [],
  entities: [],
  events: roundOneBatch.events,
};

const recoveredStates = extractAuthorExperienceStates(memoryContext);
const recoveredContext = authorExperienceMemoryContext(memoryContext);

assert(recoveredStates.length === 1, "round one Author state was not recoverable");
assert(recoveredContext.some((value) => /prior tempo:/i.test(value)), "prior Author state did not rehydrate into cognitive context");
assert(recoveredContext.some((value) => /carry:|future:|revisit:|retired future:/i.test(value)), "retained Author hooks did not rehydrate");

const roundTwoGraph = buildAuthorRealityGraph({
  prompt: "Create the next video receipt for Coco's grooming visit.",
  subject: "Coco",
  place: "Elm Street Grooming",
  facts: [
    "Coco is a poodle.",
    "Coco was less nervous this time.",
    "Coco had purple bows in her ears.",
    "Coco loved the dryer.",
    "Coco would not leave.",
  ],
  sourceMoments: [
    "Coco was groomed at Elm Street Grooming again.",
  ],
  memoryContext: recoveredContext,
  trajectory: roundOneState.chapter.semanticTurns,
});

const roundTwoStateWithMemory = buildAuthorExperienceState({
  graph: roundTwoGraph,
  lens: "comedy",
  round: 2,
  priorScenes: [],
  memoryContext: recoveredContext,
  priorExperienceStates: recoveredStates,
});

const roundTwoStateWithoutMemory = buildAuthorExperienceState({
  graph: roundTwoGraph,
  lens: "comedy",
  round: 2,
  priorScenes: [],
  memoryContext: [],
  priorExperienceStates: [],
});

const revisitedLabels = roundTwoStateWithMemory.revisitedEventIds
  .map((id) => roundTwoGraph.events.find((event) => event.id === id)?.label ?? "")
  .map((label) => label.toLowerCase());

assert(
  roundTwoStateWithMemory.revisitedEventIds.length < roundTwoGraph.events.length,
  "continuity detector treated every Round 2 event as a revisit",
);
assert(
  revisitedLabels.some((label) => /less nervous|purple bows/.test(label)),
  "continuity detector missed the changed established material",
);
assert(
  roundTwoStateWithMemory.revisitedEventIds.length >= roundTwoStateWithoutMemory.revisitedEventIds.length,
  "prior state did not preserve revisit awareness",
);
assert(
  roundTwoStateWithMemory.carryThreads.length >= roundTwoStateWithoutMemory.carryThreads.length,
  "prior state did not carry forward Author threads",
);
assert(
  roundTwoStateWithMemory.memoryHooks.length >= roundTwoStateWithoutMemory.memoryHooks.length,
  "prior state did not preserve memory hooks",
);
assert(
  roundTwoStateWithMemory.continuationValue >= roundTwoStateWithoutMemory.continuationValue,
  "prior state did not increase continuation value",
);
assert(
  roundTwoStateWithMemory.tempo.mode === "revisit" || roundTwoStateWithMemory.revisitedEventIds.length > 0,
  "round two did not recognize that established material is being revisited",
);

console.log("AUTHOR MEMORY ROUNDTRIP ACCEPTANCE: PASS");
console.log(`Round1Tempo=${roundOneState.tempo.mode}`);
console.log(`RecoveredStates=${recoveredStates.length}`);
console.log(`RecoveredContext=${recoveredContext.length}`);
console.log(`Round2WithMemoryTempo=${roundTwoStateWithMemory.tempo.mode}`);
console.log(`Round2WithoutMemoryTempo=${roundTwoStateWithoutMemory.tempo.mode}`);
console.log(`WithMemoryContinuation=${roundTwoStateWithMemory.continuationValue}`);
console.log(`WithoutMemoryContinuation=${roundTwoStateWithoutMemory.continuationValue}`);
console.log(`WithMemoryRevisits=${roundTwoStateWithMemory.revisitedEventIds.join(",") || "none"}`);
console.log(`MemoryHooks=${roundTwoStateWithMemory.memoryHooks.slice(0, 8).join(" | ")}`);
console.log(summarizeAuthorExperienceState(roundTwoStateWithMemory).join("\n"));
