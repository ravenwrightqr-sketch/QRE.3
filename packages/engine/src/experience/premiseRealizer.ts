import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  classifyNarrativeBeat,
  isGenericCompilerProse as isNarrativeGenericProse,
} from "./narrativeAttentionRealizer.js";
import {
  realizeGoldNarrativeBeat,
  realizeGoldNarrativeBeats,
} from "./goldNarrativeRealizer.js";
import {
  inspectTransformation,
} from "./transformationEngine.js";

/**
 * CANONICAL LANGUAGE AUTHORITY
 *
 * Cognition and trajectory remain upstream. This module is the presentation
 * boundary. The gold narrative layer chooses observable evidence and sentence
 * shape without introducing domain templates or internal vocabulary.
 */
export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  return realizeGoldNarrativeBeat(beat, plan) ?? "";
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return realizeGoldNarrativeBeats(beats, plan);
}

export function isGenericCompilerProse(value: string): boolean {
  return isNarrativeGenericProse(value);
}

export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
  return classifyNarrativeBeat(beat, plan);
}

export { inspectTransformation };
