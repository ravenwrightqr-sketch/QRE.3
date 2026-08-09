import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { isGenericCompilerProse } from "./premiseRealizer.js";
import {
  realizePremiseBeatV2,
  realizePremiseBeatsV2,
} from "./premiseRealizerV2.js";

/**
 * Compatibility facade for the old realization entry point.
 *
 * The public boundary remains stable while semantic realization now consumes
 * the conserved role-based premise carried by the cognitive plan.
 */

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
): string {
  return realizePremiseBeatV2(beat, plan);
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return realizePremiseBeatsV2(beats, plan);
}

export { isGenericCompilerProse };
