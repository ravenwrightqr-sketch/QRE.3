import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.ts";
import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearchCanonical.ts";
import { selectBestMouthSequence } from "./src/services/authorMouthSequenceBeamSearch.ts";

const facts = ["talked until close"];

const graph = buildAuthorRealityGraph({
  prompt: "Create a cinematic sequence film of this world.",
  subject: "our world",
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
});

const envelope = buildAuthorRealityEnvelope({
  graph,
  subject: "our world",
});

const event = graph.events.find(
  (item) => item.label === "talked until close",
);

if (!event) throw new Error("source event not found");

const beat = {
  order: 1,
  role: "reveal",
  attentionFunction: "talked until close",
  eventIds: [event.id],
  change: "talked until close",
  next: "What changes next?",
  frontier: "What changes next?",
  paysOff: [],
  relationKinds: [],
};

const semantic = scoreMouthCandidate({
  text: "We stayed.",
  beat,
  envelope,
});

const literal = scoreMouthCandidate({
  text: "talked until close",
  beat,
  envelope,
});

console.log("\n=== SEMANTIC ===");
console.dir(semantic, { depth: null });

console.log("\n=== LITERAL ===");
console.dir(literal, { depth: null });

console.log("\n=== BEAM ===");
const selected = selectBestMouthSequence([
  {
    order: 1,
    candidates: [literal, semantic],
  },
]);

console.dir(selected, { depth: null });
