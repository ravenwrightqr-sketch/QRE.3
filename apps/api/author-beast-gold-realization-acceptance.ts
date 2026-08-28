import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";
import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearch.js";
import { selectBestMouthSequence } from "./src/services/authorMouthSequenceBeamSearch.js";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

function envelopeFor(facts: string[]) {
  const graph = buildAuthorRealityGraph({
    prompt: "Create a cinematic sequence.",
    subject: "memory",
    facts,
    sourceMoments: facts,
    memoryContext: [],
    trajectory: [],
  });
  return buildAuthorRealityEnvelope({ graph, subject: "memory" });
}

function beat(order: number, label: string) {
  return {
    order,
    role: "reveal",
    attentionFunction: label,
    eventIds: [label],
    change: label,
    next: "What changes next?",
    frontier: "What changes next?",
    paysOff: [],
    relationKinds: [],
  };
}

function checkCreative(
  name: string,
  facts: string[],
  source: string,
  text: string,
) {
  const envelope = envelopeFor(facts);
  const evaluation = evaluateMouthInterpretation({
    text,
    sourceLabels: [source],
    envelope,
  });

  assert(evaluation.accepted, `${name}: expected ACCEPT`);
  assert(
    evaluation.reasons.includes("semantic-compression") ||
      evaluation.reasons.includes("bounded-creative-bet"),
    `${name}: expected semantic creative authorization`,
  );
  assert(
    evaluation.unsupportedConcreteRisk < 0.9,
    `${name}: unexpected concrete invention risk`,
  );

  console.log(`${name}: ACCEPT · ${evaluation.reasons.join(",")}`);
}

function checkRejected(
  name: string,
  facts: string[],
  source: string,
  text: string,
) {
  const envelope = envelopeFor(facts);
  const evaluation = evaluateMouthInterpretation({
    text,
    sourceLabels: [source],
    envelope,
  });

  assert(
    !evaluation.accepted || evaluation.unsupportedConcreteRisk >= 0.9,
    `${name}: unsupported realization was accepted`,
  );
  console.log(`${name}: REJECT · ${evaluation.reasons.join(",")}`);
}

console.log("QRE BEAST GOLD REALIZATION ACCEPTANCE");

// Zero-overlap semantic compression is a first-class realization, not an
// error. These are the exact shape of the desired Mouth move.
checkCreative(
  "talked_until_close_to_we_stayed",
  ["talked until close"],
  "talked until close",
  "We stayed.",
);

checkCreative(
  "feeling_good_to_fabulous",
  ["feeling good"],
  "feeling good",
  "Fabulous.",
);

checkCreative(
  "free_bath_to_complimentary",
  ["mud bath was free"],
  "mud bath was free",
  "Complimentary.",
);

checkCreative(
  "joyous_tumble_remains_valid",
  ["rolls in grass"],
  "rolls in grass",
  "A joyous tumble.",
);

// Whole-world association must not steal an approved beat merely because a
// different supplied fact is available.
checkRejected(
  "free_mud_cannot_replace_feeling_good",
  ["feeling good", "mud bath was free"],
  "feeling good",
  "Free mud.",
);

checkRejected(
  "unsupported_character_property",
  ["met at coffee shop"],
  "met at coffee shop",
  "Coffee shop. Already strange.",
);

// The sequence beam must actually prefer the authorized semantic realization
// over a literal fallback when both are available for the same beat.
{
  const envelope = envelopeFor(["talked until close"]);
  const semantic = scoreMouthCandidate({
    text: "We stayed.",
    beat: beat(1, "talked until close"),
    envelope,
  });
  const literal = scoreMouthCandidate({
    text: "talked until close",
    beat: beat(1, "talked until close"),
    envelope,
  });

  const selected = selectBestMouthSequence([
    {
      order: 1,
      candidates: [literal, semantic],
    },
  ]);

  assert(
    selected.candidates[0]?.text === "We stayed.",
    `beam: expected semantic gold, got ${selected.candidates[0]?.text ?? "<none>"}`,
  );

  console.log(`beam_semantic_gold: ${selected.candidates[0]?.text}`);
}

console.log("BEAST GOLD REALIZATION: PASS");
