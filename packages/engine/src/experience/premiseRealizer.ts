import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  classifyNarrativeBeat,
  isGenericCompilerProse as isNarrativeGenericProse,
} from "./narrativeAttentionRealizer.js";
import {
  realizeGoldNarrativeBeat,
  realizeGoldNarrativeBeats,
} from "./goldNarrativeRealizer.js";
import { realizeObservedEventBeat } from "./observedEventRealizer.js";
import { inspectTransformation } from "./transformationEngine.js";

/**
 * CANONICAL LANGUAGE AUTHORITY
 *
 * Cognition and trajectory decide what kind of experience is happening.
 * Observed-event realization is the first prose boundary: concrete prompt
 * evidence gets the first chance to become language. Gold narrative prose is
 * the stylistic fallback for beats where no direct observed event can carry
 * the sentence.
 */
export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const observed = realizeObservedEventBeat(beat, plan);
  let text = observed ?? realizeGoldNarrativeBeat(beat, plan) ?? "";

  const name = cleanSubject(plan?.centralSubject ?? beat.directive?.subject ?? "");
  if (name && beat.order >= 2 && beat.kind !== "transformation" && beat.kind !== "payoff") {
    const startsWithSubject = new RegExp(`^${escapeRegExp(name)}\\b`, "i").test(text);
    if (startsWithSubject) {
      // Only remove a repeated subject when the sentence still contains a
      // grammatical alternative. Never turn "Coco arrived" into "arrived".
      const remainder = text.replace(new RegExp(`^${escapeRegExp(name)}\\b\\s*`, "i"), "");
      if (remainder && !/^(?:arrived|left|entered|returned|went|came|looked|was|is|got)\b/i.test(remainder)) {
        text = remainder[0]!.toUpperCase() + remainder.slice(1);
      }
    }
  }

  return text;
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return realizeGoldNarrativeBeats(beats, plan).map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
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

function cleanSubject(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}
