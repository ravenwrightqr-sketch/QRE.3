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
  let text = realizeGoldNarrativeBeat(beat, plan) ?? "";

  // Subject repetition is a discourse penalty, not a ban. The opening and
  // earned payoff may name the subject; middle beats should let the event,
  // reaction, detail, or consequence carry attention.
  const name = cleanSubject(plan?.centralSubject ?? beat.directive?.subject ?? "");
  if (name && beat.order >= 2 && beat.kind !== "transformation" && beat.kind !== "payoff") {
    const startsWithSubject = new RegExp(`^${escapeRegExp(name)}\\b`, "i").test(text);
    if (startsWithSubject) {
      text = beat.kind === "feedback"
        ? "The reaction was immediate, dramatic, and entirely justified."
        : beat.kind === "identity"
          ? "After that, the new look was hard to miss."
          : text.replace(new RegExp(`^${escapeRegExp(name)}\\b\\s*`, "i"), "");
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
