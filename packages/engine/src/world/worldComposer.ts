/**
 * =====================================================
 * QRE EXPERIENCE WORLD COMPOSER
 * =====================================================
 *
 * Cognitive Intelligence
 *
 * Experience Genome
 *        ↓
 * World Synthesis
 *        ↓
 * Experience World
 *
 * The World is not another interpretation of the prompt.
 *
 * It is the experiential reality produced from the
 * compiler's cognitive substrate.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceArchetype,
  WorldRole,
  WorldSignature,
  WorldTransformation,
  WorldIdentity,
  WorldLaw,
  ExperienceCompilerIntelligence,
} from "@qre/contracts";

import {
  resolveWorldDomain,
} from "./worldDomain.js";

/**
 * =====================================================
 * COGNITIVE WORLD INPUT
 * =====================================================
 *
 * World consumes the already-synthesized intelligence.
 *
 * The World Composer does not run NUVO, REVIK, MOVER,
 * KAIVO, or ORION itself.
 *
 * It receives their results.
 *
 * =====================================================
 */

type WorldCognitiveInput = Pick<
  ExperienceCompilerIntelligence,
  | "semanticIR"
  | "nuvo"
  | "revik"
  | "moverArc"
  | "moverTopology"
  | "kaivo"
  | "orion"
>;

/**
 * =====================================================
 * WORLD COMPOSER
 * =====================================================
 */

export function composeWorld(
  genome: ExperienceGenome,
  intelligence?: WorldCognitiveInput,
): ExperienceWorld {
  /**
   * ---------------------------------------------------
   * DOMAIN
   * ---------------------------------------------------
   */

  const domain =
    resolveWorldDomain(genome);

  /**
   * ---------------------------------------------------
   * COGNITIVE SIGNALS
   * ---------------------------------------------------
   *
   * These are extracted from the cognitive substrate
   * without creating another meaning engine.
   */

  const cognitiveSignals =
    collectCognitiveSignals(intelligence);

  /**
   * ---------------------------------------------------
   * ARCHETYPE
   * ---------------------------------------------------
   */

  const archetype =
    resolveArchetype(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * ROLE
   * ---------------------------------------------------
   */

  const role =
    resolveWorldRole(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * PURPOSE
   * ---------------------------------------------------
   */

  const purpose =
    resolvePurpose(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * WORLD IDENTITY
   * ---------------------------------------------------
   */

  const worldIdentity =
    resolveWorldIdentity(
      genome,
      purpose,
    );

  /**
   * ---------------------------------------------------
   * WORLD LAWS
   * ---------------------------------------------------
   */

  const worldLaws =
    resolveWorldLaws(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * SIGNATURE
   * ---------------------------------------------------
   */

  const signature =
    resolveSignature(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * EMOTIONAL PHYSICS
   * ---------------------------------------------------
   */

  const emotionalPhysics =
    resolveEmotionalPhysics(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * SENSORY LANGUAGE
   * ---------------------------------------------------
   */

  const sensoryLanguage =
    resolveSensoryLanguage(
      genome,
    );

  /**
   * ---------------------------------------------------
   * TRANSFORMATION
   * ---------------------------------------------------
   */

  const transformation =
    resolveTransformation(
      genome,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * JOURNEY
   * ---------------------------------------------------
   */

  const journey =
    resolveJourney(
      genome,
      domain,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * EXPERIENCE ATOMS
   * ---------------------------------------------------
   */

  const atoms =
    resolveAtoms(
      genome,
      domain,
      cognitiveSignals,
    );

  /**
   * ---------------------------------------------------
   * THEMES
   * ---------------------------------------------------
   */

  const themes = [
    ...new Set([
      ...genome.themes,
      ...cognitiveSignals.themes,
      domain,
    ]),
  ];

  /**
   * ---------------------------------------------------
   * CONNECTED WORLDS
   * ---------------------------------------------------
   */

  const connectedWorlds =
    genome.worlds.filter(
      (world) =>
        world !== domain,
    );

  /**
   * ---------------------------------------------------
   * WORLD ARTIFACT
   * ---------------------------------------------------
   */

  return {
    domain,

    archetype,

    role,

    purpose,

    worldIdentity,

    worldLaws,

    signature,

    emotionalPhysics,

    sensoryLanguage,

    transformation,

    journey,

    atoms,

    themes,

    connectedWorlds,

    artifacts: [
      {
        world: domain,

        moments: [],

        metadata: {
          archetype,
          role,
          signature,
          purpose,
          worldIdentity,
          worldLaws,
          emotionalPhysics,
          sensoryLanguage,
          transformation,
        },
      },
    ],
  };
}

/**
 * =====================================================
 * COGNITIVE SIGNAL EXTRACTION
 * =====================================================
 *
 * This is intentionally structural.
 *
 * It does not invent human sentences.
 * It does not create narrative.
 * It does not replace cognition.
 *
 * It only makes already-produced cognitive signals
 * available to World synthesis.
 *
 * =====================================================
 */

type CognitiveSignals = {
  themes: string[];
  concepts: string[];
  questions: string[];
  transformations: string[];
  emotionalSignals: string[];
};

function collectCognitiveSignals(
  intelligence?: WorldCognitiveInput,
): CognitiveSignals {
  if (!intelligence) {
    return {
      themes: [],
      concepts: [],
      questions: [],
      transformations: [],
      emotionalSignals: [],
    };
  }

  const values =
    collectStrings(
      intelligence,
      0,
      new WeakSet(),
    );

  const unique = [
    ...new Set(
      values
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean),
    ),
  ];

  return {
    themes: unique.filter(
      isThemeSignal,
    ),

    concepts: unique.filter(
      isConceptSignal,
    ),

    questions:
      unique.filter(
        isQuestionSignal,
      ),

    transformations:
      unique.filter(
        isTransformationSignal,
      ),

    emotionalSignals:
      unique.filter(
        isEmotionSignal,
      ),
  };
}

/**
 * =====================================================
 * SAFE COGNITIVE STRING COLLECTION
 * =====================================================
 *
 * Bounded recursion prevents this layer from becoming
 * a generic dump of the entire cognitive object.
 *
 * =====================================================
 */

function collectStrings(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): string[] {
  if (depth > 4) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap(
      (item) =>
        collectStrings(
          item,
          depth + 1,
          seen,
        ),
    );
  }

  const result: string[] = [];

  for (
    const [key, child] of Object.entries(value)
  ) {
    /**
     * Avoid pulling arbitrary metadata into the
     * semantic world.
     */

    if (
      key === "id" ||
      key === "createdBy" ||
      key === "updatedBy" ||
      key === "confidence" ||
      key === "weight" ||
      key === "activation" ||
      key === "gravity"
    ) {
      continue;
    }

    result.push(
      ...collectStrings(
        child,
        depth + 1,
        seen,
      ),
    );
  }

  return result;
}

/**
 * =====================================================
 * SIGNAL CLASSIFIERS
 * =====================================================
 */

function isThemeSignal(
  value: string,
): boolean {
  return (
    value.length <= 80 &&
    !value.includes(" ") &&
    !value.includes(".")
  );
}

function isConceptSignal(
  value: string,
): boolean {
  return (
    value.length <= 80 &&
    (
      value.includes("_") ||
      value.includes("connection") ||
      value.includes("identity") ||
      value.includes("memory") ||
      value.includes("belonging") ||
      value.includes("discovery")
    )
  );
}

function isQuestionSignal(
  value: string,
): boolean {
  return (
    value.endsWith("?") ||
    value
      .toLowerCase()
      .includes("what deeper")
  );
}

function isTransformationSignal(
  value: string,
): boolean {
  const text =
    value.toLowerCase();

  return (
    text.includes("transform") ||
    text.includes("change") ||
    text.includes("evolve") ||
    text.includes("become")
  );
}

function isEmotionSignal(
  value: string,
): boolean {
  const text =
    value.toLowerCase();

  return (
    text.includes("joy") ||
    text.includes("wonder") ||
    text.includes("trust") ||
    text.includes("love") ||
    text.includes("fear") ||
    text.includes("nostalgia") ||
    text.includes("belonging") ||
    text.includes("curiosity") ||
    text.includes("connection")
  );
}

/**
 * =====================================================
 * ARCHETYPE INTELLIGENCE
 * =====================================================
 */

function resolveArchetype(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): ExperienceArchetype {
  if (
    genome.memory >= 0.8 ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    return "ancestral_legacy";
  }

  if (
    genome.replay >= 0.7
  ) {
    return "memory_archive";
  }

  if (
    genome.interaction >= 0.8 &&
    genome.memory >= 0.5
  ) {
    return "personal_transformation";
  }

  if (
    genome.themes.includes(
      "relationship",
    ) ||
    genome.themes.includes(
      "connection",
    ) ||
    cognitive.concepts.includes(
      "connection",
    )
  ) {
    return "relationship_journey";
  }

  if (
    genome.discovery >= 0.8
  ) {
    return "discovery_adventure";
  }

  if (
    genome.commerce >= 0.8
  ) {
    return "premium_brand_world";
  }

  if (
    genome.themes.includes(
      "community",
    )
  ) {
    return "community_movement";
  }

  return "cinematic_story";
}

/**
 * =====================================================
 * WORLD ROLE
 * =====================================================
 */

function resolveWorldRole(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): WorldRole {
  if (
    genome.memory >= 0.7 ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    return "preserve";
  }

  if (
    genome.interaction >= 0.7 ||
    genome.themes.includes(
      "connection",
    ) ||
    cognitive.concepts.includes(
      "connection",
    )
  ) {
    return "connect";
  }

  if (
    genome.discovery >= 0.7
  ) {
    return "discover";
  }

  if (
    genome.commerce >= 0.7
  ) {
    return "sell";
  }

  if (
    genome.themes.includes(
      "education",
    )
  ) {
    return "teach";
  }

  return "transform";
}

/**
 * =====================================================
 * PURPOSE
 * =====================================================
 */

function resolvePurpose(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): string {
  if (
    genome.memory >= 0.7 ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    return "Preserve meaningful human moments across generations";
  }

  if (
    genome.relationships.length ||
    cognitive.concepts.includes(
      "connection",
    )
  ) {
    return "Create deeper human connection and belonging";
  }

  if (
    genome.discovery >= 0.7
  ) {
    return "Guide people through discovery and exploration";
  }

  if (
    genome.commerce >= 0.7
  ) {
    return "Create meaningful interaction between people and brands";
  }

  return "Create a memorable human experience";
}

/**
 * =====================================================
 * ENTITY WORLD NAME
 * =====================================================
 */

function resolveEntityWorldName(
  entity: string,
  genome: ExperienceGenome,
): string {
  if (
    genome.entities.creatures?.includes(
      entity,
    )
  ) {
    return `${entity}'s Journey`;
  }

  if (
    genome.entities.people?.includes(
      entity,
    )
  ) {
    return `${entity}'s Story`;
  }

  if (
    genome.entities.objects?.includes(
      entity,
    )
  ) {
    return `${entity} Legacy`;
  }

  if (
    genome.entities.places?.includes(
      entity,
    )
  ) {
    return `${entity} World`;
  }

  return `${entity}'s Experience`;
}

/**
 * =====================================================
 * WORLD IDENTITY
 * =====================================================
 */

function resolveWorldIdentity(
  genome: ExperienceGenome,
  purpose: string,
): WorldIdentity {
  const primaryEntity =
    genome.entities.creatures?.[0] ??
    genome.entities.people?.[0] ??
    genome.entities.objects?.[0] ??
    genome.entities.places?.[0];

  const worldName =
    primaryEntity
      ? resolveEntityWorldName(
          primaryEntity,
          genome,
        )
      : `${genome.emotions[0] ?? "Human"} Experience`;

  return {
    name: worldName,

    description: purpose,

    philosophy:
      genome.memory >= 0.7
        ? "Every moment becomes history. Every story deserves preservation."
        : "Every experience transforms the person who enters it.",

    origin:
      primaryEntity
        ? `Created from the meaning surrounding ${primaryEntity}.`
        : "Created from human meaning, emotion, and experience.",

    promise: purpose,

    emotionalCore:
      genome.emotions.join(", ") ||
      "human connection",

    symbol:
      genome.symbols[0] ??
      "memory",
  };
}

/**
 * =====================================================
 * WORLD LAWS
 * =====================================================
 *
 * Rules of experiential reality.
 *
 * These are structural world rules, not generated
 * narrative sentences.
 *
 * =====================================================
 */

function resolveWorldLaws(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): WorldLaw[] {
  const laws: WorldLaw[] = [];

  if (
    genome.memory >= 0.5 ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    laws.push(
      {
        principle:
          "objects preserve human history",

        reason:
          "Meaning accumulates through ownership and time.",

        effect:
          "Objects become emotional anchors and legacy carriers.",
      },

      {
        principle:
          "time increases emotional value",

        reason:
          "Repeated human experiences strengthen attachment.",

        effect:
          "Past moments gain deeper significance.",
      },

      {
        principle:
          "memories become stronger through replay",

        reason:
          "Revisiting experiences reinforces emotional connection.",

        effect:
          "Stories evolve across generations.",
      },
    );
  }

  if (
    genome.relationships.length ||
    cognitive.concepts.includes(
      "connection",
    )
  ) {
    laws.push(
      {
        principle:
          "connection creates meaning",

        reason:
          "Human relationships give experiences purpose.",

        effect:
          "People feel belonging through shared moments.",
      },

      {
        principle:
          "people complete the experience",

        reason:
          "The participant is part of the story.",

        effect:
          "Experiences become personal rather than passive.",
      },
    );
  }

  if (
    genome.discovery >= 0.5
  ) {
    laws.push(
      {
        principle:
          "curiosity unlocks progression",

        reason:
          "Exploration drives discovery.",

        effect:
          "Discovery reveals new layers of meaning.",
      },

      {
        principle:
          "discovery rewards exploration",

        reason:
          "Hidden value encourages participation.",

        effect:
          "The world expands as users explore.",
      },
    );
  }

  if (
    genome.interaction >= 0.5
  ) {
    laws.push({
      principle:
        "participation changes the world",

      reason:
        "Actions influence experience state.",

      effect:
        "The universe becomes adaptive.",
    });
  }

  if (
    genome.replay >= 0.5
  ) {
    laws.push({
      principle:
        "experiences evolve through replay",

      reason:
        "Each interaction adds history.",

      effect:
        "The world becomes richer over time.",
    });
  }

  return laws;
}

/**
 * =====================================================
 * WORLD SIGNATURE
 * =====================================================
 *
 * Canonical WorldSignature representation.
 *
 * Each signature dimension remains a string array so
 * downstream systems preserve individual signals.
 *
 * =====================================================
 */

function resolveSignature(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): WorldSignature {
  const semantic = [
    ...genome.dna,
    ...genome.themes,
    ...genome.symbols,
    ...cognitive.themes,
    ...cognitive.concepts,
  ]
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index,
    );

  const emotional = [
    ...genome.emotions,
    ...genome.tone,
    ...cognitive.emotionalSignals,
  ]
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index,
    );

  const visual =
    genome.sensory
      .filter(
        (value) =>
          value.includes("visual") ||
          value.includes("cinematic") ||
          value.includes("image"),
      )
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index,
      );

  const sensory =
    genome.sensory
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index,
      );

  return {
    semantic,
    emotional,
    visual,
    sensory,
  };
}

/**
 * =====================================================
 * TRANSFORMATION
 * =====================================================
 */

function resolveTransformation(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): WorldTransformation {
  return {
    before:
      "An ordinary moment waiting for meaning",

    journey:
      genome.transformation[0] ??
      cognitive.transformations[0] ??
      "Discover deeper human meaning",

    after:
      "An unforgettable human experience",
  };
}

/**
 * =====================================================
 * EMOTIONAL PHYSICS
 * =====================================================
 */

function resolveEmotionalPhysics(
  genome: ExperienceGenome,
  cognitive: CognitiveSignals,
): string[] {
  const physics: string[] = [];

  if (
    genome.memory >= 0.5 ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    physics.push(
      "objects carry human history",
      "time increases emotional value",
    );
  }

  if (
    genome.relationships.length ||
    cognitive.concepts.includes(
      "connection",
    )
  ) {
    physics.push(
      "connection creates meaning",
    );
  }

  if (
    genome.discovery >= 0.5
  ) {
    physics.push(
      "curiosity drives progression",
    );
  }

  if (
    genome.transformation.length ||
    cognitive.transformations.length
  ) {
    physics.push(
      "experiences create human change",
    );
  }

  return [
    ...new Set(physics),
  ];
}

/**
 * =====================================================
 * SENSORY LANGUAGE
 * =====================================================
 */

function resolveSensoryLanguage(
  genome: ExperienceGenome,
): string[] {
  return [
    ...genome.sensory,

    ...genome.dna.filter(
      (value) =>
        value.includes("visual") ||
        value.includes("audio") ||
        value.includes("cinematic"),
    ),
  ]
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index,
    );
}

/**
 * =====================================================
 * JOURNEY
 * =====================================================
 */

function resolveJourney(
  genome: ExperienceGenome,
  domain: string,
  cognitive: CognitiveSignals,
): string[] {
  const journey: string[] = [
    "arrival",
    "discovery",
    "reveal",
  ];

  if (
    domain === "memory_world" ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    journey.push(
      "memory",
    );
  }

  if (
    genome.relationships.length ||
    cognitive.concepts.includes(
      "connection",
    )
  ) {
    journey.push(
      "peak",
    );
  }

  if (
    genome.interaction >= 0.5 ||
    cognitive.transformations.length
  ) {
    journey.push(
      "transformation",
    );
  }

  journey.push(
    "share",
    "return",
  );

  return [
    ...new Set(journey),
  ];
}

/**
 * =====================================================
 * EXPERIENCE ATOMS
 * =====================================================
 */

function resolveAtoms(
  genome: ExperienceGenome,
  domain: string,
  cognitive: CognitiveSignals,
): string[] {
  const atoms: string[] = [
    "identity",
    "story",
  ];

  if (
    genome.entities.objects?.length
  ) {
    atoms.push(
      "object",
    );
  }

  if (
    genome.entities.people?.length
  ) {
    atoms.push(
      "person",
    );
  }

  if (
    genome.entities.places?.length
  ) {
    atoms.push(
      "place",
    );
  }

  if (
    genome.entities.media?.length
  ) {
    atoms.push(
      "media",
    );
  }

  if (
    domain === "memory_world" ||
    cognitive.concepts.includes(
      "memory",
    )
  ) {
    atoms.push(
      "legacy",
      "memory",
    );
  }

  if (
    genome.immersion >= 0.5
  ) {
    atoms.push(
      "audio",
      "visual",
    );
  }

  if (
    genome.discovery >= 0.5
  ) {
    atoms.push(
      "interaction",
    );
  }

  if (
    genome.replay >= 0.5
  ) {
    atoms.push(
      "replay",
    );
  }

  return [
    ...new Set(atoms),
  ];
}