import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  isGenericCompilerProse,
  realizePremiseBeat,
} from "../experience/premiseRealizer.js";

/**
 * FINAL REALIZATION BODYGUARD
 *
 * This boundary is a validator/repair mechanism, not a second language brain.
 * If canonical realization produced semantic/meta prose, repair the beat by
 * invoking the same canonical premise realizer with the preserved evidence.
 *
 * Invariant:
 * mechanic vocabulary alone is never accepted as realization. A beat must
 * contain an observable action, condition, transition, consequence, or
 * preserved concrete detail.
 */

const ABSTRACT = [
  /make .* matter(?: through| by| with)?[^.!?]*/i,
  /make .* meaningful(?: through| by| with)?[^.!?]*/i,
  /adapt to accumulated[^.!?]*/i,
  /adapt to .* history[^.!?]*/i,
  /allow participants to[^.!?]*/i,
  /let participants[^.!?]*/i,
  /enter living memory[^.!?]*/i,
  /affect shared state[^.!?]*/i,
  /change what can happen next[^.!?]*/i,
  /determine what happens next[^.!?]*/i,
  /carry .* into the present[^.!?]*/i,
  /recognize what .* means[^.!?]*/i,
  /create a reason to continue[^.!?]*/i,
  /the intended experiential result[^.!?]*/i,
  /the next supported condition/i,
  /go further than before/i,
  /increase the active condition/i,
  /carry the preceding state/i,
  /reach the result produced by what happened before/i,
  /gets increasingly\b[^.!?]*/i,
  /becomes increasingly\b[^.!?]*/i,
];

const OBSERVABLE = /\b(?:arrives?|enters?|crosses?|encounters?|notices?|finds?|sees?|discovers?|handles?|touches?|uses?|opens?|closes?|moves?|returns?|adds?|shares?|gives?|brings?|takes?|shows?|records?|writes?|reads?|follows?|chooses?|responds?|inspects?|cleans?|washes?|grooms?|serves?|plays?|collects?|keeps?|preserves?|reaches?|earns?|claims?|owns?|changes?|reveals?|places?|leaves?|picks?|carries?|visits?|meets?|watches?|hears?|smells?|tastes?|looks?|holds?|builds?|repairs?|restores?|prepares?|delivers?|documents?|photographs?|saves?|stores?|remembers?|recognizes?|compares?|connects?|continues?)\b/i;
const TRANSITIONAL = /\b(?:changes?|changed|becomes?|became|different|result|consequence|because|after|now|then|next|remains?|carries?|contains?|available|visible|unresolved|hidden|unknown|another|again|further|more|larger|bigger)\b/i;

const AGENCY_SIGNAL = /\b(?:agency|choice|choose|chooses|chosen|decide|decides|decision|determines|determined|participant|participants|owner|ownership|gets the move|gets to decide|gets to choose)\b/i;
const AGENCY_PRESENTATION = /\b(?:choice|choose|chooses|chosen|decide|decides|decision|determines|determined|participant|participants|agency|own path|their path)\b/i;

function clean(value: string): string { return value.replace(/\s+/g, " ").trim(); }
function sentence(value: string): string { return clean(value).replace(/[.!?]+$/, ""); }

function stripAbstract(text: string): string {
  let result = clean(text);
  for (const pattern of ABSTRACT) result = result.replace(pattern, " ");
  return clean(result.replace(/\s+([,.])/g, "$1"));
}

function stillAbstract(text: string): boolean {
  return ABSTRACT.some((pattern) => pattern.test(text));
}

function hasObservableEvent(text: string, beat: StoryBeat): boolean {
  if (OBSERVABLE.test(text)) return true;
  if (["transformation", "feedback", "reflection", "payoff", "continuation"].includes(beat.kind)) return TRANSITIONAL.test(text);
  return false;
}

function needsRepair(beat: StoryBeat, text: string): boolean {
  if (!text || isGenericCompilerProse(text) || stillAbstract(text)) return true;
  if (!hasObservableEvent(text, beat)) return true;

  switch (beat.kind) {
    case "escalation": return !/\b(?:another|again|further|more|larger|bigger|adds?|changes?|intensif|exceed|beyond)\b/i.test(text);
    case "transformation": return !/\b(?:changes?|becomes?|different|moves? from|after|now)\b/i.test(text);
    case "contribution": return !/\b(?:adds?|shares?|gives?|contributes?|contains?|changes?|available)\b/i.test(text);
    case "feedback": return !/\b(?:result|responds?|changes?|because|after|consequence)\b/i.test(text);
    case "discovery":
    case "reveal": return !/\b(?:finds?|discovers?|sees?|reveals?|appears?|shows?|uncovers?)\b/i.test(text);
    default: return false;
  }
}

function agencySource(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  return [
    beat.text,
    plan?.interactionModel?.join(" "),
    plan?.dynamicBehavior?.join(" "),
    plan?.futureEvolution?.join(" "),
    plan?.realization?.semanticArc?.join(" "),
    ...(plan?.realization?.directives?.flatMap((directive) => [directive.intent, directive.action, directive.stateAfter]) ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function preserveAgency(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const source = agencySource(beat, plan);

  if (!AGENCY_SIGNAL.test(source) || AGENCY_PRESENTATION.test(text)) {
    return text;
  }

  return `${sentence(text)} Participants choose what happens next, and that choice determines the available path.`;
}

export function guardCognitiveBeatText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const original = sentence(beat.text);
  const stripped = stripAbstract(original);
  let result: string;

  if (!needsRepair(beat, stripped)) {
    result = `${stripped}.`;
  } else {
    const repaired = sentence(realizePremiseBeat(beat, plan));
    result = `${repaired || stripped || original}.`;
  }

  return `${sentence(preserveAgency(result, beat, plan))}.`;
}

export function guardCognitiveStory(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: guardCognitiveBeatText(beat, plan) }));
}
