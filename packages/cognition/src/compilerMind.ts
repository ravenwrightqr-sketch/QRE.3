import type {
  CompilerMind as CompilerMindState
} from "@qre/contracts";


export interface CompilerMindInput {
  state: CompilerMindState;
}


export class CompilerMindEngine {

  evolve(
    input: CompilerMindInput
  ): CompilerMindState {

  return {
  ...input.state,
  prompt: input.state.prompt
};

  }

}