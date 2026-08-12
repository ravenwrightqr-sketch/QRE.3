import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";
import { buildRealityModel } from "./realityModel.js";
import { inspectTransformation } from "./transformationEngine.js";

/**
 * FINAL CUSTOMER LANGUAGE AUTHORITY
 *
 * Cognition supplies reality. This boundary discovers the relationship between
 * the observations and realizes that relationship as ordinary human prose.
 *
 * The important distinction is:
 *   fact -> relationship -> interpretation -> language
 *
 * not:
 *   fact -> template sentence
 *
 * Creative language may interpret an observed relationship, but may not add a
 * physical event, object, person, or outcome that the prompt did not support.
 */

const ROLES: CognitivePremiseRole[] = [
  "subject",
  "participants",
  "event",
  "artifact",
  "outcome",
  "place",
  "social",
  "affordance",
  "temporal",
  "transformation",
  "emotion",
  "medium",
  "constraint",
];

const INTERNAL = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue|new memories can change what later visitors discover)\b/i;
const DELIVERY = /\b(?:customer-facing|generated output|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline)\b/i;
const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|meaning|progression|model|state|condition|possibility|potential|context|development|behavior|behaviour|dynamic|reason to continue)\b/i;
const SERIOUS = /\b(?:respectful|serious|memorial|funeral|grief|death|died|medical|injury|legal|lawsuit|emergency|trauma|mourning|bereavement)\b/i;
const PLAYFUL = /\b(?:fun|funny|playful|comedy|hilarious|absurd|ridiculous|wild|silly|whimsical|cheeky|witty|mischief|crazy)\b/i;

const NEGATIVE_STATE = /\b(?:scared|afraid|nervous|worried|anxious|terrified|unsure|reluctant|unhappy|hated|hates|didn't want|did not want|not thrilled|uncomfortable|upset|mad)\b/i;
const POSITIVE_STATE = /\b(?:enjoyed|enjoy|loved|love|happy|relaxed|excited|comfortable|calm|better|great|good|thrilled|delighted|ready|liked|liked it|felt good)\b/i;
const CARE_EVENT = /\b(?:bath|bubbles?|rub|rubs|foot rubs?|massage|groom|grooming|pamper|pampering|wash|washed|brush|brushed|dry|dried|trim|trimmed)\b/i;
const DESTRUCTIVE_EVENT = /\b(?:chew|chewed|ate|eaten|tore|torn|shook|shaken|destroyed|stole|stolen|ran off|ran around)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|returned|groom|clean|wash|repair|fix|restore|build|make|create|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|finish|complete|celebrate|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called|pick up|picked up)\w*\b/i;

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text[0]!.toUpperCase() + text.slice(1) : "";
};

function safe(value: unknown): boolean {
  const text = clean(value);
  return Boolean(text) && !INTERNAL.test(text) && !DELIVERY.test(text);
}

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .map(sentence)
      .filter(safe) ?? [],
  );
}

function subjectOf(plan?: CognitiveExperiencePlan, beat?: StoryBeat): string {
  const reality = buildRealityModel(plan, plan?.premise);
  const realitySubject = reality.entities.find((entity) => entity.id === reality.subjectId)?.name;
  const candidates = unique([
    realitySubject,
    ...values(plan, "subject"),
    clean(plan?.centralSubject),
    clean(beat?.directive?.subject),
    ...(beat?.entities ?? []),
  ]).filter(safe);

  const proper = candidates.flatMap((value) =>
    value.match(/\b[A-Z][A-Za-z0-9'’-]{2,}\b/g) ?? [],
  ).filter((value) => !/^(?:The|Then|And|For|This|That|Make|Create)$/i.test(value));

  return proper[0] ?? candidates.find((value) => value.split(/\s+/).length <= 3) ?? "the subject";
}

function subjectPronoun(plan?: CognitiveExperiencePlan): string {
  const text = lower([
    ...values(plan, "subject"),
    ...values(plan, "participants"),
    ...values(plan, "social"),
    ...(plan?.premise?.slots.flatMap((slot) => slot.values) ?? []),
  ].join(" "));
  if (/\b(?:she|her)\b/i.test(text)) return "she";
  if (/\b(?:he|him|his)\b/i.test(text)) return "he";
  if (/\b(?:they|them|their)\b/i.test(text)) return "they";
  return "they";
}

function observations(plan?: CognitiveExperiencePlan): string[] {
  const reality = buildRealityModel(plan, plan?.premise);
  const observed = reality.observations
    .sort((a, b) => a.order - b.order)
    .map((item) => sentence(item.text))
    .filter(Boolean);

  return unique([
    ...observed,
    ...values(plan, "event"),
    ...values(plan, "outcome"),
    ...values(plan, "transformation"),
  ]).filter(safe);
}

function toneText(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.storyStructure ?? []),
    plan?.purpose ?? "",
  ].join(" "));
}

function playful(plan?: CognitiveExperiencePlan): boolean {
  const text = toneText(plan);
  return !SERIOUS.test(text) && PLAYFUL.test(text);
}

function detail(text: string): string {
  return sentence(text)
    .replace(/^\s*(?:and|then|after that|next|finally)\s+/i, "")
    .trim();
}

function body(text: string, subject: string): string {
  const escaped = escapeRegExp(subject);
  return sentence(text).replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
}

function stateKind(text: string): "negative" | "positive" | "neutral" {
  if (NEGATIVE_STATE.test(text)) return "negative";
  if (POSITIVE_STATE.test(text)) return "positive";
  return "neutral";
}

function relationshipKind(items: string[]): "reversal" | "care" | "mischief" | "transformation" | "sequence" {
  const states = items.map(stateKind);
  if (states.includes("negative") && states.includes("positive") && states.indexOf("negative") < states.lastIndexOf("positive")) return "reversal";
  if (items.some((item) => DESTRUCTIVE_EVENT.test(item))) return "mischief";
  if (items.some((item) => CARE_EVENT.test(item)) && items.length > 1) return "care";
  if (values(undefined, "event").length === 0 && items.length > 1) return "sequence";
  return "transformation";
}

function firstDistinct(items: string[], used: Set<string> = new Set()): string | undefined {
  return items.find((item) => {
    const key = lower(item);
    return key && !used.has(key);
  });
}

function remember(used: Set<string>, item?: string): void {
  if (item) used.add(lower(item));
}

function playfulLens(subject: string, item: string, seed: string): string {
  const d = detail(item);
  const lowerD = d.toLowerCase();
  if (/\b(?:scared|nervous|terrified|afraid|unsure|reluctant|not thrilled)\b/i.test(lowerD)) {
    return choose([
      `${subject} came in looking like this arrangement needed a second opinion.`,
      `${subject} arrived with some serious reservations.`,
      `${subject} walked in looking deeply unconvinced by the plan.`,
    ], seed);
  }
  if (CARE_EVENT.test(d) && POSITIVE_STATE.test(d)) {
    return choose([
      `Then ${d.toLowerCase()}, and apparently the negotiations improved.`,
      `Then came ${d.toLowerCase()}. That seemed to help.`,
      `${cap(d)} changed the mood rather quickly.`,
    ], seed);
  }
  if (DESTRUCTIVE_EVENT.test(d)) {
    return choose([
      `${cap(d)} did not exactly go unnoticed.`,
      `${cap(d)} became the part nobody was going to forget.`,
      `And then ${d.toLowerCase()}. So much for keeping things orderly.`,
    ], seed);
  }
  return choose([
    `Then came ${article(d)}.`,
    `${cap(d)} became the part worth watching.`,
    `That was when ${article(d)} entered the picture.`,
  ], seed);
}

function realizeObservation(item: string, subject: string, index: number, plan?: CognitiveExperiencePlan): string {
  const raw = detail(item);
  const b = body(raw, subject);
  const isPlayful = playful(plan);

  if (index === 0) {
    if (/\b(?:ready to call (?:her|his|their) lawyer|formal complaint|legal representation)\b/i.test(raw)) {
      return cap(raw);
    }
    if (isPlayful && NEGATIVE_STATE.test(raw)) return playfulLens(subject, raw, `${subject}|open|${index}`);
    if (b && /^(?:came|went|walked|arrived|entered|showed up|came in)\b/i.test(b)) return `${subject} ${b.toLowerCase()}.`;
    if (b) return `${subject} came in ${b.toLowerCase()}.`;
    return `${subject} arrived.`;
  }

  if (isPlayful) return playfulLens(subject, raw, `${subject}|observation|${index}|${raw}`);
  if (/^(?:enjoyed|loved|liked|felt|was|became|got)\b/i.test(b)) return `${cap(b)}.`;
  if (b) return `${cap(b)}.`;
  return cap(raw);
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (!text) return "";
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return /^(?:[aeiou])/i.test(text) ? `an ${text}` : `a ${text}`;
}

function choose<T>(items: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return items[(hash >>> 0) % items.length] ?? items[0]!;
}

function composeBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const facts = observations(plan);
  if (!facts.length) return undefined;

  const subject = subjectOf(plan, beat);
  const pronoun = subjectPronoun(plan);
  const isPlayful = playful(plan);
  const relationship = relationshipKind(facts);
  const used = new Set<string>();
  const first = facts[0];
  const second = firstDistinct(facts, used);
  remember(used, first);
  const third = firstDistinct(facts, used);
  remember(used, second);
  const last = facts.at(-1) ?? first;

  switch (beat.kind) {
    case "orientation":
    case "origin":
      return realizeObservation(first, subject, 0, plan);

    case "hook":
    case "threshold":
      if (relationship === "reversal" && second) {
        return isPlayful
          ? choose([
              `Then came ${article(detail(second))}, and the mood started to change.`,
              `${cap(detail(second))} apparently improved the negotiations.`,
              `Then ${detail(second).toLowerCase()}. That went better than expected.`,
            ], `${subject}|reversal|${beat.kind}`)
          : `Then ${detail(second).toLowerCase()}, and the mood changed.`;
      }
      return second ? realizeObservation(second, subject, 1, plan) : undefined;

    case "encounter":
    case "discovery":
    case "reveal":
      if (relationship === "mischief" && third) {
        return isPlayful
          ? playfulLens(subject, third, `${subject}|mischief|${beat.kind}`)
          : `${cap(detail(third))} became the memorable part.`;
      }
      return second ? realizeObservation(second, subject, 1, plan) : undefined;

    case "need":
    case "challenge":
      if (relationship === "reversal" && first) {
        return isPlayful
          ? `There was still one small problem: ${detail(first).toLowerCase()}.`
          : `At first, ${detail(first).toLowerCase()} was the difficult part.`;
      }
      return second ? realizeObservation(second, subject, 1, plan) : undefined;

    case "action":
    case "contribution":
      return third ? realizeObservation(third, subject, 2, plan) : second ? realizeObservation(second, subject, 1, plan) : undefined;

    case "feedback":
      if (relationship === "reversal") {
        return isPlayful
          ? choose([
              `That seemed to do the trick.`,
              `Apparently, that was all it took.`,
              `Somewhere in there, the mood had completely changed.`,
            ], `${subject}|feedback|reversal`)
          : `That was where the mood noticeably changed.`;
      }
      return third ? realizeObservation(third, subject, 2, plan) : undefined;

    case "escalation":
      if (relationship === "mischief" && third) return realizeObservation(third, subject, 2, plan);
      if (second) return realizeObservation(second, subject, 1, plan);
      return undefined;

    case "transformation": {
      const firstState = facts.find((item) => stateKind(item) !== "neutral");
      const lastState = [...facts].reverse().find((item) => stateKind(item) !== "neutral");
      if (firstState && lastState && lower(firstState) !== lower(lastState) && stateKind(firstState) !== stateKind(lastState)) {
        const before = body(firstState, subject) || firstState;
        const after = body(lastState, subject) || lastState;
        return isPlayful
          ? `${subject} went from ${lower(before)} to ${lower(after)}. Quite the turnaround.`
          : `${subject} went from ${lower(before)} to ${lower(after)}.`;
      }
      if (last !== first) return isPlayful ? `By the end, ${detail(last).toLowerCase()}.` : `By the end, ${detail(last).toLowerCase()}.`;
      return undefined;
    }

    case "reflection":
      if (relationship === "reversal") return isPlayful ? `Looking back, the turnaround was hard to miss.` : `Looking back, the change was clear.`;
      return second ? `Looking back, ${detail(second).toLowerCase()}.` : undefined;

    case "provenance":
    case "identity":
    case "milestone":
      return second ? `${cap(detail(second))} was the part that stuck.` : undefined;

    case "payoff":
      if (relationship === "mischief" && last) {
        return isPlayful
          ? choose([
              `${subject} left with ${article(detail(last))} and apparently no regrets.`,
              `By pickup, ${subject} had clearly decided the day went pretty well.`,
              `${subject} walked out like the whole thing had been their idea.`,
            ], `${subject}|mischief|payoff`)
          : `By the end, ${detail(last).toLowerCase()}.`;
      }
      if (relationship === "reversal") {
        return isPlayful
          ? choose([
              `By pickup, ${subject} was feeling pretty good about the whole arrangement.`,
              `By the end, ${subject} had apparently reconsidered the original complaint.`,
              `When pickup came, ${subject} seemed to have forgiven everybody.`,
            ], `${subject}|reversal|payoff`)
          : `By pickup, ${subject} was feeling much better about the whole thing.`;
      }
      return last ? `By the end, ${detail(last).toLowerCase()}.` : undefined;

    case "next_step":
    case "continuation":
      return isPlayful
        ? `And somehow, that felt like the beginning of another story.`
        : `And that left the door open for what came next.`;

    default:
      return realizeObservation(first, subject, 0, plan);
  }
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const text = composeBeat(beat, plan);
  if (!text) return "";
  const cleaned = sentence(text);
  return INTERNAL.test(cleaned) || DELIVERY.test(cleaned) ? "" : `${cleaned}.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  const text = clean(value);
  return !text || INTERNAL.test(text) || DELIVERY.test(text) || /\b(?:the subject|the situation|the experience|the result|the payoff|the next state)\b/i.test(text);
}

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  const text = lower([
    beat.text,
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(plan?.emotionalIntent ?? []),
  ].join(" "));

  return {
    evidence: observations(plan).length > 0,
    relationship: Boolean(plan?.premise?.relations.length),
    temporal: values(plan, "temporal").length > 0,
    social: values(plan, "social").length > 0 || values(plan, "participants").length > 0,
    transformation: values(plan, "transformation").length > 0 || (NEGATIVE_STATE.test(text) && POSITIVE_STATE.test(text)),
    constraint: values(plan, "constraint").length > 0,
    outcome: values(plan, "outcome").length > 0,
  };
}

export { inspectTransformation };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
