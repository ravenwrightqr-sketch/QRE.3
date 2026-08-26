import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { evaluateCut } from "./src/services/authorCutPolicy.js";
import type { RealityGraph } from "@qre/contracts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const graph = {
  evidence: [],
  events: [
    {
      id: "event-1",
      label: "Coco was groomed at Elm Street Grooming. Make the experience sharp and memorable.",
      sourceIds: ["source-1"],
      entities: ["Coco", "Elm Street Grooming"],
      place: "Elm Street Grooming",
      salient: true,
      provenance: "explicit",
    },
    {
      id: "event-2",
      label: "Coco stole the red bow.",
      sourceIds: ["source-2"],
      entities: ["Coco", "red bow"],
      place: "Elm Street Grooming",
      salient: true,
      provenance: "explicit",
    },
  ],
  relations: [
    { from: "event-1", to: "event-2", kind: "converges", strength: 0.8 },
  ],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
} satisfies RealityGraph;

const envelope = buildAuthorRealityEnvelope({ graph, subject: "Coco" });

assert(
  envelope.suppliedPhrases.every((value) => !/make the experience sharp and memorable/i.test(value)),
  "REALIZATION BOUNDARY FAILURE: authoring instruction entered supplied phrase state.",
);
assert(
  envelope.events.some((event) => /Coco was groomed at Elm Street Grooming/i.test(event.label)),
  "REALIZATION BOUNDARY FAILURE: factual event was lost while quarantining instruction residue.",
);
assert(
  envelope.events.some((event) => /Coco stole the red bow/i.test(event.label)),
  "REALIZATION BOUNDARY FAILURE: endpoint event was lost.",
);

const inventedSwipe = evaluateCut(
  "With a swipe, the bow was his.",
  {
    subject: "Coco",
    facts: ["Coco stole the red bow."],
    moments: ["Coco was groomed at Elm Street Grooming."],
    prompt: "Coco was groomed at Elm Street Grooming. Make the experience sharp and memorable.",
  },
  { role: "turn" },
  [],
);

assert(
  inventedSwipe.accepted === false && inventedSwipe.metrics.inventionRisk >= 0.6,
  "REALIZATION BOUNDARY FAILURE: unsupported physical action survived the cut gate.",
);

const groundedSwipe = evaluateCut(
  "Coco swiped the bow.",
  {
    subject: "Coco",
    facts: ["Coco swiped the bow."],
    moments: [],
    prompt: "Coco swiped the bow.",
  },
  { role: "turn" },
  [],
);

assert(
  groundedSwipe.accepted,
  `REALIZATION BOUNDARY FAILURE: supported physical action was rejected: ${groundedSwipe.reasons.join(",")}`,
);

console.log("AUTHOR REALIZATION BOUNDARY ACCEPTANCE: PASS");
console.log(`QuarantinedInstruction=${envelope.suppliedPhrases.length === 2}`);
console.log(`InventedSwipeRisk=${inventedSwipe.metrics.inventionRisk}`);
console.log(`GroundedSwipeAccepted=${groundedSwipe.accepted}`);
