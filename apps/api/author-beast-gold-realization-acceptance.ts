import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";
import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearchCanonical.js";
import { selectBestMouthSequence } from "./src/services/authorMouthSequenceBeamSearch.js";
import { scoreWholeWorldSequence } from "./src/services/authorWholeWorldSequenceScorer.js";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

function makeWorld(facts: string[]) {
  const graph = buildAuthorRealityGraph({
    prompt: "Create a cinematic sequence film of this world.",
    subject: "our world",
    facts,
    sourceMoments: facts,
    memoryContext: [],
    trajectory: [],
  });
  return {
    graph,
    envelope: buildAuthorRealityEnvelope({ graph, subject: "our world" }),
  };
}

function beatFor(world: ReturnType<typeof makeWorld>, order: number, label: string) {
  const event = world.graph.events.find((item) => item.label === label);
  assert(event, `beat: source event not found: ${label}`);

  return {
    order,
    role: "reveal",
    attentionFunction: label,
    eventIds: [event.id],
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
  const { envelope } = makeWorld(facts);
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

console.log("QRE BEAST GOLD REALIZATION ACCEPTANCE");

// Semantic gold is allowed to change wording completely while preserving
// the meaning of the approved source material.
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

// Concrete invention is still protected. This tests an actual unsupported
// characterization claim rather than forbidding use of another supplied fact.
{
  const { envelope } = makeWorld(["met at coffee shop"]);
  const evaluation = evaluateMouthInterpretation({
    text: "Coffee shop. Already strange.",
    sourceLabels: ["met at coffee shop"],
    envelope,
  });
  assert(
    evaluation.unsupportedConcreteRisk >= 0.9 || !evaluation.accepted,
    "unsupported_character_property: unsupported realization was accepted",
  );
  console.log(`unsupported_character_property: REJECT · ${evaluation.reasons.join(",")}`);
}

// The canonical Mouth adapter must carry semantic authorization through the
// final sequence selector instead of letting literal wording win.
{
  const world = makeWorld(["talked until close"]);
  const beat = beatFor(world, 1, "talked until close");

  const semantic = scoreMouthCandidate({
    text: "We stayed.",
    beat,
    envelope: world.envelope,
  });
  const literal = scoreMouthCandidate({
    text: "talked until close",
    beat,
    envelope: world.envelope,
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

// SEQUENCE FILM ACCEPTANCE
//
// The Beast is building a film of the whole lived world. A salient detail
// (mud here) may become important, but the movie must travel through multiple
// meaningful territories instead of camping on one subject.
{
  const facts = [
    "went for a walk",
    "squirrels everywhere",
    "trees",
    "rolled in mud",
    "mud bath",
    "mud bath was free",
    "felt good",
    "looked good",
  ];

  const graph = buildAuthorRealityGraph({
    prompt: "Create a cinematic sequence film of this world.",
    subject: "our world",
    facts,
    sourceMoments: facts,
    memoryContext: [],
    trajectory: [],
  });

  const cognition = buildAuthorCognitivePlan({
    prompt: "Create a cinematic sequence film of this world.",
    lens: "NONE",
    subject: "our world",
    facts,
    sourceMoments: facts,
    realityGraph: graph,
    memoryContext: [],
    priorScenes: [],
    priorStrategies: [],
    movieMode: true,
  });

  const movie = cognition.selectedMovie;
  assert(movie, "sequence-film: expected a selected movie");
  assert(
    movie.trajectory.length >= 4,
    `sequence-film: expected >=4 cuts, got ${movie.trajectory.length}`,
  );

  const uniqueIds = [...new Set(movie.trajectory.flatMap((step) => step.eventIds))];
  assert(
    uniqueIds.length >= 4,
    `sequence-film: expected >=4 unique supplied events, got ${uniqueIds.length}`,
  );

  const labels = uniqueIds
    .map((id) => graph.events.find((event) => event.id === id)?.label ?? "")
    .filter(Boolean);

  const nonMudLabels = labels.filter((label) => !/\bmud\b|\bbath\b/i.test(label));
  assert(
    nonMudLabels.length >= 2,
    `sequence-film: movie is still dominated by mud/bath territory: ${labels.join(" | ")}`,
  );

  const worldScore = scoreWholeWorldSequence(graph, movie);
  assert(
    worldScore.shape >= 0.68,
    `sequence-film: weak sequence shape ${worldScore.shape}`,
  );
  assert(
    worldScore.breadth >= 0.55,
    `sequence-film: weak world breadth ${worldScore.breadth}`,
  );

  console.log("sequence_film_world: ACCEPT");
  console.dir({
    movieId: movie.id,
    score: movie.score,
    worldScore,
    trajectory: movie.trajectory.map((step) => ({
      order: step.order,
      operation: step.operation,
      events: step.eventIds.map((id) => graph.events.find((event) => event.id === id)?.label ?? id),
      change: step.viewerChange,
    })),
  }, { depth: null });
}

console.log("BEAST GOLD REALIZATION: PASS");
