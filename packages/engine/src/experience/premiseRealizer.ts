import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  classifyNarrativeBeat,
  isGenericCompilerProse as isNarrativeGenericProse,
} from "./narrativeAttentionRealizer.js";
import { realizeGoldNarrativeBeat, realizeGoldNarrativeBeats } from "./goldNarrativeRealizer.js";
import { realizeObservedEventBeat } from "./observedEventRealizer.js";
import { inspectTransformation } from "./transformationEngine.js";

const PLAYFUL = /\b(?:fun|funny|playful|comedy|hilarious|absurd|ridiculous|wild|silly|whimsical|cheeky|witty)\b/i;
const SERIOUS = /\b(?:respectful|serious|memorial|funeral|grief|death|died|medical|injury|legal|lawsuit|emergency)\b/i;

/**
 * CANONICAL LANGUAGE AUTHORITY.
 *
 * The event layer protects reality. The gold layer protects voice. Neither is
 * allowed to replace the other: creative prose may frame an observed event,
 * but it cannot erase the event that made the experience worth telling.
 */
export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const observed = realizeObservedEventBeat(beat, plan);
  const gold = realizeGoldNarrativeBeat(beat, plan);
  const playful = PLAYFUL.test([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    plan?.purpose ?? "",
    ...(plan?.contentModel ?? []),
  ].join(" ")) && !SERIOUS.test([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    plan?.purpose ?? "",
  ].join(" "));

  let text: string;
  if (!observed) {
    text = gold ?? "";
  } else if (!gold || isNarrativeGenericProse(gold)) {
    text = observed;
  } else if (playful && ["orientation", "feedback", "escalation", "transformation", "payoff"].includes(beat.kind)) {
    // Keep the creative turn, then pin it to the observed event. This is the
    // universal compromise: tone is allowed to become strange, but facts stay
    // visible underneath it.
    text = `${gold} ${observed}`;
  } else if (beat.kind === "transformation" || beat.kind === "payoff") {
    text = `${gold} ${observed}`;
  } else {
    text = observed;
  }

  const name = cleanSubject(plan?.centralSubject ?? beat.directive?.subject ?? "");
  if (name && beat.order >= 2 && beat.kind !== "transformation" && beat.kind !== "payoff") {
    const startsWithSubject = new RegExp(`^${escapeRegExp(name)}\\b`, "i").test(text);
    if (startsWithSubject) {
      const remainder = text.replace(new RegExp(`^${escapeRegExp(name)}\\b\\s*`, "i"), "");
      if (remainder && !/^(?:arrived|left|entered|returned|went|came|looked|was|is|got)\b/i.test(remainder)) {
        text = remainder[0]!.toUpperCase() + remainder.slice(1);
      }
    }
  }

  return text;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return realizeGoldNarrativeBeats(beats, plan).map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return isNarrativeGenericProse(value);
}

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  return classifyNarrativeBeat(beat, plan);
}

export { inspectTransformation };

function cleanSubject(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}
