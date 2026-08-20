/**
 * QRE CREATIVE REALIZATION · CANONICAL ACCEPTANCE
 *
 * Purpose:
 *   Verify the production Creative Realization boundary independently.
 *
 * Production chain:
 *
 *   RealityGraph
 *        ↓
 *   RealityEnvelope
 *        ↓
 *   Character / Relationship Meaning
 *        ↓
 *   Safe Realization Strategies
 *        ↓
 *   Creative Realization
 *
 * This test MUST NOT:
 *   - call a model
 *   - use retired Enterprise helpers
 *   - ask Mouth to create the realization
 *   - treat the strategy lattice as the author
 *
 * The test verifies that QRE can deterministically answer:
 *
 *   "Given approved reality + computed character meaning +
 *    semantic trajectory + safe strategies,
 *    what is the most interesting thing worth realizing?"
 */

import type {
  AuthorBrainTruth,
  MouthCandidateBeat,
} from "@qre/contracts";

import {
  buildAuthorRealityEnvelope,
} from "./src/services/authorRealityEnvelope.js";

import {
  buildAuthorRealityGraph,
} from "./src/services/authorRealityGraph.js";

import {
  buildCharacterProfile,
} from "./src/services/authorCharacterLensEngine.js";

import {
  selectSafeStrategies,
} from "./src/services/authorRealizationStrategyLattice.js";

import {
  buildCreativeRealization,
} from "./src/services/authorCreativeRealizationEngine.js";

const input: AuthorBrainTruth = {
  prompt:
    "Dog grooming service receipt",

  subject:
    "Coco",

  place:
    "",

  lens:
    "",

  facts: [
    "poodle",
    "nervous",
    "fierce",
    "cool",
    "came in nervous",
    "stole a blue bow",
    "left looking fabulous",
  ],

  sourceMoments: [
    "came in nervous",
    "stole a blue bow",
    "left looking fabulous",
  ],

  memoryContext:
    [],

  trajectory:
    [],

  creativeLearningContext:
    [],
};

const graph =
  buildAuthorRealityGraph({
    prompt:
      input.prompt,

    subject:
      input.subject,

    place:
      input.place,

    facts:
      input.facts,

    sourceMoments:
      input.sourceMoments,

    memoryContext:
      input.memoryContext ?? [],

    trajectory:
      input.trajectory ?? [],
  });

const envelope =
  buildAuthorRealityEnvelope({
    graph,
    subject:
      input.subject,
  });

/*
 * This is deliberately a semantic beat,
 * not a literal source sentence.
 *
 * The acceptance test should prove that
 * Creative Realization can turn:
 *
 *   nervous + fierce + bow
 *
 * into an interpretation worth expressing,
 * without simply repeating:
 *
 *   "came in nervous"
 *   "stole a blue bow"
 */
const beat: MouthCandidateBeat = {
  order:
    1,

  role:
    "reframe",

  attentionFunction:
    "reframe",

  creativeMove:
    "contrast",

  realizationMode:
    "reframe",

  eventIds:
    envelope.events
      .slice(0, 2)
      .map(
        (event) =>
          event.id,
      ),

  change:
    "nervous meets fierce",

  next:
    "the bow changes the reading",

  frontier:
    "the bow changes the reading",

  relationKinds:
    [],

  relationStrength:
    0.8,
};

const character =
  buildCharacterProfile(
    envelope,
  );

const strategies =
  selectSafeStrategies(
    beat,
    envelope,
    5,
  );

const realization =
  buildCreativeRealization(
    beat,
    envelope,
    character,
    strategies,
  );

console.log(
  "=== QRE CREATIVE REALIZATION ACCEPTANCE ===",
);

console.log(
  `STRATEGIES: ${strategies
    .map(
      (item) =>
        item.strategy,
    )
    .join(", ")}`,
);

console.log(
  `SELECTED STRATEGY: ${realization.strategy}`,
);

console.log(
  `OPPORTUNITY: ${realization.creativeOpportunity}`,
);

console.log(
  `INTENT: ${realization.realizationIntent}`,
);

console.log(
  `VIEWER EFFECT: ${realization.viewerEffect}`,
);

console.log(
  `SCORE: ${realization.score}`,
);

console.log(
  `CHARACTER TRAITS: ${
    character.coreTraits?.join(", ") ??
    ""
  }`,
);

console.log(
  `CHARACTER CONTRADICTIONS: ${
    character.contradictions?.join(
      ", ",
    ) ?? ""
  }`,
);

console.log(
  `STATUS POSTURE: ${
    character.statusPosture ??
    ""
  }`,
);

if (
  !strategies.length
) {
  throw new Error(
    "CREATIVE REALIZATION FAILED: no safe strategies",
  );
}

if (
  !realization.creativeOpportunity
) {
  throw new Error(
    "CREATIVE REALIZATION FAILED: no creative opportunity",
  );
}

if (
  !realization.realizationIntent
) {
  throw new Error(
    "CREATIVE REALIZATION FAILED: no realization intent",
  );
}

if (
  !realization.viewerEffect
) {
  throw new Error(
    "CREATIVE REALIZATION FAILED: no viewer effect",
  );
}

if (
  realization.score <
  0.3
) {
  throw new Error(
    `CREATIVE REALIZATION FAILED: low score ${realization.score}`,
  );
}



console.log(
  "CREATIVE REALIZATION ACCEPTANCE: PASS",
);