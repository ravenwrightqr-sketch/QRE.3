import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  classifyPremise as classifyLegacyPremise,
  isGenericCompilerProse as isLegacyGenericCompilerProse,
  realizePremiseBeat as realizeLegacyPremiseBeat,
} from "./premiseRealizerLegacy.js";
import {
  inspectTransformation,
  realizeTransformationalBeat,
} from "./transformationEngine.js";

/**
 * CANONICAL LANGUAGE AUTHORITY
 *
 * The mature premise realizer remains the conservative evidence/semantic
 * fallback. Transformation realization now gets first refusal so the same
 * cognitive plan can produce an actual state-changing experience rather than
 * compiler-description prose.
 *
 * Architecture is unchanged:
 * cognition -> premise -> trajectory -> universal compiler -> realization.
 */
export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
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
