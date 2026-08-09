import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  isGenericCompilerProse,
  realizePremiseBeat,
  realizePremiseBeats,
} from "./premiseRealizer.js";

/**
 * Compatibility facade for the old realization entry point.
 *
 * The name remains stable so the compiler/runtime architecture does not need
 * to change. The implementation no longer acts like a thesaurus pass or
 * explain the compiler's own abstractions. It delegates to premise-driven
 * realization instead.
 */

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
): string {
  return realizePremiseBeat(beat, plan);
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return realizePremiseBeats(beats, plan);
}

export { isGenericCompilerProse };
