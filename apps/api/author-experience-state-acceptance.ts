import type {
  AuthorExperienceState,
  LatentMovieCandidate,
  MemoryContext,
  RealityGraph,
} from "@qre/contracts";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";
import {
  authorExperienceMemoryContext,
  authorExperienceStateToMemoryBatch,
  extractAuthorExperienceStates,
  mergeAuthorExperienceStates,
} from "./src/services/authorExperienceMemory.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const graph: RealityGraph = {
  evidence: [],
  events: [
    { id: "coco", label: "Coco", sourceIds: ["e1"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "nervous", label: "nervous", sourceIds: ["e2"], entities: ["Coco"], emotionalState: "nervous", salient: true, provenance: "explicit" },
    { id: "bath", label: "bath", sourceIds: ["e3"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "bows", label: "pink bows", sourceIds: ["e4"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "mirror", label: "approved mirror", sourceIds: ["e5"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "fabulous", label: "fabulous", sourceIds: ["e6"], entities: ["Coco"], emotionalState: "happy", salient: true, provenance: "explicit" },
    { id: "jim", label: "Jim", sourceIds: ["e7"], entities: ["Jim"], salient: true, provenance: "explicit" },
    { id: "apples", label: "favorite apples", sourceIds: ["e8"], entities: ["Coco", "apples"], salient: true, provenance: "explicit" },
  ],
  relations: [
    { from: "nervous", to: "bath", kind: "changes", strength: 0.82 },
    { from: "bath", to: "bows", kind: "recontextualizes", strength: 0.78 },
    { from: "bows", to: "mirror", kind: "changes", strength: 0.76 },
    { from: "mirror", to: "fabulous", kind: "converges", strength: 0.86 },
    { from: "nervous", to: "fabulous", kind: "recontextualizes", strength: 0.81 },
    { from: "jim", to: "apples", kind: "causes", strength: 0.83 },
    { from: "coco", to: "jim", kind: "converges", strength: 0.77 },
  ],
  unresolvedTensions: ["peace is temporary"],
  recurringSignals: ["Coco", "pink bows", "favorite apples"],
  sensorySignals: [],
};

const candidate = (
  id: string,
  trajectory: LatentMovieCandidate["trajectory"],
): LatentMovieCandidate => ({
  id,
  lens: "natural, specific, emotionally intelligent",
  anchorEventIds: trajectory[0]?.eventIds ?? [],
  supportingRelationKinds: trajectory.map((step) => step.operation),
  trajectory,
  payoff: trajectory.at(-1)?.eventIds.at(-1) === "apples" ? "favorite apples" : "fabulous",
  unresolvedQuestion: "What comes next?",
  evidence: trajectory.flatMap((step) => step.eventIds),
  hypothesis: ["accumulated meaning"],
  truthRisk: 0.1,
  novelty: 0.9,
  specificity: 0.8,
  informationValue: 0.9,
  uncertainty: 0.7,
  attentionPotential: 0.9,
  consequencePotential: 0.85,
  callbackPotential: 0.8,
  compressionPotential: 0.85,
  repetitionRisk: 0.05,
  distinctiveness: 0.9,
  score: 0.9,
});

const chapterOne = buildAuthorExperienceState({
  graph,
  movie: candidate("coco-one", [
    { order: 1, operation: "establish", eventIds: ["coco"], viewerChange: "Establish Coco.", nextQuestion: "What changes?" },
    { order: 2, operation: "reveal", eventIds: ["coco", "nervous"], viewerChange: "Coco arrives carrying nervousness.", nextQuestion: "What changes now?" },
    { order: 3, operation: "reframe", eventIds: ["nervous", "bath"], viewerChange: "The nervousness no longer gets the final word.", nextQuestion: "What does this unlock?" },
    { order: 4, operation: "reframe", eventIds: ["bath", "bows"], viewerChange: "The bows turn the whole thing playful.", nextQuestion: "What becomes newly meaningful?" },
    { order: 5, operation: "converge", eventIds: ["mirror", "fabulous"], viewerChange: "Now fabulous feels earned.", nextQuestion: "What is true at the ending?" },
    { order: 6, operation: "payoff", eventIds: ["fabulous"], viewerChange: "fabulous", nextQuestion: "What comes next?" },
  ]),
  lens: "natural, specific, emotionally intelligent",
  memoryContext: ["Coco remains part of the world after this chapter."],
  round: 1,
});

assert(chapterOne.tempo.mode, "chapter one must have tempo");
assert(chapterOne.changedEventIds.includes("nervous"), "chapter one must record the semantic change");
assert(chapterOne.carrierEventIds.includes("bows"), "chapter one must carry the bows thread");
assert(chapterOne.payoffEventIds.includes("fabulous"), "chapter one must record payoff");
assert(chapterOne.futureThreadKeys.length > 0, "chapter one must expose future threads");

const chapterTwo = buildAuthorExperienceState({
  graph,
  movie: candidate("coco-two", [
    { order: 1, operation: "establish", eventIds: ["jim"], viewerChange: "Jim enters Coco's world.", nextQuestion: "What connects?" },
    { order: 2, operation: "converge", eventIds: ["coco", "jim"], viewerChange: "Their worlds cross.", nextQuestion: "What does that make newly meaningful?" },
    { order: 3, operation: "reframe", eventIds: ["jim", "apples"], viewerChange: "Now apples mean something shared.", nextQuestion: "What happens next?" },
    { order: 4, operation: "payoff", eventIds: ["apples"], viewerChange: "favorite apples", nextQuestion: "What comes next?" },
  ]),
  lens: "funny",
  priorExperienceStates: [chapterOne],
  memoryContext: ["Jim is a neighbor", "apples matter to Coco"],
  round: 2,
});

assert(chapterTwo.establishedEventIds.includes("coco"), "prior establishment must persist");
assert(chapterTwo.changedEventIds.includes("nervous"), "prior semantic change must persist");
assert(chapterTwo.carryThreads.some((value) => /peace is temporary/i.test(value)), "world tension must carry forward");
assert(chapterTwo.futureThreadKeys.length > 0, "future threads must remain alive");
assert(chapterTwo.tempo.mode !== "hook", "later chapter must not reset to hook");
assert(chapterTwo.tempo.nextBeatPull > 0, "later chapter must have beat pull");

const merged = mergeAuthorExperienceStates([chapterOne, chapterTwo]) as AuthorExperienceState;
assert(merged.changedEventIds.includes("nervous"), "merged state lost prior change");
assert(merged.carrierEventIds.includes("bows"), "merged state lost prior carrier");
assert(merged.futureThreadKeys.length >= chapterTwo.futureThreadKeys.length, "merged state lost future threads");

const batch = authorExperienceStateToMemoryBatch({
  assetId: "asset-test",
  userId: "user-test",
  state: chapterTwo,
  sourceRef: "author-experience-state-acceptance",
});

const context: MemoryContext = {
  assetId: "asset-test",
  generatedAt: new Date().toISOString(),
  entities: [],
  facts: [],
  relations: [],
  events: batch.events.map((event, index) => ({ ...event, id: `memory-${index}` })),
};

const extracted = extractAuthorExperienceStates(context);
assert(extracted.length === 1, "durable author state was not recoverable");
assert(extracted[0]?.tempo.mode === chapterTwo.tempo.mode, "tempo did not survive memory projection");
assert(authorExperienceMemoryContext(context).some((line) => line.startsWith("prior tempo:")), "memory context lost prior tempo");

console.log("AUTHOR EXPERIENCE STATE ACCEPTANCE: PASS");
console.log(`Tempo1=${chapterOne.tempo.mode}`);
console.log(`Tempo2=${chapterTwo.tempo.mode}`);
console.log(`Continuation=${chapterTwo.continuationValue}`);
console.log(`Lookahead=${chapterTwo.lookaheadValue}`);
console.log(`Attention=${chapterTwo.attentionPotential}`);
console.log(`FutureThreads=${chapterTwo.futureThreadKeys.length}`);
console.log(`MemoryEvents=${extracted.length}`);
