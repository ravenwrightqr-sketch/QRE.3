import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  classifyNarrativeBeat,
  isGenericCompilerProse as isNarrativeGenericProse,
  realizeNarrativeBeat,
  realizeNarrativeBeats,
} from "./narrativeAttentionRealizer.js";
import {
  inspectTransformation,
} from "./transformationEngine.js";

/**
 * CANONICAL LANGUAGE AUTHORITY
 *
 * Cognition and trajectory remain upstream. This module is the presentation
 * boundary. Narrative attention gets first authority so internal operations
 * do not become customer sentences.
 */
export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  return realizeNarrativeBeat(beat, plan) ?? "";
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return realizeNarrativeBeats(beats, plan);
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
