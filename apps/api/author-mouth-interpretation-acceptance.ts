import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const graph = buildAuthorRealityGraph({
  prompt: "Coco was groomed at Elm Street Grooming, then stole the red bow.",
  subject: "Coco",
  facts: [
    "Coco was groomed at Elm Street Grooming.",
    "Coco stole the red bow.",
  ],
  sourceMoments: [],
});

const envelope = buildAuthorRealityEnvelope({ graph, subject: "Coco" });
const sourceLabels = [
  "Coco was groomed at Elm Street Grooming.",
  "Coco stole the red bow.",
];

const interpretive = evaluateMouthInterpretation({
  text: "Coco looked good in red.",
  sourceLabels,
  envelope,
});

const literal = evaluateMouthInterpretation({
  text: "Coco stole the red bow.",
  sourceLabels,
  envelope,
});

const invented = evaluateMouthInterpretation({
  text: "Coco escaped the groomer wearing the bow.",
  sourceLabels,
  envelope,
});

assert(
  interpretive.accepted,
  `interpretive derivation rejected: ${JSON.stringify(interpretive)}`,
);
assert(
  interpretive.interpretive > literal.interpretive,
  "interpretive line must outrank literal restatement",
);
assert(
  literal.accepted === false,
  "literal source restatement must not qualify as derivational interpretation",
);
assert(
  invented.accepted === false,
  "invented concrete event must be rejected",
);

console.log("AUTHOR MOUTH INTERPRETATION ACCEPTANCE: PASS");
console.log(`Interpretive=${JSON.stringify(interpretive)}`);
console.log(`Literal=${JSON.stringify(literal)}`);
console.log(`Invented=${JSON.stringify(invented)}`);
