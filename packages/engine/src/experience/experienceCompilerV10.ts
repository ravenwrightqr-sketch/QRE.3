import type { ExperienceMoment, FlowStep } from "@qre/contracts";
import { compileExperienceV9, type CompiledExperienceV9 } from "./experienceCompilerV9.js";
import { realizeLatentMovieV10, type RealizedMovieV10 } from "./creativeRealizerV10.js";

export type CompiledExperienceV10 = Omit<CompiledExperienceV9, "version" | "movie" | "moments" | "flowSteps" | "creativity" | "inventions"> & {
  version: "v10";
  movie: RealizedMovieV10["movie"];
  moments: ExperienceMoment[];
  flowSteps: FlowStep[];
  creativity: RealizedMovieV10["opportunities"];
  inventions: RealizedMovieV10["inventions"];
  learning: RealizedMovieV10["learning"];
};

function momentType(index: number, total: number): ExperienceMoment["type"] {
  if (index === 0) return "introduction";
  if (index === total - 1) return "completion";
  return index === Math.floor(total / 2) ? "reveal" : "story";
}

function buildMoments(movie: RealizedMovieV10["movie"]): ExperienceMoment[] {
  return movie.beats.map((beat, index) => ({
    type: momentType(index, movie.beats.length),
    component: "story",
    title: index === 0 ? "The beginning" : index === movie.beats.length - 1 ? "The moment that stayed" : "And then",
    subtitle: movie.subject,
    description: beat.text,
    editable: true,
    demo: false,
    order: index,
    payload: { beatId: `${beat.order}`, source: "experience-v10", factualEvent: movie.facts.find((fact) => new Set(beat.sourceFactIds).has(fact.id))?.text },
  }));
}

function buildFlowSteps(movie: RealizedMovieV10["movie"]): FlowStep[] {
  return movie.beats.map((beat, index) => ({
    id: `experience-v10-${beat.order}`,
    order: index,
    type: "message",
    payload: { beat, beatId: `${beat.order}`, subject: movie.subject, source: "experience-v10" },
  }));
}

/** V10 is the evidence-grounded creative boundary: human intent in, specific experience out. */
export function compileExperienceV10(prompt: string, context: Parameters<typeof compileExperienceV9>[1] = {}): CompiledExperienceV10 {
  const v9 = compileExperienceV9(prompt, context);
  const realized = realizeLatentMovieV10(v9.movie, v9.design);
  const moments = buildMoments(realized.movie);
  const flowSteps = buildFlowSteps(realized.movie);
  return {
    ...v9,
    version: "v10",
    movie: realized.movie,
    moments,
    flowSteps,
    creativity: realized.opportunities,
    inventions: realized.inventions,
    learning: realized.learning,
    estimatedDuration: Math.max(8, realized.movie.beats.length * 4),
    momentCount: moments.length,
  };
}
