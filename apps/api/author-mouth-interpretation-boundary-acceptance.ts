import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const envelope = buildAuthorRealityEnvelope({
  subject: "Coco",
  graph: {
    events: [
      { id: "event-1", label: "Coco was groomed at Elm Street Grooming" },
      { id: "event-2", label: "then stole the red bow." },
      { id: "event-3", label: "Coco was groomed at Elm Street Grooming" },
      { id: "event-4", label: "Coco stole the red bow." },
    ],
    relations: [
      { from: "event-2", to: "event-4", kind: "converges" },
    ],
  } as any,
});

const groundedFrame = evaluateMouthInterpretation({
  text: "The bow was evidence.",
  sourceLabels: ["Coco stole the red bow."],
  envelope,
});

const groundedStatus = evaluateMouthInterpretation({
  text: "Coco looks good in red.",
  sourceLabels: ["Coco stole the red bow."],
  envelope,
});

const freeFloating = evaluateMouthInterpretation({
  text: "Pant-pant, ready or not.",
  sourceLabels: ["Coco stole the red bow."],
  envelope,
});

const inventedAtmosphere = evaluateMouthInterpretation({
  text: "Coco's eyes gleam under the spotlight.",
  sourceLabels: ["Coco stole the red bow."],
  envelope,
});

assert(groundedFrame.accepted, "INTERPRETATION BOUNDARY FAILURE: evidence-backed frame was rejected.");
assert(groundedStatus.accepted, "INTERPRETATION BOUNDARY FAILURE: grounded status framing was rejected.");
assert(!freeFloating.accepted, "INTERPRETATION BOUNDARY FAILURE: free-floating attitude survived.");
assert(freeFloating.unsupportedConcreteRisk >= 1, "INTERPRETATION BOUNDARY FAILURE: free-floating attitude lacked hard truth risk.");
assert(!inventedAtmosphere.accepted, "INTERPRETATION BOUNDARY FAILURE: invented atmosphere survived.");

console.log("AUTHOR MOUTH INTERPRETATION BOUNDARY ACCEPTANCE: PASS");
console.log(`GroundedFrame=${JSON.stringify(groundedFrame)}`);
console.log(`GroundedStatus=${JSON.stringify(groundedStatus)}`);
console.log(`FreeFloating=${JSON.stringify(freeFloating)}`);
console.log(`InventedAtmosphere=${JSON.stringify(inventedAtmosphere)}`);
