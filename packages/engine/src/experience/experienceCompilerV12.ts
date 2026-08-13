import type { ExperienceMoment, FlowStep, MemoryContext } from "@qre/contracts";
import { compileExperienceV10, type CompiledExperienceV10 } from "./experienceCompilerV10.js";
import { createCreativeLearningProfileV11, learnFromInventionsV11, suggestCreativeStrategyV11, type CreativeLearningProfileV11 } from "./creativeLearningV11.js";
import { compileUniversalMemoryV12, memoryContinuitySignalsV12, type MemoryScopeV12 } from "./universalMemoryV12.js";

export type ExperienceCompilerContextV12 = Parameters<typeof compileExperienceV10>[1] & {
  memoryScope?: MemoryScopeV12;
  memory?: MemoryContext;
  creativeLearning?: CreativeLearningProfileV11;
  creativeFeedback?: { accepted?: boolean; quality?: number };
};

export type CompiledExperienceV12 = Omit<CompiledExperienceV10, "version"> & {
  version: "v12";
  memory: MemoryContext;
  memoryContinuity: string[];
  creativeLearning: CreativeLearningProfileV11;
  learnedStrategy: ReturnType<typeof suggestCreativeStrategyV11>;
};

function buildMoments(movie: CompiledExperienceV10["movie"]): ExperienceMoment[] {
  return movie.beats.map((beat, index) => ({
    type: index === 0 ? "introduction" : index === movie.beats.length - 1 ? "completion" : index === Math.floor(movie.beats.length / 2) ? "reveal" : "story",
    component: "story",
    title: index === 0 ? "The beginning" : index === movie.beats.length - 1 ? "The moment that stayed" : "And then",
    subtitle: movie.subject,
    description: beat.text,
    editable: true,
    demo: false,
    order: index,
    payload: { beatId: `${beat.order}`, source: "experience-v12", factualEvent: movie.facts.find((fact) => new Set(beat.sourceFactIds).has(fact.id))?.text },
  }));
}

function buildFlowSteps(movie: CompiledExperienceV10["movie"]): FlowStep[] {
  return movie.beats.map((beat, index) => ({
    id: `experience-v12-${beat.order}`,
    order: index,
    type: "message",
    payload: { beat, beatId: `${beat.order}`, subject: movie.subject, source: "experience-v12" },
  }));
}

export function compileExperienceV12(prompt: string, context: ExperienceCompilerContextV12 = {}): CompiledExperienceV12 {
  const v10 = compileExperienceV10(prompt, context);
  const profile = context.creativeLearning ?? createCreativeLearningProfileV11();
  const accepted = context.creativeFeedback?.accepted ?? true;
  let creativeLearning = learnFromInventionsV11(profile, v10.learning.domain, v10.inventions, accepted);
  if (context.creativeFeedback?.quality !== undefined && v10.inventions.length) {
    const feedback = context.creativeFeedback.quality;
    creativeLearning = learnFromInventionsV11(creativeLearning, v10.learning.domain, v10.inventions.map((invention) => ({
      ...invention,
      confidence: Math.max(0, Math.min(1, feedback)),
      noveltyScore: Math.max(0, Math.min(1, invention.noveltyScore * 0.5 + feedback * 0.5)),
    })), accepted);
  }

  const memoryScope: MemoryScopeV12 = context.memoryScope ?? { assetId: "experience-v12" };
  const memory = compileUniversalMemoryV12(memoryScope, prompt, v10.movie, context.memory);
  const memoryContinuity = memoryContinuitySignalsV12(memory, v10.movie.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const moments = buildMoments(v10.movie);
  const flowSteps = buildFlowSteps(v10.movie);

  return {
    ...v10,
    version: "v12",
    moments,
    flowSteps,
    memory,
    memoryContinuity,
    creativeLearning,
    learnedStrategy: suggestCreativeStrategyV11(creativeLearning, v10.learning.domain),
  };
}
