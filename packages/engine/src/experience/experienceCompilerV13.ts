import type { ExperienceMoment, FlowStep, MemoryContext } from "@qre/contracts";
import { compileExperienceV12, type CompiledExperienceV12, type ExperienceCompilerContextV12 } from "./experienceCompilerV12.js";
import { compileUniversalMemoryV13, memoryWorldSignalsV13, type UniversalMemoryV13 } from "./universalMemoryV13.js";

export type ExperienceCompilerContextV13 = ExperienceCompilerContextV12 & {
  memory?: MemoryContext;
};

export type CompiledExperienceV13 = Omit<CompiledExperienceV12, "version" | "memory"> & {
  version: "v13";
  memory: UniversalMemoryV13;
  memoryWorldSignals: string[];
};

function buildMoments(movie: CompiledExperienceV12["movie"]): ExperienceMoment[] {
  return movie.beats.map((beat, index) => ({
    type: index === 0 ? "introduction" : index === movie.beats.length - 1 ? "completion" : index === Math.floor(movie.beats.length / 2) ? "reveal" : "story",
    component: "story",
    title: index === 0 ? "The beginning" : index === movie.beats.length - 1 ? "The moment that stayed" : "And then",
    subtitle: movie.subject,
    description: beat.text,
    editable: true,
    demo: false,
    order: index,
    payload: { beatId: `${beat.order}`, source: "experience-v13", factualEvent: movie.facts.find((fact) => new Set(beat.sourceFactIds).has(fact.id))?.text },
  }));
}

function buildFlowSteps(movie: CompiledExperienceV12["movie"]): FlowStep[] {
  return movie.beats.map((beat, index) => ({
    id: `experience-v13-${beat.order}`,
    order: index,
    type: "message",
    payload: { beat, beatId: `${beat.order}`, subject: movie.subject, source: "experience-v13" },
  }));
}

export function compileExperienceV13(prompt: string, context: ExperienceCompilerContextV13 = {}): CompiledExperienceV13 {
  const v12 = compileExperienceV12(prompt, context);
  const memory = compileUniversalMemoryV13(
    context.memoryScope ?? { assetId: "experience-v13" },
    prompt,
    v12.movie,
    context.memory,
  );
  const subjectId = v12.movie.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    ...v12,
    version: "v13",
    moments: buildMoments(v12.movie),
    flowSteps: buildFlowSteps(v12.movie),
    memory,
    memoryWorldSignals: memoryWorldSignalsV13(memory, subjectId),
  };
}
