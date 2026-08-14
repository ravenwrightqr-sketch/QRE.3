import type { MemoryContext, MemoryGeoContextV16, MemorySpatialV16 } from "@qre/contracts";
import { compileExperienceV15, type CompiledExperienceV15, type ExperienceCompilerContextV15 } from "./experienceCompilerV15.js";
import { compileUniversalMemoryV16, memorySpatialSignalsV16, type UniversalMemoryV16 } from "./universalMemoryV16.js";

export type ExperienceCompilerContextV16 = ExperienceCompilerContextV15 & {
  memory?: MemoryContext;
  geo?: MemoryGeoContextV16;
  spatialMemory?: MemorySpatialV16;
};

export type CompiledExperienceV16 = Omit<CompiledExperienceV15, "version" | "memory"> & {
  version: "v16";
  memory: UniversalMemoryV16;
  memorySpatialSignals: string[];
};

export function compileExperienceV16(
  prompt: string,
  context: ExperienceCompilerContextV16 = {},
): CompiledExperienceV16 {
  const v15 = compileExperienceV15(prompt, context);
  const memory = compileUniversalMemoryV16(
    context.memoryScope ?? { assetId: "experience-v16" },
    prompt,
    v15.movie,
    context.memory,
    context.geo,
    context.spatialMemory,
  );
  const subjectId = v15.movie.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    ...v15,
    version: "v16",
    memory,
    memorySpatialSignals: memorySpatialSignalsV16(memory, subjectId),
  };
}
