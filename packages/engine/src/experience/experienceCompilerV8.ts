import type { ExperienceMoment, FlowStep } from "@qre/contracts";
import { compileExperienceV7, type ExperienceCompilerContextV7 } from "./experienceCompilerV7.js";
import { extractLatentMovieV5 } from "./latentMovieExtractorV5.js";
import { designExperienceV8, type ExperienceDesignV8 } from "./experienceDesignV8.js";
import { realizeLatentMovieV8 } from "./creativeRealizerV8.js";

export type CompiledExperienceV8 = ReturnType<typeof compileExperienceV7> & {
  design: ExperienceDesignV8;
  version: "v8";
};

function momentType(index: number, total: number): ExperienceMoment["type"] {
  if (index === 0) return "introduction";
  if (index === total - 1) return "completion";
  return index === Math.floor(total / 2) ? "reveal" : "story";
}

function buildMoments(movie: ReturnType<typeof extractLatentMovieV5>): ExperienceMoment[] {
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
      source: "experience-v8",
      factualEvent: movie.facts.find((fact) => new Set(beat.sourceFactIds).has(fact.id))?.text,
    },
  }));
}

function buildFlowSteps(movie: ReturnType<typeof extractLatentMovieV5>): FlowStep[] {
  return movie.beats.map((beat, index) => ({
    id: `experience-v8-${beat.order}`,
    order: index,
    type: "message",
    payload: {
      beat,
      beatId: `${beat.order}`,
      subject: movie.subject,
      source: "experience-v8",
    },
  }));
}

/**
 * V8 inserts an explicit experience-design decision between cognition and prose.
 * V7 remains the compatibility shell for contracts/cognition while V8 owns the
 * actual realization path. This makes the migration incremental instead of a
 * dangerous rewrite of the public engine boundary.
 */
export function compileExperienceV8(
  prompt: string,
  context: ExperienceCompilerContextV7 = {},
): CompiledExperienceV8 {
  const v7 = compileExperienceV7(prompt, context);
  const rawMovie = extractLatentMovieV5(prompt);
  const design = designExperienceV8(v7.intent, rawMovie);
  const movie = realizeLatentMovieV8(rawMovie, design);
  const moments = buildMoments(movie);
  const flowSteps = buildFlowSteps(movie);
  const blueprint = {
    ...v7.blueprint,
    moments,
    metadata: {
      ...v7.blueprint.metadata,
      dna: [
        ...v7.blueprint.metadata.dna,
        `trajectory:${design.trajectory}`,
        ...design.voice.map((voice) => `voice:${voice}`),
      ],
    },
  };

  return {
    ...v7,
    version: "v8",
    design,
    movie,
    blueprint,
    moments,
    flowSteps,
    estimatedDuration: Math.max(8, movie.beats.length * 4),
    momentCount: moments.length,
  };
}
