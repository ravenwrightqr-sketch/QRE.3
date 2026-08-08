import type {
  CompilerMind
} from "@qre/contracts";


export function understandPrompt(
  mind: CompilerMind
): CompilerMind {

  return {
    ...mind,
    understanding: {
      ...mind.understanding
    }
  };

}