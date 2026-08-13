import type {
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceEntities,
  ExperienceMeaning,
  ExperienceMoment,
  ExperienceTone,
  ExperienceType,
  FlowStep,
} from "@qre/contracts";

import { understandExperience } from "../cognition/cognitiveEngine.js";
import {
  extractLatentMovieV5,
  type LatentMovieV5,
} from "./latentMovieExtractorV5.js";
import {
  inferExperienceIntentV7,
  type ExperienceIntentV7,
} from "./experienceIntentV7.js";
import { realizeLatentMovieV7 } from "./creativeRealizerV7.js";

/**
 * ============================================================
 * EXPERIENCE COMPILER V7
 * ============================================================
 *
 * CANONICAL AUTHORING PIPELINE
 *
 *   HUMAN LANGUAGE
 *        ↓
 *   INTENT
 *        ↓
 *   COGNITION
 *        ↓
 *   EXPERIENCE BLUEPRINT
 *        ↓
 *   LATENT MOVIE
 *        ↓
 *   FLOW
 *
 * V7 is intentionally NOT a story compiler.
 *
 * Narrative structure is an internal consequence of:
 *   - evidence
 *   - cognition
 *   - intent
 *   - latent movie realization
 *
 * The old universalStoryCompiler abstraction is DEAD.
 *
 * IMPORTANT:
 * This file owns the V7 compiler context.
 * It must not import a legacy StoryCompilerContext.
 *
 * ============================================================
 */

/**
 * Context supplied to the experience compiler.
 *
 * This replaces the deleted StoryCompilerContext.
 *
 * Keep this intentionally small.
 * New capabilities should be added through the canonical
 * experience/memory/cognition layers rather than creating
 * another compiler abstraction.
 */
export type ExperienceCompilerContextV7 = {
  businessName?: string;
  businessDomain?: string;

  /**
   * Stable identifiers supplied by callers that need to
   * associate the compiled experience with an owner/entity.
   */
  ownerKey?: string;
  entityKey?: string;

  /**
   * Lightweight memory summaries used by cognition.
   *
   * Full persistent memory belongs to the V13+ memory layer.
   * V7 only needs enough historical context to understand
   * the current experience.
   */
  memorySummary?: string[];

  /**
   * Optional location context.
   *
   * Kept structurally loose here because V7 does not own
   * geographic memory. Spatial/geographic intelligence
   * belongs to the later memory layers.
   */
  location?: {
    label?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  /**
   * Optional event context.
   *
   * Again, this is observational context, not a competing
   * event compiler.
   */
  event?: {
    name?: string;
    venue?: string;
    date?: string;
    description?: string;
  };
};

/**
 * ============================================================
 * COMPILED EXPERIENCE
 * ============================================================
 */

export type CompiledExperienceV7 = {
  intent: ExperienceIntentV7;
  cognition: CognitiveExperienceState;
  movie: LatentMovieV5;
  blueprint: ExperienceBlueprint;
  flowSteps: FlowStep[];
  moments: ExperienceMoment[];
  cinematicScenes: unknown[];
  title: string;
  estimatedDuration: number;
  momentCount: number;
};

/**
 * ============================================================
 * BASIC NORMALIZATION
 * ============================================================
 */

const clean = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const unique = (values: string[]) =>
  [...new Set(values.map(clean).filter(Boolean))];

/**
 * ============================================================
 * ENTITY EXTRACTION
 * ============================================================
 *
 * Entities are derived from the latent movie.
 *
 * V7 does not create a second entity system.
 * @qre/contracts remains the contract authority.
 * ============================================================
 */

function entitiesFromMovie(
  movie: LatentMovieV5,
): ExperienceEntities {
  const text = movie.facts
    .map((fact) => fact.text)
    .join(" ");

  const dates = unique(
    movie.facts.flatMap((fact) => fact.dates),
  );

  const times = unique(
    movie.facts.flatMap((fact) => fact.times),
  );

  const places = unique(
    movie.facts.flatMap((fact) => fact.places),
  );

  const people = movie.subject
    ? [movie.subject]
    : [];

  const keywords = unique(
    text
      .toLowerCase()
      .split(/[^a-z0-9'’-]+/)
      .filter((word) => word.length >= 4),
  ).slice(0, 40);

  return {
    people,
    places,
    organizations: [],
    dates,
    times,
    events: [],
    products: [],
    urls: [],
    phones: [],
    media: [],
    emails: [],
    keywords,
  };
}

/**
 * ============================================================
 * EXPERIENCE TYPE
 * ============================================================
 */

function experienceType(
  intent: ExperienceIntentV7,
): ExperienceType {
  switch (intent.purpose) {
    case "memory":
      return "memory";

    case "journey":
      return "journey";

    case "event":
      return "event";

    case "collection":
      return "collection";

    case "business":
      return "business";

    case "story":
      return "story";

    default:
      return intent.memoryEnabled
        ? "memory"
        : "story";
  }
}

/**
 * ============================================================
 * TONE MAPPING
 * ============================================================
 */

function tones(
  intent: ExperienceIntentV7,
): ExperienceTone[] {
  const mapped: Record<string, ExperienceTone> = {
    funny: "humorous",
    warm: "friendly",
    cinematic: "cinematic",
    dark: "dark",
    mysterious: "mysterious",
  };

  return unique(
    intent.tone.map(
      (tone) => mapped[tone] ?? "cinematic",
    ),
  ) as ExperienceTone[];
}

/**
 * ============================================================
 * MOMENT TYPES
 * ============================================================
 */

function momentType(
  index: number,
  total: number,
): ExperienceMoment["type"] {
  if (index === 0) {
    return "introduction";
  }

  if (index === total - 1) {
    return "completion";
  }

  return index === Math.floor(total / 2)
    ? "reveal"
    : "story";
}

/**
 * ============================================================
 * FACTUAL EVIDENCE
 * ============================================================
 */

function factualEventForBeat(
  movie: LatentMovieV5,
  sourceFactIds: string[],
): string | undefined {
  const ids = new Set(sourceFactIds);

  return movie.facts.find(
    (fact) => ids.has(fact.id),
  )?.text;
}

/**
 * ============================================================
 * MOMENT BUILDING
 * ============================================================
 */

function buildMoments(
  movie: LatentMovieV5,
): ExperienceMoment[] {
  return movie.beats.map((beat, index) => ({
    type: momentType(
      index,
      movie.beats.length,
    ),

    component: "story",

    title:
      index === 0
        ? "The beginning"
        : index === movie.beats.length - 1
          ? "The moment that stayed"
          : "And then",

    subtitle: movie.subject,

    description: beat.text,

    editable: true,

    demo: false,

    order: index,

    payload: {
      beatId: `${beat.order}`,
      source: "latent-movie",
      factualEvent: factualEventForBeat(
        movie,
        beat.sourceFactIds,
      ),
    },
  }));
}

/**
 * ============================================================
 * FLOW BUILDING
 * ============================================================
 */

function buildFlowSteps(
  movie: LatentMovieV5,
): FlowStep[] {
  return movie.beats.map((beat, index) => ({
    id: `experience-v7-${beat.order}`,

    order: index,

    type: "message",

    payload: {
      beat,
      beatId: `${beat.order}`,
      subject: movie.subject,
      source: "experience-v7",
    },
  }));
}

/**
 * ============================================================
 * TITLE
 * ============================================================
 */

function titleFor(
  intent: ExperienceIntentV7,
  movie: LatentMovieV5,
): string {
  if (intent.domain === "dog_grooming") {
    return `${movie.subject}'s Adventure`;
  }

  if (intent.domain === "housekeeping") {
    return `${movie.subject}'s Service Story`;
  }

  if (intent.domain === "real_estate") {
    return `${movie.subject} — A Place to Remember`;
  }

  if (intent.domain === "wedding") {
    return "A Wedding Worth Remembering";
  }

  if (intent.domain === "travel") {
    return `${movie.subject}'s Journey`;
  }

  if (intent.purpose === "personal") {
    return "My Next Chapter";
  }

  return `${movie.subject}: The Experience`;
}

/**
 * ============================================================
 * MEANING
 * ============================================================
 */

function meaning(
  intent: ExperienceIntentV7,
  movie: LatentMovieV5,
): ExperienceMeaning {
  return {
    why:
      intent.purpose === "service_receipt"
        ? "Turn an ordinary service into something the recipient remembers."
        : "Turn what happened into an experience worth returning to.",

    relationship: {
      subject: movie.subject,
      object: intent.audience[0] ?? "viewer",
      type: "experience",
    },

    emotions: intent.tone,

    memories: intent.memoryEnabled
      ? ["persistent", "continuation"]
      : [],

    desiredFeeling: intent.tone,

    transformation:
      "ordinary moment → meaningful experience",
  };
}

/**
 * ============================================================
 * CANONICAL V7 COMPILER
 * ============================================================
 *
 * HUMAN LANGUAGE
 *       ↓
 * LATENT MOVIE EXTRACTION
 *       ↓
 * CREATIVE REALIZATION
 *       ↓
 * ENTITY EXTRACTION
 *       ↓
 * COGNITION
 *       ↓
 * INTENT
 *       ↓
 * BLUEPRINT
 *       ↓
 * FLOW
 *
 * No universal story compiler.
 * No legacy story abstraction.
 * No second narrative architecture.
 * ============================================================
 */

export function compileExperienceV7(
  prompt: string,
  context: ExperienceCompilerContextV7 = {},
): CompiledExperienceV7 {
  /**
   * 1. Extract observable experience material.
   */
  const rawMovie =
    extractLatentMovieV5(prompt);

  /**
   * 2. Realize the latent movie into actual
   *    experience beats.
   */
  const movie =
    realizeLatentMovieV7(rawMovie);

  /**
   * 3. Derive entities from the resulting
   *    experience representation.
   */
  const entities =
    entitiesFromMovie(movie);

  /**
   * 4. Give cognition the business domain when
   *    one is explicitly supplied.
   *
   *    This is contextual augmentation, not a
   *    second compiler.
   */
  const cognitivePrompt =
    context.businessDomain
      ? `${context.businessDomain}. ${prompt}`
      : prompt;

  /**
   * 5. Run the cognitive engine.
   *
   * V7 only supplies the historical summaries
   * cognition actually needs.
   */
  const cognition =
    understandExperience(
      cognitivePrompt,
      {
        memories:
          (context.memorySummary ?? []).map(
            (summary) => ({
              summary,
            }),
          ),
      },
    );

  /**
   * 6. Infer the experience intent from the
   *    cognitive prompt and observed entities.
   */
  const intent =
    inferExperienceIntentV7(
      cognitivePrompt,
      entities,
    );

  /**
   * 7. Convert realized movie beats into
   *    user-facing moments.
   */
  const moments =
    buildMoments(movie);

  /**
   * 8. Build the contract-facing experience
   *    blueprint.
   */
  const blueprint: ExperienceBlueprint = {
    title: titleFor(
      intent,
      movie,
    ),

    type: experienceType(
      intent,
    ),

    tone: tones(
      intent,
    ),

    meaning: meaning(
      intent,
      movie,
    ),

    moments,

    entities,

    cognitivePlan:
      cognition.plan,

    metadata: {
      archetypes: [
        intent.purpose,
        intent.subjectKind,
        cognition.selectedHypothesis.kind,
      ],

      themes:
        intent.signals.slice(0, 12),

      dna: [
        "human-to-experience",
        "evidence-grounded",
        "entity-aware",
        "memory-capable",
        "creative-realization",
        "domain-neutral",
      ],
    },
  };

  /**
   * 9. Return the complete V7 compilation.
   */
  return {
    intent,

    cognition,

    movie,

    blueprint,

    flowSteps:
      buildFlowSteps(movie),

    moments,

    cinematicScenes: [],

    title:
      blueprint.title,

    estimatedDuration:
      Math.max(
        8,
        movie.beats.length * 4,
      ),

    momentCount:
      moments.length,
  };
}