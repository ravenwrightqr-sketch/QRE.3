
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityEnvelope as buildEnvelope } from "./src/services/authorRealityEnvelope.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const prompt =
  "Coco was groomed at Elm Street Grooming on Friday.";

const graph =
  buildAuthorRealityGraph({
    prompt,
    subject: "Coco",
    place: "Elm Street Grooming",
    facts: [
      "Coco was groomed at Elm Street Grooming on Friday.",
    ],
    sourceMoments: [
      "The grooming changed what the day meant.",
    ],
    memoryContext: [
      "Coco lives on Old Elm Street.",
      "Coco likes the red bow.",
    ],
    trajectory: [
      "The next beat should revisit the established material.",
    ],
  });

/*
 * The prompt/fact path is authoritative.
 */
assert(
  graph.events.some(
    (event) =>
      /Coco was groomed at Elm Street Grooming on Friday/i.test(
        event.label,
      ),
  ),
  "AUTHOR GATE: supplied fact disappeared from RealityGraph.",
);

/*
 * Memory must remain distinguishable from explicit source reality.
 */
const oldStreetEvent =
  graph.events.find(
    (event) =>
      /Old Elm Street/i.test(
        event.label,
      ),
  );

assert(
  !oldStreetEvent ||
    oldStreetEvent.provenance !==
      "explicit",
  "AUTHOR GATE LEAK: memory content became explicit reality.",
);

/*
 * Cognitive trajectory/instructional material must not become an
 * explicit factual event.
 */
const trajectoryEvent =
  graph.events.find(
    (event) =>
      /next beat should revisit/i.test(
        event.label,
      ),
  );

assert(
  !trajectoryEvent ||
    trajectoryEvent.provenance !==
      "explicit",
  "AUTHOR GATE LEAK: trajectory/planning material became explicit reality.",
);

/*
 * The generated envelope must contain supplied source vocabulary,
 * but unsupported memory geography must not masquerade as current
 * supplied geography.
 */
const envelope =
  buildEnvelope({
    graph,
    subject: "Coco",
  });

assert(
  envelope.suppliedPhrases.some(
    (value) =>
      /Elm Street Grooming/i.test(
        value,
      ),
  ),
  "AUTHOR ENVELOPE: supplied place missing.",
);

assert(
  !envelope.events.some(
    (event) =>
      /Old Elm Street/i.test(
        event.label,
      ),
  ),
  "AUTHOR ENVELOPE LEAK: memory place entered explicit event set.",
);

assert(
  !envelope.events.some(
    (event) =>
      /next beat should revisit/i.test(
        event.label,
      ),
  ),
  "AUTHOR ENVELOPE LEAK: planning trajectory entered event set.",
);

console.log(
  "AUTHOR COGNITION AUTHORITY ACCEPTANCE: PASS",
);

console.log(
  `Events=${graph.events.length}`,
);

console.log(
  `EnvelopeEvents=${envelope.events.length}`,
);

console.log(
  `SuppliedPhrases=${envelope.suppliedPhrases.length}`,
);