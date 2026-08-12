import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";
import { buildRealityModel } from "./realityModel.js";

/**
 * Experimental customer-language realizer.
 *
 * The important experiment is not a bigger vocabulary. It is a different
 * order of reasoning:
 *
 *   evidence -> relationship -> movement -> language
 *
 * There is deliberately no business/vertical/story-mode switch here.
 * Concrete facts are conserved; creative language is only a lens over them.
 */

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text[0]!.toUpperCase() + text.slice(1) : "";
};

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|trajectory|mechanic|mechanics|latent state|internal state)\b/i;
const DELIVERY = /\b(?:receipt|customer-facing|generated output|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|send pipeline)\b/i;
const PLAYFUL = /\b(?:fun|funny|playful|comedy|hilarious|absurd|ridiculous|wild|silly|whimsical|cheeky|witty|mischief|crazy|comic)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|medical|injury|legal|lawsuit|emergency|trauma|mourning|bereavement|solemn|reverent)\b/i;
const NEGATIVE = /\b(?:scared|afraid|nervous|worried|anxious|terrified|unsure|reluctant|unhappy|hated|hates|didn't want|did not want|uncomfortable|upset|mad|messy|broken|lost|stuck)\b/i;
const POSITIVE = /\b(?:enjoyed|enjoy|loved|love|happy|relaxed|excited|comfortable|calm|better|great|good|thrilled|delighted|ready|liked|beautiful|spotless|complete|finished|sunrise)\b/i;
const ACTION = /\b(?:arriv|enter|walk|went|come|came|leave|left|return|returned|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|finish|complete|celebrate|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|shake|shook|chew|chewed|tore|ate|stole|run|ran|call|called|picked up|pick up)\w*\b/i;

const ROLES: CognitivePremiseRole[] = [
  "subject", "participants", "event", "artifact", "outcome", "place", "social",
  "affordance", "temporal", "transformation", "emotion", "medium", "constraint",
];

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? [])
    .filter((value) => !META.test(value) && !DELIVERY.test(value));
}

function subject(plan: CognitiveExperiencePlan | undefined, beat?: StoryBeat): string {
  const reality = buildRealityModel(plan, plan?.premise);
  const realitySubject = reality.entities.find((entity) => entity.id === reality.subjectId)?.name;
  const candidates = unique([
    ...values(plan, "subject"),
    realitySubject,
    clean(plan?.centralSubject),
    ...(beat?.entities ?? []),
    ...values(plan, "participants"),
  ]).filter((value) => !META.test(value) && !DELIVERY.test(value));

  // Recover the first proper name from polluted upstream strings such as
  // "Coco scared coming in enjoyed" without adding domain knowledge.
  for (const candidate of candidates) {
    const name = candidate.match(/\b[A-Z][A-Za-z0-9'’-]{2,}\b/)?.[0];
    if (name && !/^(?:The|Then|And|This|That|Make|Create)$/i.test(name)) return name;
  }

  return candidates.find((value) => value.split(/\s+/).length <= 3) ?? "the subject";
}

function evidence(plan: CognitiveExperiencePlan | undefined): string[] {
  const reality = buildRealityModel(plan, plan?.premise);
  const observations = reality.observations.sort((a, b) => a.order - b.order).map((item) => item.text);
  return unique([
    ...observations,
    ...values(plan, "event"),
    ...values(plan, "outcome"),
    ...values(plan, "transformation"),
    ...values(plan, "emotion"),
  ]).filter((value) => !META.test(value) && !DELIVERY.test(value));
}

function tone(plan?: CognitiveExperiencePlan): { playful: boolean; serious: boolean } {
  const text = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.purpose ? [plan.purpose] : []),
    ...(plan?.storyStructure ?? []),
  ].join(" "));
  return { serious: SERIOUS.test(text), playful: !SERIOUS.test(text) && PLAYFUL.test(text) };
}

function detail(value: string): string {
  return sentence(value).replace(/^\s*(?:and|then|after that|next|finally)\s+/i, "").trim();
}

function body(value: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence(value).replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
}

function firstDifferent(items: string[], skip: string[] = []): string | undefined {
  const blocked = new Set(skip.map(lower));
  return items.find((item) => !blocked.has(lower(item)));
}

function state(value: string): "negative" | "positive" | "neutral" {
  if (NEGATIVE.test(value)) return "negative";
  if (POSITIVE.test(value)) return "positive";
  return "neutral";
}

function relationship(items: string[]): "reversal" | "sequence" | "contrast" {
  const kinds = items.map(state);
  if (kinds.includes("negative") && kinds.includes("positive") && kinds.indexOf("negative") < kinds.lastIndexOf("positive")) return "reversal";
  return items.length > 1 ? "sequence" : "contrast";
}

function choose<T>(items: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return items[(hash >>> 0) % items.length] ?? items[0]!;
}

function opening(name: string, first: string, playful: boolean, seed: string): string {
  const b = body(first, name);
  if (playful && NEGATIVE.test(first)) {
    return choose([
      `${name} came in looking deeply unconvinced.`,
      `${name} walked in with some serious reservations.`,
      `${name} arrived like this arrangement deserved a second opinion.`,
      `${name} showed up with questions.`,
    ], seed);
  }
  if (/^(?:came|walked|arrived|entered|went|showed up)\b/i.test(b)) return `${name} ${b.toLowerCase()}.`;
  return b ? `${name} came in ${b.toLowerCase()}.` : `${name} came in.`;
}

function middle(value: string, playful: boolean, seed: string): string {
  const d = detail(value);
  if (!d) return "Then things kept moving.";
  if (!playful) return `${cap(d)}.`;
  if (NEGATIVE.test(d)) return choose([
    `${cap(d)} was not exactly a vote of confidence.`,
    `${cap(d)} made the situation interesting.`,
    `${cap(d)} did not inspire immediate enthusiasm.`,
  ], seed);
  if (POSITIVE.test(d)) return choose([
    `Then ${d.toLowerCase()}, and the mood improved.`,
    `${cap(d)} changed the mood rather quickly.`,
    `Then came ${d.toLowerCase()}. That seemed to help.`,
  ], seed);
  if (ACTION.test(d)) return choose([
    `Then ${d.toLowerCase()}.`,
    `${cap(d)} became the next move.`,
    `From there, ${d.toLowerCase()}.`,
  ], seed);
  return `${cap(d)} became the part worth watching.`;
}

function payoff(name: string, first: string, last: string, relation: string, playful: boolean, seed: string): string {
  const lastBody = body(last, name) || detail(last);
  if (relation === "reversal" && playful) {
    return choose([
      `By the end, ${name} had apparently reconsidered the whole arrangement.`,
      `By pickup, ${name} seemed pretty pleased with the outcome.`,
      `Somewhere in there, ${name} went from skeptical to sold.`,
      `${name} left like the whole thing had been their idea.`,
    ], seed);
  }
  if (playful && lastBody) return choose([
    `By the end, ${lastBody.toLowerCase()}.`,
    `And there it was: ${lastBody.toLowerCase()}.`,
    `That was the part worth remembering: ${lastBody.toLowerCase()}.`,
  ], seed);
  if (lastBody) return `By the end, ${lastBody.toLowerCase()}.`;
  return `By the end, ${name} had reached the other side of it.`;
}

/**
 * Produces a compact playout from the same universal evidence regardless of
 * domain. It is intentionally a lab, not yet the canonical language authority.
 */
export function realizeUniversalExperience(plan?: CognitiveExperiencePlan, beats: StoryBeat[] = []): string[] {
  if (!plan?.premise) return [];
  const facts = evidence(plan);
  if (!facts.length) return [];

  const name = subject(plan, beats[0]);
  const { playful, serious } = tone(plan);
  const usePlayful = playful && !serious;
  const relation = relationship(facts);
  const first = facts[0]!;
  const second = firstDifferent(facts, [first]) ?? first;
  const third = firstDifferent(facts, [first, second]) ?? second;
  const last = facts.at(-1) ?? third;

  const lines: string[] = [
    opening(name, first, usePlayful, `${name}|opening|${first}`),
  ];

  if (facts.length > 1) lines.push(middle(second, usePlayful, `${name}|middle|${second}`));
  if (facts.length > 2 && lower(third) !== lower(second)) lines.push(middle(third, usePlayful, `${name}|middle2|${third}`));

  if (relation === "reversal") {
    const negative = facts.find((item) => state(item) === "negative");
    const positive = [...facts].reverse().find((item) => state(item) === "positive");
    if (negative && positive) {
      const before = body(negative, name) || detail(negative);
      const after = body(positive, name) || detail(positive);
      lines.push(usePlayful
        ? `${name} went from ${lower(before)} to ${lower(after)}. Quite the turnaround.`
        : `${name} went from ${lower(before)} to ${lower(after)}.`);
    }
  }

  lines.push(payoff(name, first, last, relation, usePlayful, `${name}|payoff|${last}`));

  if (plan.futureEvolution?.length || plan.memoryModel?.length) {
    lines.push(usePlayful
      ? "And that left the door open for whatever gets added next."
      : "And that left the story open for what comes next.");
  }

  return unique(lines).map((line) => `${sentence(line)}.`).filter((line) => !META.test(line) && !DELIVERY.test(line));
}
