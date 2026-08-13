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
import { extractLatentMovieV5, type LatentMovieV5 } from "./latentMovieExtractorV5.js";
import { inferExperienceIntentV7, type ExperienceIntentV7 } from "./experienceIntentV7.js";
import { realizeLatentMovieV7 } from "./creativeRealizerV7.js";

export type ExperienceCompilerContextV7 = {
  businessName?: string;
  businessDomain?: string;
  ownerKey?: string;
  entityKey?: string;
  memorySummary?: string[];
};

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

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

function entitiesFromMovie(movie: LatentMovieV5): ExperienceEntities {
  const text = movie.facts.map((fact) => fact.text).join(" ");
  const dates = unique(movie.facts.flatMap((fact) => fact.dates));
  const times = unique(movie.facts.flatMap((fact) => fact.times));
  const places = unique(movie.facts.flatMap((fact) => fact.places));
  const people = movie.subject ? [movie.subject] : [];
  const keywords = unique(text.toLowerCase().split(/[^a-z0-9'’-]+/).filter((word) => word.length >= 4)).slice(0, 40);

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

function experienceType(intent: ExperienceIntentV7): ExperienceType {
  switch (intent.purpose) {
    case "memory": return "memory";
    case "journey": return "journey";
    case "event": return "event";
    case "collection": return "collection";
    case "business": return "business";
    case "story": return "story";
    default: return intent.memoryEnabled ? "memory" : "story";
  }
}

function tones(intent: ExperienceIntentV7): ExperienceTone[] {
  const mapped: Record<string, ExperienceTone> = {
    funny: "humorous",
    warm: "friendly",
    cinematic: "cinematic",
    dark: "dark",
    mysterious: "mysterious",
  };
  return unique(intent.tone.map((tone) => mapped[tone] ?? "cinematic")) as ExperienceTone[];
}

function momentType(index: number, total: number): ExperienceMoment["type"] {
  if (index === 0) return "introduction";
  if (index === total - 1) return "completion";
  return index === Math.floor(total / 2) ? "reveal" : "story";
}

function factualEventForBeat(movie: LatentMovieV5, sourceFactIds: string[]): string | undefined {
  const ids = new Set(sourceFactIds);
  return movie.facts.find((fact) => ids.has(fact.id))?.text;
}

function buildMoments(movie: LatentMovieV5): ExperienceMoment[] {
  return movie.beats.map((beat, index) => ({
    type: momentType(index, movie.beats.length),
    component: "story",
    title: index === 0 ? "The beginning" : index === movie.beats.length - 1 ? "The moment that stayed" : "And then",
    subtitle: movie.subject,
    description: beat.text,
    editable: true,
    demo: false,
    order: index,
    payload: {
      beatId: `${beat.order}`,
      source: "latent-movie",
      factualEvent: factualEventForBeat(movie, beat.sourceFactIds),
    },
  }));
}

function buildFlowSteps(movie: LatentMovieV5): FlowStep[] {
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

function titleFor(intent: ExperienceIntentV7, movie: LatentMovieV5): string {
  if (intent.domain === "dog_grooming") return `${movie.subject}'s Adventure`;
  if (intent.domain === "housekeeping") return `${movie.subject}'s Service Story`;
  if (intent.domain === "real_estate") return `${movie.subject} — A Place to Remember`;
  if (intent.domain === "wedding") return "A Wedding Worth Remembering";
  if (intent.domain === "travel") return `${movie.subject}'s Journey`;
  if (intent.purpose === "personal") return "My Next Chapter";
  return `${movie.subject}: The Experience`;
}

function meaning(intent: ExperienceIntentV7, movie: LatentMovieV5): ExperienceMeaning {
  return {
    why: intent.purpose === "service_receipt"
      ? "Turn an ordinary service into something the recipient remembers."
      : "Turn what happened into an experience worth returning to.",
    relationship: {
      subject: movie.subject,
      object: intent.audience[0] ?? "viewer",
      type: "experience",
    },
    emotions: intent.tone,
    memories: intent.memoryEnabled ? ["persistent", "continuation"] : [],
    desiredFeeling: intent.tone,
    transformation: "ordinary moment → meaningful experience",
  };
}

/**
 * V7 is the new authoring boundary:
 * HUMAN LANGUAGE → INTENT → COGNITION → EXPERIENCE BLUEPRINT → LATENT MOVIE → FLOW
 *
 * There is no StoryCompiler in this path. Narrative structure is an internal
 * consequence of the experience and its evidence, not the product's authoring abstraction.
 */
export function compileExperienceV7(
  prompt: string,
  context: ExperienceCompilerContextV7 = {},
): CompiledExperienceV7 {
  const rawMovie = extractLatentMovieV5(prompt);
  const movie = realizeLatentMovieV7(rawMovie);
  const entities = entitiesFromMovie(movie);
  const cognitivePrompt = context.businessDomain ? `${context.businessDomain}. ${prompt}` : prompt;
  const cognition = understandExperience(cognitivePrompt, {
    memories: (context.memorySummary ?? []).map((summary) => ({ summary })),
  });
  const intent = inferExperienceIntentV7(cognitivePrompt, entities);
  const moments = buildMoments(movie);

  const blueprint: ExperienceBlueprint = {
    title: titleFor(intent, movie),
    type: experienceType(intent),
    tone: tones(intent),
    meaning: meaning(intent, movie),
    moments,
    entities,
    cognitivePlan: cognition.plan,
    metadata: {
      archetypes: [intent.purpose, intent.subjectKind, cognition.selectedHypothesis.kind],
      themes: intent.signals.slice(0, 12),
      dna: ["human-to-experience", "evidence-grounded", "entity-aware", "memory-capable", "creative-realization", "domain-neutral"],
    },
  };

  return {
    intent,
    cognition,
    movie,
    blueprint,
    flowSteps: buildFlowSteps(movie),
    moments,
    cinematicScenes: [],
    title: blueprint.title,
    estimatedDuration: Math.max(8, movie.beats.length * 4),
    momentCount: moments.length,
  };
}
