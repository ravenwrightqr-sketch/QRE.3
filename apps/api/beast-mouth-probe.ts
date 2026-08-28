import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.ts";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.ts";

const facts = ["rolls in grass"];

const graph = buildAuthorRealityGraph({
  prompt: "Create a cinematic sequence.",
  subject: "memory",
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
});

const envelope = buildAuthorRealityEnvelope({
  graph,
  subject: "memory",
});

const result = evaluateMouthInterpretation({
  text: "A joyous tumble.",
  sourceLabels: ["rolls in grass"],
  envelope,
});

console.dir(result, { depth: null });
