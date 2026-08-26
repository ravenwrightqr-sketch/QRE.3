import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const graph = buildAuthorRealityGraph({
  prompt: "Maria cleaned the kitchen, then the bedroom, then two bathrooms.",
  subject: "Maria",
  facts: [
    "Maria cleaned the kitchen.",
    "Maria cleaned the bedroom.",
    "Maria cleaned two bathrooms.",
  ],
  sourceMoments: [],
});

const envelope = buildAuthorRealityEnvelope({ graph, subject: "Maria" });
const sourceLabels = [
  "Maria cleaned the kitchen.",
  "Maria cleaned the bedroom.",
  "Maria cleaned two bathrooms.",
];

const interpretive = evaluateMouthInterpretation({
  text: "Maria looked good in red.",
  sourceLabels,
  envelope,
});

const missionFrame = evaluateMouthInterpretation({
  text: "Mission: House Reset.",
  sourceLabels,
  envelope,
});

const literal = evaluateMouthInterpretation({
  text: "Maria cleaned the kitchen.",
  sourceLabels,
  envelope,
});

const invented = evaluateMouthInterpretation({
  text: "Maria escaped the house after cleaning it.",
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
  missionFrame.accepted,
  `evidence-backed frame rejected: ${JSON.stringify(missionFrame)}`,
);
assert(
  missionFrame.frameSupport >= 0.8,
  "mission frame must be supported by multiple supplied action events",
);
assert(
  invented.accepted === false,
  "invented concrete event must be rejected",
);

console.log("AUTHOR MOUTH INTERPRETATION ACCEPTANCE: PASS");
console.log(`Interpretive=${JSON.stringify(interpretive)}`);
console.log(`MissionFrame=${JSON.stringify(missionFrame)}`);
console.log(`Literal=${JSON.stringify(literal)}`);
console.log(`Invented=${JSON.stringify(invented)}`);
