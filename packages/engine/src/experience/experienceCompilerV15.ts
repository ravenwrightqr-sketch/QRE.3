import type { MemoryContext } from "@qre/contracts";
import { compileExperienceV14, type CompiledExperienceV14, type ExperienceCompilerContextV14 } from "./experienceCompilerV14.js";
import { compileUniversalMemoryV15, memoryForesightSignalsV15, type UniversalMemoryV15 } from "./universalMemoryV15.js";

export type ExperienceCompilerContextV15 = ExperienceCompilerContextV14 & {
  memory?: MemoryContext;
};

export type CompiledExperienceV15 = Omit<CompiledExperienceV14, "version" | "memory"> & {
  version: "v15";
  memory: UniversalMemoryV15;
  memoryForesightSignals: string[];
};

export function compileExperienceV15(prompt: string, context: ExperienceCompilerContextV15 = {}): CompiledExperienceV15 {
  const v14 = compileExperienceV14(prompt, context);
  const memory = compileUniversalMemoryV15(
    context.memoryScope ?? { assetId: "experience-v15" },
    prompt,
    v14.movie,
    context.memory,
  );
  const subjectId = v14.movie.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    ...v14,
    version: "v15",
    memory,
    memoryForesightSignals: memoryForesightSignalsV15(memory, subjectId),
  };
}
