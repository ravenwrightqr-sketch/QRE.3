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
 * The realizer does not turn labels into sentences. It first discovers the
 * latent movie contained in the evidence:
 *
 *   evidence -> subject -> sequence -> relationship -> story shape -> prose
 *
 * Facts remain factual. Interpretation may describe the relationship between
 * facts, but it may not invent a new physical event, person, object, place,
 * measurement, or outcome.
 */

const ROLES: CognitivePremiseRole[] = [
  "subject", "participants", "event", "artifact", "outcome", "place",
  "social", "affordance", "temporal", "transformation", "emotion",
  "medium", "constraint",
];

const INTERNAL = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue|new memories can change what later visitors discover)\b/i;
const DELIVERY = /\b(?:customer-facing|generated output|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline)\b/i;
const SERIOUS = /\b(?:respectful|serious|memorial|funeral|grief|death|died|medical|injury|legal|lawsuit|emergency|trauma|mourning|bereavement)\b/i;
const PLAYFUL = /\b(?:fun|funny|playful|comedy|hilarious|absurd|ridiculous|wild|silly|whimsical|cheeky|witty|mischief|crazy|goblin|lawyer|owned the place)\b/i;
const DARK = /\b(?:horror|horrifying|horrific|creepy|terrifying|terror|haunted|sinister|demented|disturbing|dark|nightmare|ominous|evil|cursed)\b/i;
const NEGATIVE = /\b(?:scared|afraid|nervous|worried|anxious|terrified|unsure|reluctant|unhappy|hated|hates|didn't want|did not want|not thrilled|uncomfortable|upset|mad|mess|broken|lost|missed|failed|late)\b/i;
const POSITIVE = /\b(?:enjoyed|enjoy|loved|love|happy|relaxed|excited|comfortable|calm|better|great|good|thrilled|delighted|ready|liked|won|spotless|finished|complete|arrived|sunset)\b/i;
const CARE = /\b(?:bath|bubbles?|rub|rubs|foot rubs?|massage|groom|grooming|pamper|pampering|wash|washed|brush|brushed|dry|dried|trim|trimmed|clean|cleaned|care)\b/i;
const MISCHIEF = /\b(?:chew|chewed|ate|eaten|tore|torn|shook|shaken|destroyed|stole|stolen|ran off|ran around|stole a bow|call(?:ed)? (?:her|his|their) lawyer)\b/i;

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text[0]!.toUpperCase() + text.slice(1) : "";
};

function safe(value: unknown): boolean {
  const text = clean(value);
  return Boolean(text) && !INTERNAL.test(text) && !DELIVERY.test(text);
}

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots
    .filter((slot) => slot.role === role)
    .flatMap((slot) => slot.values)
    .filter(safe) ?? []);
}

/** Preserve the cognitive premise's evidence order. Do not alphabetize it. */
function evidence(plan?: CognitiveExperiencePlan): string[] {
  const reality = buildRealityModel(plan, plan?.premise);
  const observed = reality.observations
    .sort((a, b) => a.order - b.order)
    .map((item) => sentence(item.text))
    .filter(safe);

  const roleEvidence = [
    ...values(plan, "event"),
    ...values(plan, "outcome"),
    ...values(plan, "transformation"),
    ...values(plan, "temporal"),
    ...values(plan, "place"),
  ];

  const allSlots = plan?.premise?.slots
    .slice()
    .sort((a, b) => (a.values[0] ?? "").localeCompare(b.values[0] ?? ""))
    .flatMap((slot) => slot.values)
    .filter(safe) ?? [];

  return unique([...observed, ...roleEvidence, ...allSlots]);
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

  return proper[0] ?? candidates.find((value) => value.split(/\s+/).length <= 4) ?? "the moment";
}

function toneText(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.storyStructure ?? []),
    plan?.purpose ?? "",
    plan?.direction ?? "",
  ].join(" "));
}

function lens(plan?: CognitiveExperiencePlan): "serious" | "dark" | "playful" | "cinematic" {
  const text = toneText(plan);
  if (SERIOUS.test(text)) return "serious";
  if (DARK.test(text)) return "dark";
  if (PLAYFUL.test(text)) return "playful";
  return "cinematic";
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

function body(text: string, subject: string): string {
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence(text).replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
}

function stateKind(text: string): "negative" | "positive" | "neutral" {
  if (NEGATIVE.test(text)) return "negative";
  if (POSITIVE.test(text)) return "positive";
  return "neutral";
}

type MovieShape = "reversal" | "mischief" | "transformation" | "journey" | "accumulation" | "ceremony" | "sequence" | "single";

function movieShape(facts: string[], plan?: CognitiveExperiencePlan): MovieShape {
  const text = lower(facts.join(" ") + " " + toneText(plan));
  const states = facts.map(stateKind);
  if (states.includes("negative") && states.includes("positive") && states.indexOf("negative") < states.lastIndexOf("positive")) return "reversal";
  if (facts.some((x) => MISCHIEF.test(x))) return "mischief";
  if (/\b(?:beach|surfboard|travel|trip|journey|road trip|visited|visits|rave|raves|tour|touring|every|all the)\b/.test(text)) return "journey";
  if (/\b(?:wedding|ceremony|birthday|anniversary|memorial|funeral)\b/.test(text)) return "ceremony";
  if (/\b(?:memory|memories|history|timeline|keep adding|forever|legacy|family)\b/.test(text)) return "accumulation";
  if (facts.some((x) => CARE.test(x)) && facts.length > 1) return "transformation";
  if (facts.length > 1) return "sequence";
  return "single";
}

function explicitDirection(plan?: CognitiveExperiencePlan): string {
  return lower(plan?.direction ?? "");
}

/**
 * The latent movie is deliberately tiny. It is an internal reasoning object,
 * not another contract. It gives the language layer something coherent to
 * write from instead of forcing every beat to describe the same subject.
 */
type LatentMovie = {
  subject: string;
  facts: string[];
  shape: MovieShape;
  lens: "serious" | "dark" | "playful" | "cinematic";
  first?: string;
  middle?: string;
  last?: string;
  before?: string;
  after?: string;
};

function discoverMovie(plan?: CognitiveExperiencePlan, beat?: StoryBeat): LatentMovie {
  const subject = subjectOf(plan, beat);
  const facts = evidence(plan);
  const shape = movieShape(facts, plan);
  const states = facts.filter((fact) => stateKind(fact) !== "neutral");
  const before = states.find((fact) => stateKind(fact) === "negative");
  const after = [...states].reverse().find((fact) => stateKind(fact) === "positive");

  return {
    subject,
    facts,
    shape,
    lens: lens(plan),
    first: facts[0],
    middle: facts[Math.min(1, Math.max(0, facts.length - 1))],
    last: facts.at(-1),
    before,
    after,
  };
}

function phraseFact(fact: string, subject: string): string {
  const value = sentence(fact);
  const b = body(value, subject);
  return b || value;
}

function opening(movie: LatentMovie): string {
  const { subject, first, lens: voice } = movie;
  if (!first) {
    if (voice === "playful") return `${subject} had a story waiting to happen`;
    if (voice === "dark") return `${subject} entered a story that would be remembered`;
    return `${subject} became part of a story worth remembering`;
  }
  const fact = phraseFact(first, subject);
  if (voice === "playful") {
    if (NEGATIVE.test(first)) return choose([
      `${subject} arrived with some serious reservations`,
      `${subject} came in looking deeply unconvinced by the arrangement`,
      `${subject} entered the scene with opinions`,
    ], `${subject}|open|${first}`);
    return `${cap(fact)}`;
  }
  if (voice === "dark") return `${subject} entered the scene. ${cap(fact)}`;
  return `${subject} arrived. ${cap(fact)}`;
}

function middle(movie: LatentMovie): string | undefined {
  const { subject, middle: fact, shape, lens: voice } = movie;
  if (!fact) return undefined;
  const f = phraseFact(fact, subject);

  if (shape === "reversal") {
    return voice === "playful"
      ? choose([
          `${cap(f)}. Somehow, that changed the negotiations`,
          `Then came ${f.toLowerCase()}. The mood was moving in a different direction`,
          `${cap(f)}. That seemed to help`,
        ], `${subject}|reversal|${fact}`)
      : `Then ${f.toLowerCase()}, and the mood changed`;
  }

  if (shape === "mischief") {
    return voice === "playful"
      ? choose([
          `${cap(f)}. That was going to be remembered`,
          `Then ${f.toLowerCase()}. So much for keeping things orderly`,
          `${cap(f)} became the part nobody was going to forget`,
        ], `${subject}|mischief|${fact}`)
      : `Then ${f.toLowerCase()}.`;
  }

  if (voice === "dark") return `Then ${f.toLowerCase()}.`;
  return `${cap(f)}.`;
}

function payoff(movie: LatentMovie): string | undefined {
  const { subject, last, shape, lens: voice, before, after } = movie;
  if (!last) return undefined;

  if (shape === "reversal" && before && after) {
    const beforeText = phraseFact(before, subject).toLowerCase();
    const afterText = phraseFact(after, subject).toLowerCase();
    if (voice === "playful") return `${subject} went from ${beforeText} to ${afterText}. Quite the turnaround`;
    return `${subject} went from ${beforeText} to ${afterText}.`;
  }

  const f = phraseFact(last, subject);
  if (shape === "mischief" && voice === "playful") {
    return choose([
      `${subject} left with ${article(f)} and apparently no regrets`,
      `${cap(f)}. A fitting way to end the story`,
      `${subject} walked out like the whole thing had been their idea`,
    ], `${subject}|payoff|${last}`);
  }

  if (shape === "journey") {
    return voice === "playful"
      ? `${cap(f)}. Another chapter for ${subject}`
      : `${cap(f)}. Another chapter in ${subject}'s story`;
  }

  if (shape === "accumulation") {
    return voice === "playful"
      ? `${cap(f)}. And now it belongs to the collection` 
      : `${cap(f)}. Another memory added to the story`;
  }

  if (shape === "ceremony") return `${cap(f)}. This is the part that gets kept`;
  return `By the end, ${f.toLowerCase()}.`;
}

function continuation(movie: LatentMovie): string {
  if (movie.shape === "accumulation" || movie.shape === "journey") {
    return movie.lens === "playful"
      ? `And that is exactly how ${movie.subject}'s story keeps getting bigger`
      : `And the story is still open for what comes next`;
  }
  return movie.lens === "playful"
    ? `And somehow, that became a story worth telling again`
    : `And that became part of the story`;
}

function composeBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const movie = discoverMovie(plan, beat);
  if (!movie.facts.length) {
    const direction = explicitDirection(plan);
    const subject = movie.subject;
    if (beat.kind === "orientation" || beat.kind === "identity" || beat.kind === "origin") {
      if (direction === "memory") return `${subject} is becoming a memory worth keeping`;
      if (direction === "journey") return `${subject} is becoming a record of where the story has been`;
      return `${subject} is the doorway into the story`;
    }
    if (beat.kind === "continuation") return continuation(movie);
    if (beat.kind === "payoff") return `${subject} is now part of a story that can keep evolving`;
    return undefined;
  }

  switch (beat.kind) {
    case "orientation":
    case "origin":
    case "identity":
      return opening(movie);
    case "hook":
    case "threshold":
    case "encounter":
    case "discovery":
    case "reveal":
    case "action":
    case "contribution":
    case "challenge":
    case "need":
    case "feedback":
    case "escalation":
      return middle(movie);
    case "transformation":
    case "reflection":
    case "provenance":
    case "milestone":
    case "payoff":
      return payoff(movie);
    case "next_step":
    case "continuation":
      return continuation(movie);
    default:
      return opening(movie);
  }
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const text = composeBeat(beat, plan);
  if (!text) return "";
  const cleaned = sentence(text);
  return INTERNAL.test(cleaned) || DELIVERY.test(cleaned) ? "" : `${cleaned}.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  const realized = beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));

  // A beat is not allowed to become a duplicate sentence merely because the
  // selected narrative structure has more beats than the available evidence.
  const seen = new Set<string>();
  return realized.map((beat) => {
    const key = lower(beat.text);
    if (!key) return beat;
    if (seen.has(key)) return { ...beat, text: "" };
    seen.add(key);
    return beat;
  });
}

export function isGenericCompilerProse(value: string): boolean {
  const text = clean(value);
  return !text || INTERNAL.test(text) || DELIVERY.test(text) || /\b(?:the subject|the situation|the experience|the result|the payoff|the next state)\b/i.test(text);
}

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  const facts = evidence(plan);
  const text = lower([
    beat.text,
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(plan?.emotionalIntent ?? []),
  ].join(" "));

  return {
    evidence: facts.length > 0,
    relationship: Boolean(plan?.premise?.relations.length) || movieShape(facts, plan) !== "single",
    temporal: values(plan, "temporal").length > 0,
    social: values(plan, "social").length > 0 || values(plan, "participants").length > 0,
    transformation: values(plan, "transformation").length > 0 || (NEGATIVE.test(text) && POSITIVE.test(text)),
    constraint: values(plan, "constraint").length > 0,
    outcome: values(plan, "outcome").length > 0,
  };
}

export { inspectTransformation };
