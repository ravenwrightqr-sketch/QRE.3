import { compileExperienceV10, type CompiledExperienceV10 } from "./experienceCompilerV10.js";
import {
  createCreativeLearningProfileV11,
  learnFromInventionsV11,
  suggestCreativeStrategyV11,
  type CreativeLearningProfileV11,
} from "./creativeLearningV11.js";

export type ExperienceCompilerContextV11 = Parameters<typeof compileExperienceV10>[1] & {
  creativeLearning?: CreativeLearningProfileV11;
  creativeFeedback?: { accepted?: boolean; quality?: number };
};

export type CompiledExperienceV11 = CompiledExperienceV10 & {
  version: "v11";
  creativeLearning: CreativeLearningProfileV11;
  learnedStrategy: ReturnType<typeof suggestCreativeStrategyV11>;
};

/**
 * V11 adds the learning loop around V10 without putting persistence in the
 * engine. The engine observes what it just invented; API/DB can persist the
 * returned profile and feed it back into the next compilation.
 */
export function compileExperienceV11(
  prompt: string,
  context: ExperienceCompilerContextV11 = {},
): CompiledExperienceV11 {
  const v10 = compileExperienceV10(prompt, context);
  const profile = context.creativeLearning ?? createCreativeLearningProfileV11();
  const accepted = context.creativeFeedback?.accepted ?? true;
  let creativeLearning = learnFromInventionsV11(profile, v10.learning.domain, v10.inventions, accepted);

  if (context.creativeFeedback?.quality !== undefined && v10.inventions.length) {
    const feedback = context.creativeFeedback.quality;
    const adjusted = v10.inventions.map((invention) => ({
      ...invention,
      confidence: Math.max(0, Math.min(1, feedback)),
      noveltyScore: Math.max(0, Math.min(1, invention.noveltyScore * 0.5 + feedback * 0.5)),
    }));
    creativeLearning = learnFromInventionsV11(creativeLearning, v10.learning.domain, adjusted, accepted);
  }

  return {
    ...v10,
    version: "v11",
    creativeLearning,
    learnedStrategy: suggestCreativeStrategyV11(creativeLearning, v10.learning.domain),
  };
}
