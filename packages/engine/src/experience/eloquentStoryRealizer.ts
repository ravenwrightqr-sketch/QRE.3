import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { isGenericCompilerProse, realizePremiseBeat, realizePremiseBeats } from "./premiseRealizer.js";

/**
 * COMPATIBILITY FACADE — NOT A SECOND REALIZER.
 *
 * The canonical language authority is premiseRealizer.ts. This file exists
 * only so older callers can keep their import surface while the architecture
 * converges on one realization boundary.
 */

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
  _prompt?: string,
): string {
  return realizePremiseBeat(beat, plan);
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
  _prompt?: string,
): StoryBeat[] {
  return realizePremiseBeats(beats, plan);
}

export { isGenericCompilerProse };