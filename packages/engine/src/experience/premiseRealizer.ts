import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  classifyPremise as classifyLegacyPremise,
  isGenericCompilerProse as isLegacyGenericCompilerProse,
  realizePremiseBeat as realizeLegacyPremiseBeat,
} from "./premiseRealizerLegacy.js";
import { realizeSuperStoryBeat } from "./superStoryRealizer.js";
import {
  inspectTransformation,
  realizeTransformationalBeat,
} from "./transformationEngine.js";

/**
 * CANONICAL LANGUAGE AUTHORITY
 *
 * Customer-facing prose gets the strongest realization pass first. The older
 * transformational realizer remains the evidence-safe fallback, followed by
 * the conservative legacy semantic realizer.
 *
 * Architecture is unchanged:
 * cognition -> premise -> trajectory -> universal compiler -> realization.
 */
export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const superStory = realizeSuperStoryBeat(beat, plan);
  if (superStory) return superStory;

  const transformed = realizeTransformationalBeat(beat, plan);
  if (transformed) return transformed;
  return realizeLegacyPremiseBeat(beat, plan);
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return isLegacyGenericCompilerProse(value);
}

export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
  return classifyLegacyPremise(beat, plan);
}

export { inspectTransformation };
