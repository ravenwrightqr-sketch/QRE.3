import type {
  CompilerMind
} from "@qre/contracts";


export function buildMeaningContext(
  mind: CompilerMind
): CompilerMind {

  return {
    ...mind,
    meaningContext: {
      ...mind.meaningContext
    }
  };

}