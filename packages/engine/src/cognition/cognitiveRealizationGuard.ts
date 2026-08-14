import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * LEGACY-SAFE ADMISSIBILITY GUARD.
 *
 * This file is no longer a prose generator and MUST NOT import any legacy
 * realizer. The active language authority is universalExperienceRealizer.ts.
 * This guard only rejects internal/compiler vocabulary and abstract filler.
 */

const META = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior)\b/i;
const DELIVERY = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const ABSTRACT = /\b(?:the situation|the experience is static|the next state|the intended experiential result|the next supported condition|allow participants to|let participants|affect shared state|determine what happens next|create a reason to continue)\b/i;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sentence(value: string): string {
  return clean(value).replace(/[.!?]+$/, "");
}

export function guardCognitiveBeatText(
  beat: StoryBeat,
  _plan?: CognitiveExperiencePlan,
): string {
  const text = sentence(beat.text);
  if (!text || META.test(text) || DELIVERY.test(text) || ABSTRACT.test(text)) return "";
  return `${text}.`;
}

export function guardCognitiveStory(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: guardCognitiveBeatText(beat, plan),
  }));
}
