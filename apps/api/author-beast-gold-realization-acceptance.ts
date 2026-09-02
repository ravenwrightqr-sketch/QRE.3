import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";
import { deriveViewerStateCut } from "./src/services/authorMouthCandidateSearch.js";
import {
  scoreMouthCandidate,
} from "./src/services/authorMouthCandidateSearchCanonical.js";
import {
  selectBestMouthSequence,
} from "./src/services/authorMouthSequenceBeamSearch.js";
import {
  scoreWholeWorldSequence,
} from "./src/services/authorWholeWorldSequenceScorer.js";
import type {
  MouthCandidateBeat,
  LatentMovieCandidate,
} from "@qre/contracts";

function fail(message: string): never {
  throw new Error(message);
}

function requireValue<T>(
  value: T | undefined | null,
  message: string,
): T {
  if (value === undefined || value === null) {
    fail(message);
  }

  return value;
}

function makeWorld(facts: string[]) {
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

  return {
    graph,
    envelope,
  };
}

function beatFor(
  world: ReturnType<typeof makeWorld>,
  order: number,
  label: string,
): MouthCandidateBeat {
  const event = requireValue(
    world.graph.events.find((item) => item.label === label),
    `beat: source event not found: ${label}`,
  );

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
): void {
  const world = makeWorld(facts);
  const beat = beatFor(world, 1, source);

  const evaluation = evaluateMouthInterpretation({
    text,
    sourceLabels: [source],
    envelope: world.envelope,
    beat,
  });

  if (!evaluation.accepted) {
    fail(
      `${name}: expected ACCEPT; got ${JSON.stringify(evaluation, null, 2)}`,
    );
  }

  if (
    !evaluation.reasons.includes("semantic-compression") &&
    !evaluation.reasons.includes("bounded-creative-bet")
  ) {
    fail(
      `${name}: expected semantic creative authorization; got ${evaluation.reasons.join(",")}`,
    );
  }

  if (evaluation.unsupportedConcreteRisk >= 0.9) {
    fail(
      `${name}: unexpected concrete invention risk ${evaluation.unsupportedConcreteRisk}`,
    );
  }

  console.log(
    `${name}: ACCEPT · ${evaluation.reasons.join(",")}`,
  );
}

console.log("QRE BEAST GOLD REALIZATION ACCEPTANCE");

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

/*
 * This protects the actual hard boundary:
 * a cinematic phrase may be creative, but it cannot assert an unsupported
 * concrete event/property merely because the language sounds cinematic.
 */
 {
  const { envelope } = makeWorld(["met at coffee shop"]);

  /*
   * Hard reality boundary:
   * "We ran." introduces a concrete character action that the supplied world
   * does not contain. Creative framing is allowed; unsupported concrete action
   * is not.
   */
  const evaluation = evaluateMouthInterpretation({
    text: "We ran.",
    sourceLabels: ["met at coffee shop"],
    envelope,
  });

  if (
    evaluation.unsupportedConcreteRisk < 0.9 ||
    evaluation.accepted
  ) {
    fail(
      "unsupported_concrete_action: unsupported realization was accepted",
    );
  }

  console.log(
    `unsupported_concrete_action: REJECT · ${evaluation.reasons.join(",")}`,
  );
}

/*
 * The canonical Mouth adapter must preserve semantic gold through the final
 * sequence beam. The test intentionally compares the semantic realization
 * against a literal restatement.
 */
{
  const world = makeWorld(["talked until close"]);
  const beat = beatFor(world, 1, "talked until close");
  const viewerState = deriveViewerStateCut(
    beat,
    0,
    [beat],
    world.envelope,
  );

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
      viewerState,
      candidates: [literal, semantic],
    },
  ]);

  const selectedCandidate = requireValue(
    selected.candidates[0],
    "beam: no candidate selected",
  );

  if (selectedCandidate.text !== "We stayed.") {
    fail(
      `beam: expected semantic gold, got ${selectedCandidate.text ?? "<none>"}`,
    );
  }

  console.log(
    `beam_semantic_gold: ${selectedCandidate.text}`,
  );
}

/*
 * WHOLE-WORLD SEQUENCE FILM
 *
 * This is the actual Beast target:
 *
 *   the world is larger than its most salient detail
 *   the movie can travel across multiple supplied territories
 *   some details can converge
 *   some details can remain background
 *   no complete-source-coverage quota is imposed
 *   no one detail is allowed to define the entire film
 */
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

  const movie: LatentMovieCandidate = requireValue(
    cognition.selectedMovie,
    "sequence-film: expected a selected movie",
  );

  if (movie.trajectory.length < 4) {
    fail(
      `sequence-film: expected >=4 cuts, got ${movie.trajectory.length}`,
    );
  }

  const uniqueIds = [
    ...new Set(
      movie.trajectory.flatMap((step) => step.eventIds),
    ),
  ];

  if (uniqueIds.length < 4) {
    fail(
      `sequence-film: expected >=4 unique supplied events, got ${uniqueIds.length}`,
    );
  }

  const labels = uniqueIds
    .map(
      (id) =>
        graph.events.find((event) =>
          event.id === id,
        )?.label ?? id,
    )
    .filter(Boolean);

  /*
   * We are explicitly checking against yesterday's failure mode:
   * the Beast must not turn a whole-world sequence into a one-detail camp.
   *
   * This is a diversity signal, not a prohibition on mud/bath material.
   */
  const nonMudLabels = labels.filter(
    (label) => !/\bmud\b|\bbath\b/i.test(label),
  );

  if (nonMudLabels.length < 2) {
    fail(
      `sequence-film: movie is still dominated by one detail territory: ${labels.join(" | ")}`,
    );
  }

  const worldScore = scoreWholeWorldSequence(
    graph,
    movie,
  );

  if (worldScore.shape < 0.68) {
    fail(
      `sequence-film: weak sequence shape ${worldScore.shape}`,
    );
  }

  if (worldScore.breadth < 0.55) {
    fail(
      `sequence-film: weak world breadth ${worldScore.breadth}`,
    );
  }

  if (worldScore.territoryMovement < 0.3) {
    fail(
      `sequence-film: weak territory movement ${worldScore.territoryMovement}`,
    );
  }

  console.log("sequence_film_world: ACCEPT");

  console.dir(
    {
      movieId: movie.id,
      score: movie.score,
      worldScore,
      trajectory: movie.trajectory.map((step) => ({
        order: step.order,
        operation: step.operation,
        events: step.eventIds.map(
          (id) =>
            graph.events.find((event) =>
              event.id === id,
            )?.label ?? id,
        ),
        change: step.viewerChange,
        nextQuestion: step.nextQuestion,
      })),
    },
    { depth: null },
  );
}

console.log("BEAST GOLD REALIZATION: PASS");
