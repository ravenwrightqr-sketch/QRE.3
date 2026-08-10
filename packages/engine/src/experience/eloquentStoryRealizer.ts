import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { isGenericCompilerProse } from "./premiseRealizer.js";
import {
  realizePremiseBeatV3,
  realizePremiseBeatsV3,
} from "./premiseRealizerV3.js";

/**
 * Compatibility facade for the story realization entry point.
 *
 * The public boundary remains stable while presentation realization consumes
 * semantic directives plus conserved premise evidence and concrete prompt
 * details carried by the compiled beat.
 */

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
): string {
  return realizePremiseBeatV3(beat, plan);
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return realizePremiseBeatsV3(beats, plan);
}

export { isGenericCompilerProse };
