
/**
 * ============================================================
 * QRE UNIVERSAL STORY COMPILER — SUBSTRATE ACCEPTANCE
 * ============================================================
 *
 * The universal compiler is tested as a substrate, not as a catalog of
 * subject-specific templates. Cognition supplies semantic direction;
 * the compiler must turn that direction plus prompt evidence into an
 * observable experience.
 *
 * Acceptance invariants:
 *
 * - preserve prompt substance
 * - realize the premise instead of replacing it with significance prose
 * - create actual progression when the premise supports it
 * - preserve distinctive forces such as humor, suspense, absurdity,
 *   participation, accumulation, process, discovery, and transformation
 * - preserve coupled premise evidence instead of collapsing it to one noun
 * - remain useful for arbitrary input
 * - sparse prompts must receive concrete experiential realization
 * - never depend on a noun-specific story branch
 *
 * ============================================================
 */

import { compileStoryExperience } from "../../experience/universalStoryCompiler.js";

type Case = {
  prompt: string;
  anchors?: string[];
  mustNotContain?: string[];

  /**
   * At least one of these semantic realizations must appear in the
   * compiler's observable output.
   *
   * This is intentionally broader than an exact lexical anchor because
   * sparse prompts require the compiler to choose a concrete realization
   * rather than merely echoing the input.
   */
  semanticAnchors?: string[];

  /**
   * At least one of these must occur inside the actual story beats.
   * Unlike semanticAnchors, this can never be satisfied by metadata.
   */
  beatSemanticAnchors?: string[];

  /**
   * Sparse prompts use this to require observable experience rather than
   * abstract "meaning" prose.
   */
  requireObservableAction?: boolean;

  context?: Parameters<typeof compileStoryExperience>[1];
};

const GENERIC_REALIZATION_PHRASES = [
  "is the thing the experience puts into focus",
  "has become more meaningful through the interaction",
  "something about",
  "deserves a closer look",
  "the experience leaves a meaning behind",
  "the next interaction can change what",
  "giving the moment a direction",
  "lands differently because of everything that happened",
  "what the experience has revealed",
  "continues to develop through the interaction",
];

const ABSTRACT_FILLER_PHRASES = [
  "meaningful experience",
  "meaningful moment",
  "memorable experience",
  "special moment",
  "something meaningful",
  "something memorable",
  "a deeper meaning",
  "a sense of connection",
  "creates a connection",
];

const OBSERVABLE_ACTIONS = [
  "play",
  "plays",
  "played",
  "playing",
  "game",
  "games",
  "challenge",
  "challenges",
  "challenged",
  "choose",
  "chooses",
  "chose",
  "pick",
  "picks",
  "picked",
  "open",
  "opens",
  "opened",
  "find",
  "finds",
  "found",
  "follow",
  "follows",
  "followed",
  "touch",
  "touches",
  "scan",
  "scans",
  "collect",
  "collects",
  "collected",
  "solve",
  "solves",
  "solved",
  "move",
  "moves",
  "moved",
  "enter",
  "enters",
  "entered",
  "discover",
  "discovers",
  "discovered",
  "reveal",
  "reveals",
  "revealed",
  "surprise",
  "surprises",
  "surprised",
  "race",
  "races",
  "choose",
  "chooses",
  "choose",
];

const cases: Case[] = [
  {
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    anchors: ["Max", "poodle", "groomer"],
    mustNotContain: ["dog's Journey", "journey_world"],
  },

  {
    prompt: "Make something fun for everyone at my wedding tonight.",
    anchors: ["wedding", "fun"],
  },

  {
    prompt: "Turn this concert QR into something people will remember.",
    // This is intentionally a coupled premise: event + medium + human outcome.
    anchors: ["concert", "QR", "remember"],
  },

  {
    prompt: "My grandmother gave me this watch.",
    anchors: ["grandmother", "watch"],
  },

  {
    prompt: "Make this boring product launch fun.",
    anchors: ["product", "launch", "fun"],
  },

  {
    /**
     * Sparse-prompt acceptance:
     *
     * "Surprise me." contains almost no concrete nouns. The compiler is
     * therefore responsible for selecting a concrete experiential direction.
     *
     * We do NOT demand the literal word "play". We demand that the chosen
     * direction becomes visible in the actual beats and contains observable
     * action.
     */
    prompt: "Surprise me.",
    semanticAnchors: [
      "play",
      "game",
      "challenge",
      "surprise",
      "unexpected",
      "adventure",
      "mystery",
      "discovery",
    ],
    beatSemanticAnchors: [
      "play",
      "game",
      "challenge",
      "surprise",
      "unexpected",
      "adventure",
      "mystery",
      "discover",
      "discovery",
      "reveal",
    ],
    requireObservableAction: true,
  },

  {
    prompt: "asdf 123",
    mustNotContain: ["memory_world", "relationship_world", "dog's Journey"],
  },

  {
    prompt: "Max came back to the same groomer and was even more excited this time.",
    anchors: ["Max", "groomer"],
    context: {
      memories: [
        {
          summary: "Max's earlier grooming visit",
          entities: ["Max", "groomer"],
        },
      ],
    },
  },

  {
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    anchors: ["housekeeper", "home", "cleaning"],
  },

  {
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    anchors: ["birthday", "funny", "family", "adding"],
  },

  {
    prompt: "Make a genuinely terrifying haunted-house experience.",
    anchors: ["haunted", "terrifying"],
  },

  {
    prompt: "Create an absurd luxury spa experience for a billionaire.",
    anchors: ["spa", "billionaire", "absurd", "luxury"],
  },

  {
    prompt: "Build a playful scavenger hunt where every clue changes the next clue.",
    anchors: ["scavenger", "clue", "next"],
  },

  {
    prompt: "Turn a forgotten family recipe into a story everyone can add to.",
    anchors: ["recipe", "family", "add"],
  },
];

for (const testCase of cases) {
  const result = compileStoryExperience(testCase.prompt, testCase.context);

  const observable = JSON.stringify({
    title: result.title,
    story: result.story,
    observation: result.observation,
    situation: result.situation,
  });

  const normalized = observable.toLowerCase();

  const beats = result.story.beats.map((beat) => beat.text.trim());
  const beatText = beats.join(" ").toLowerCase();

  if (!result.story.title) {
    throw new Error(`Missing title for: ${testCase.prompt}`);
  }

  if (beats.length < 2) {
    throw new Error(`Story is too short for: ${testCase.prompt}`);
  }

  if (result.cinematicScenes.length !== beats.length) {
    throw new Error(`Scene/beat mismatch for: ${testCase.prompt}`);
  }

  if (!result.candidates.length) {
    throw new Error(`No narrative candidates for: ${testCase.prompt}`);
  }

  if (result.candidates[0].score < result.candidates.at(-1)!.score) {
    throw new Error(`Candidates are not ranked for: ${testCase.prompt}`);
  }

  const distinctBeatCount = new Set(
    beats.map((value) => value.toLowerCase()),
  ).size;

  if (distinctBeatCount < Math.min(3, beats.length)) {
    throw new Error(
      `Narrative beats collapsed into repeated prose for: ${testCase.prompt}`,
    );
  }

  /**
   * Exact prompt anchors may appear anywhere in the observable result.
   * These protect concrete user-supplied substance.
   */
  for (const anchor of testCase.anchors ?? []) {
    if (!normalized.includes(anchor.toLowerCase())) {
      throw new Error(
        `Expected '${anchor}' in compiler result for: ${testCase.prompt}`,
      );
    }
  }

  /**
   * Sparse prompts can receive a generated experiential direction.
   *
   * We require the chosen direction to exist somewhere in the observable
   * result, but do not prescribe one exact noun.
   */
  if (testCase.semanticAnchors?.length) {
    const realizedSemanticAnchor = testCase.semanticAnchors.find((anchor) =>
      normalized.includes(anchor.toLowerCase()),
    );

    if (!realizedSemanticAnchor) {
      throw new Error(
        `Sparse prompt received no concrete experiential direction for: ${testCase.prompt}. ` +
          `Expected one of: ${testCase.semanticAnchors.join(", ")}`,
      );
    }
  }

  /**
   * Generated semantic direction must reach the actual story beats.
   * Metadata alone cannot satisfy this invariant.
   */
  if (testCase.beatSemanticAnchors?.length) {
    const realizedBeatAnchor = testCase.beatSemanticAnchors.find((anchor) =>
      beatText.includes(anchor.toLowerCase()),
    );

    if (!realizedBeatAnchor) {
      throw new Error(
        `Generated experiential direction did not reach story beats for: ${testCase.prompt}. ` +
          `Expected one of: ${testCase.beatSemanticAnchors.join(", ")}`,
      );
    }
  }

  /**
   * Sparse prompts must produce observable behavior.
   *
   * This prevents the compiler from passing "Surprise me." by producing
   * several beautiful-sounding paragraphs about meaning, connection,
   * memory, or significance without anybody actually doing anything.
   */
  if (testCase.requireObservableAction) {
    const realizedAction = OBSERVABLE_ACTIONS.find((action) =>
      beatText.includes(action),
    );

    if (!realizedAction) {
      throw new Error(
        `Sparse prompt produced no observable action inside story beats for: ${testCase.prompt}`,
      );
    }
  }

  for (const value of testCase.mustNotContain ?? []) {
    if (normalized.includes(value.toLowerCase())) {
      throw new Error(
        `Unexpected '${value}' in compiler result for: ${testCase.prompt}`,
      );
    }
  }

  /**
   * Generic realization language is forbidden from becoming a substitute
   * for actual premise realization.
   */
  for (const phrase of GENERIC_REALIZATION_PHRASES) {
    if (normalized.includes(phrase.toLowerCase())) {
      throw new Error(
        `Generic realization leaked into compiler result for "${testCase.prompt}": "${phrase}"`,
      );
    }
  }

  /**
   * Additional anti-filler guard for sparse/generated experiences.
   *
   * These phrases are not universally forbidden because some legitimate
   * user prompts may explicitly contain them. They are rejected here only
   * when they appear as the observable realization of a sparse prompt.
   */
  if (testCase.requireObservableAction) {
    for (const phrase of ABSTRACT_FILLER_PHRASES) {
      if (normalized.includes(phrase.toLowerCase())) {
        throw new Error(
          `Abstract filler leaked into sparse compiler result for "${testCase.prompt}": "${phrase}"`,
        );
      }
    }
  }

  /**
   * The story itself must carry the premise, not merely metadata.
   *
   * Exact anchors are checked against beats rather than title/observation/
   * situation. This is the primary substrate-preservation invariant.
   */
  const beatAnchors = (testCase.anchors ?? []).filter((anchor) =>
    beatText.includes(anchor.toLowerCase()),
  );

  if (
    (testCase.anchors?.length ?? 0) > 0 &&
    beatAnchors.length === 0
  ) {
    throw new Error(
      `Prompt substance was not realized inside story beats for: ${testCase.prompt}`,
    );
  }

  /**
   * Coupled prompts must carry more than one independent premise dimension
   * into the actual beats.
   *
   * This prevents a branch from passing by mentioning only the easiest noun
   * while dropping the rest of the user's intent.
   */
  if (testCase.prompt.startsWith("Turn this concert QR")) {
    const realizedDimensions = ["concert", "qr", "remember"].filter((anchor) =>
      beatText.includes(anchor),
    );

    if (realizedDimensions.length < 3) {
      throw new Error(
        `Coupled premise collapsed inside story beats for: ${testCase.prompt}. ` +
          `Realized: ${realizedDimensions.join(", ")}`,
      );
    }
  }

  console.log(`✓ ${testCase.prompt}`);

  console.log(
    `  ${result.story.title} — ${result.story.beats
      .map((beat) => beat.kind)
      .join(" → ")}`,
  );
}

console.log(
  "✓ universal any-prompt story compiler substrate acceptance suite passed",
);

