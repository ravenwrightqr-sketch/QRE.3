import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { realizeEnterpriseBeat } from "../experience/enterpriseEvidenceRealizer.js";

/**
 * FINAL REALIZATION GUARD
 *
 * This module is intentionally not a second language brain. The enterprise
 * realizer owns wording. This guard only decides whether text is admissible;
 * when repair is necessary it calls the same realizer.
 */

const META = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior)\b/i;
const DELIVERY = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const ABSTRACT = /\b(?:the situation|the experience is static|the next state|the intended experiential result|the next supported condition|allow participants to|let participants|affect shared state|determine what happens next|create a reason to continue)\b/i;
const OBSERVABLE = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|build|make|create|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|shake|shook|chew|chewed|add|adding|remember|preserve|document)\w*\b/i;
const TRANSITIONAL = /\b(?:changes?|changed|becomes?|became|different|because|after|now|then|next|remains?|carries?|contains?|available|visible|hidden|unknown|another|again|further|more|larger|bigger)\b/i;

function clean(value: string): string { return value.replace(/\s+/g, " ").trim(); }
function sentence(value: string): string { return clean(value).replace(/[.!?]+$/, ""); }

function hasConcreteAnchor(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): boolean {
  const hay = clean(text).toLowerCase();
  const values = [
    ...(plan?.premise?.slots.flatMap((slot) => slot.values) ?? []),
    ...(beat.entities ?? []),
  ]
    .map((value) => clean(value).toLowerCase())
    .filter((value) => value.length >= 2);

  return values.some((value) => hay.includes(value));
}

function needsRepair(beat: StoryBeat, text: string, plan?: CognitiveExperiencePlan): boolean {
  if (!text || META.test(text) || DELIVERY.test(text) || ABSTRACT.test(text)) return true;
  if (OBSERVABLE.test(text) || TRANSITIONAL.test(text) || hasConcreteAnchor(text, beat, plan)) return false;
  return beat.kind !== "continuation";
}

export function guardCognitiveBeatText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const original = sentence(beat.text);
  const repaired = needsRepair(beat, original, plan)
    ? sentence(realizeEnterpriseBeat(beat, plan) ?? original)
    : original;

  return repaired ? `${repaired}.` : "";
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
