import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

function envelopeFor(subject: string, facts: string[]) {
  const graph = buildAuthorRealityGraph({
    prompt: "Create a short QRE-style living memory.",
    subject,
    facts,
    sourceMoments: facts,
  });
  return buildAuthorRealityEnvelope({ graph, subject });
}

function check(
  name: string,
  subject: string,
  facts: string[],
  beatSource: string[],
  text: string,
  expected: "creative" | "literal" | "reject",
) {
  const envelope = envelopeFor(subject, facts);
  const evaluation = evaluateMouthInterpretation({
    text,
    sourceLabels: beatSource,
    envelope,
  });

  const isCreative = evaluation.reasons.includes("bounded-creative-bet") || evaluation.reasons.includes("grounded-creative-interpretation");
  const isLiteral = evaluation.literalRestatement === 1;

  if (expected === "creative") {
    assert(evaluation.accepted, `${name}: expected creative candidate to be accepted`);
    assert(isCreative, `${name}: expected creative classification`);
    assert(evaluation.unsupportedConcreteRisk < 0.9, `${name}: creative candidate carries concrete invention risk`);
  } else if (expected === "literal") {
    assert(isLiteral, `${name}: expected literal classification`);
  } else {
    assert(!evaluation.accepted || evaluation.unsupportedConcreteRisk >= 0.9, `${name}: unsupported concrete invention was accepted`);
  }

  console.log(`${name}: ${evaluation.accepted ? "ACCEPT" : "REJECT"} · ${evaluation.reasons.join(",")}`);
}

console.log("QRE MOUTH CREATIVE-BET ACCEPTANCE");

check(
  "coco_grounded_interpretation",
  "Coco",
  ["Coco is a poodle", "loves bacon", "likes squirrels", "loves the park", "walks", "rolls in grass", "likes apples"],
  ["rolls in grass"],
  "A joyous tumble.",
  "creative",
);

check(
  "coco_cross_fact_framing",
  "Coco",
  ["Coco is a poodle", "loves bacon", "likes squirrels", "loves the park"],
  ["loves the park"],
  "Coco's dream: squirrels everywhere.",
  "creative",
);

check(
  "coco_literal_source",
  "Coco",
  ["loves apples", "rolls in grass"],
  ["loves apples"],
  "loves apples",
  "literal",
);

check(
  "coco_invented_action",
  "Coco",
  ["likes squirrels", "loves the park"],
  ["likes squirrels"],
  "Coco chased the squirrels.",
  "reject",
);

check(
  "coco_invented_body_action",
  "Coco",
  ["rolls in grass"],
  ["rolls in grass"],
  "Coco wagged her tail.",
  "reject",
);

console.log("CREATIVE BET BOUNDARY: PASS");
