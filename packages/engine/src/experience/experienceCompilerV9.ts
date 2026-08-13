import type { ExperienceMoment, FlowStep } from "@qre/contracts";
import { compileExperienceV8, type CompiledExperienceV8 } from "./experienceCompilerV8.js";
import { realizeLatentMovieV9, type RealizedMovieV9 } from "./creativeRealizerV9.js";

export type CompiledExperienceV9 = Omit<CompiledExperienceV8, "version" | "movie" | "moments" | "flowSteps"> & {
  version: "v9";
  movie: RealizedMovieV9["movie"];
  moments: ExperienceMoment[];
  flowSteps: FlowStep[];
  creativity: RealizedMovieV9["opportunities"];
  inventions: RealizedMovieV9["inventions"];
};

const GENERIC_ENTITIES = new Set([
  "dog", "cat", "pet", "housekeeping", "housekeeper", "groomer", "grooming", "service",
  "salon", "business", "client", "customer", "wedding", "birthday", "home", "house",
  "property", "product", "moment", "the moment", "raves", "rave",
]);

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function resolveEntitySubject(movie: CompiledExperienceV8["movie"]): string {
  const candidates = movie.facts
    .flatMap((fact) => fact.actors)
    .map(clean)
    .filter(Boolean)
    .filter((candidate) => !GENERIC_ENTITIES.has(candidate.toLowerCase()));

  if (candidates.length) return candidates[0];
  return movie.subject;
}

function groundMovieEntity(movie: CompiledExperienceV8["movie"]): CompiledExperienceV8["movie"] {
  const subject = resolveEntitySubject(movie);
  const oldSubject = movie.subject;
  if (!subject || subject === oldSubject) return movie;

  const replaceSubject = (text: string) => {
    if (!oldSubject) return text;
    return text.replace(new RegExp(`\\b${oldSubject.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "gi"), subject);
  };

  return {
    ...movie,
    subject,
    memoryThread: {
      ...movie.memoryThread,
      subject,
      identitySignals: [...new Set([subject, ...movie.memoryThread.identitySignals])],
    },
    beats: movie.beats.map((beat) => ({ ...beat, text: replaceSubject(beat.text) })),
  };
}

function momentType(index: number, total: number): ExperienceMoment["type"] {
  if (index === 0) return "introduction";
  if (index === total - 1) return "completion";
  return index === Math.floor(total / 2) ? "reveal" : "story";
}

function buildMoments(movie: CompiledExperienceV8["movie"]): ExperienceMoment[] {
  return movie.beats.map((beat, index) => ({
    type: momentType(index, movie.beats.length),
    component: "story",
    title: index === 0 ? "The beginning" : index === movie.beats.length - 1 ? "The moment that stayed" : "And then",
    subtitle: movie.subject,
    description: beat.text,
    editable: true,
    demo: false,
    order: index,
    payload: { beatId: `${beat.order}`, source: "experience-v9", factualEvent: movie.facts.find((fact) => new Set(beat.sourceFactIds).has(fact.id))?.text },
  }));
}

function buildFlowSteps(movie: CompiledExperienceV8["movie"]): FlowStep[] {
  return movie.beats.map((beat, index) => ({
    id: `experience-v9-${beat.order}`,
    order: index,
    type: "message",
    payload: { beat, beatId: `${beat.order}`, subject: movie.subject, source: "experience-v9" },
  }));
}

export function compileExperienceV9(prompt: string, context: Parameters<typeof compileExperienceV8>[1] = {}): CompiledExperienceV9 {
  const v8 = compileExperienceV8(prompt, context);
  const groundedMovie = groundMovieEntity(v8.movie);
  const realized = realizeLatentMovieV9(groundedMovie, v8.design);
  const moments = buildMoments(realized.movie);
  const flowSteps = buildFlowSteps(realized.movie);
  return { ...v8, version: "v9", movie: realized.movie, moments, flowSteps, creativity: realized.opportunities, inventions: realized.inventions, estimatedDuration: Math.max(8, realized.movie.beats.length * 4), momentCount: moments.length };
}
