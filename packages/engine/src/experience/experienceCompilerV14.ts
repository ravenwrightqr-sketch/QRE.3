import type { MemoryContext } from "@qre/contracts";
import { compileExperienceV13, type CompiledExperienceV13, type ExperienceCompilerContextV13 } from "./experienceCompilerV13.js";
import { compileUniversalMemoryV14, memoryIntelligenceSignalsV14, type UniversalMemoryV14 } from "./universalMemoryV14.js";

export type ExperienceCompilerContextV14 = ExperienceCompilerContextV13 & {
  memory?: MemoryContext;
};

export type CompiledExperienceV14 = Omit<CompiledExperienceV13, "version" | "memory"> & {
  version: "v14";
  memory: UniversalMemoryV14;
  memoryIntelligenceSignals: string[];
};

export function compileExperienceV14(prompt: string, context: ExperienceCompilerContextV14 = {}): CompiledExperienceV14 {
  const v13 = compileExperienceV13(prompt, context);
  const memory = compileUniversalMemoryV14(
    context.memoryScope ?? { assetId: "experience-v14" },
    prompt,
    v13.movie,
    context.memory,
  );
  const subjectId = v13.movie.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    ...v13,
    version: "v14",
    memory,
    memoryIntelligenceSignals: memoryIntelligenceSignalsV14(memory, subjectId),
  };
}
