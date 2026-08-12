import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL TRANSFORMATION REALIZER
 *
 * The creative language boundary now optimizes for state change instead of
 * explaining compiler state. It consumes the evidence and mechanics that
 * cognition already selected and realizes:
 *
 *   BEFORE -> PRESSURE -> TURN -> AFTER -> IDENTITY / EXIT
 *
 * Presentation invention is allowed where the plan is playful/creative, but
 * invented attitude is never durable fact. The mature premise realizer remains
 * the conservative fallback when evidence is too thin.
 */

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The subject";
};
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const COMMON = new Set([
  "a", "an", "the", "and", "or", "but", "with", "for", "from", "into", "over", "under",
  "about", "this", "that", "these", "those", "someone", "something", "people", "person",
  "customer", "client", "business", "company", "story", "experience", "fun", "funny", "dog",
  "grooming", "groomer", "house", "home", "work", "service", "services", "thing", "things",
  "place", "time", "day", "night", "shows", "show", "gets", "get", "getting", "being",
  "ready", "great", "good", "new", "old", "living", "room", "kitchen", "offer", "offers",
  "history", "milestone", "milestones", "memory", "memories", "customers", "experience", "experiences",
]);

const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat)\b/i;

function premiseValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function capitalizedNames(text: string): string[] {
  const result: string[] = [];
  const re = /\b([A-Z][A-Za-z0-9'’-]{2,}(?:\s+[A-Z][A-Za-z0-9'’-]{2,}){0,2})\b/g;
  for (const match of text.matchAll(re)) {
    const value = clean(match[1]);
    const index = match.index ?? 0;
    const before = text.slice(0, index);
    if (!before || /[.!?]\s*$/.test(before)) continue;
    if (COMMON.has(lower(value))) continue;
    result.push(value);
  }
  return unique(result);
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const names = capitalizedNames(beat.text);
  if (names[0]) return names[0];

  const candidates = unique([
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "subject"),
    ...(beat.entities ?? []),
    clean(plan?.centralSubject),
  ]);

  const scored = candidates.map((value) => {
    const normalized = lower(value);
    let score = 0;
    if (!COMMON.has(normalized)) score += 6;
    if (value.split(/\s+/).length <= 2) score += 3;
    if (/business|company|customer|client|service|story|experience/i.test(value)) score -= 8;
    return { value, score };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.value ?? "the subject";
}

function clauses(value: string): string[] {
  return unique(
    sentence(value)
      .replace(/\b(?:and then|then)\b/gi, ",")
      .split(/,|;|\s+and\s+/i)
      .map((part) => part.trim())
      .map((part) => part.replace(/^(?:shows?|showing|about|that|which)\s+/i, ""))
      .filter((part) => part.length >= 3)
      .slice(0, 10),
  );
}

function detailCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const values = unique([
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
    beat.text,
  ]);

  const name = lower(subject(beat, plan));
  const details = values.flatMap(clauses).map((value) =>
    sentence(value)
      .replace(new RegExp(`^${name}\\s+`, "i"), "")
      .replace(/^being\s+/i, "")
      .replace(/^and\s+/i, "")
      .replace(/^shows?\s+/i, "")
      .trim(),
  );

  return unique(details).filter((value) => lower(value) !== name);
}

function context(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const details = detailCandidates(beat, plan);
  return details.find((value) => /\b(?:arriv|groom|clean|fix|repair|cook|bake|build|open|close|visit|travel|show|look|ready|home|finish|complete|serve|share|add|play|choose|select|discover|find|remember|celebrat|return|deliver|prepare|inspect|test|check|wash|paint|write|create|design)\w*\b/i.test(value))
    ?? details[0]
    ?? "";
}

function directive(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return sentence(plan?.realization?.directives.find((item) => item.kind === beat.kind)?.action);
}

function signalText(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.affordances ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.realization?.semanticArc ?? []),
    ...(plan?.realization?.directives.flatMap((item) => [item.action, item.intent, item.stateBefore, item.stateAfter]) ?? []),
  ].join(" "));
}

function playful(plan?: CognitiveExperiencePlan): boolean {
  const signal = signalText(plan);
  return !SERIOUS.test(signal) && PLAYFUL.test(signal);
}

function choose(values: string[], seed: string): string | undefined {
  if (!values.length) return undefined;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length];
}

function afterState(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const explicit = premiseValues(plan, "transformation");
  if (explicit[1]) return sentence(explicit[1]);

  const outcome = premiseValues(plan, "outcome")[0];
  if (outcome) return sentence(outcome);

  const details = detailCandidates(beat, plan);
  const last = details.at(-1);
  if (!last) return undefined;
  return sentence(last);
}

function playfulOpening(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan)) return undefined;
  return choose([
    `${name} arrived like this was going to require a formal complaint`,
    `${name} showed up with the confidence of someone who already had a plan`,
    `${name} entered with just enough attitude to make the moment interesting`,
    `${name} arrived looking like the day had better have something good in it`,
    `${name} showed up ready to make an ordinary moment considerably less ordinary`,
  ], `${name}|opening|${beat.kind}|${beat.order}`);
}

function playfulEncounter(name: string, detail: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan)) return undefined;
  return choose(detail ? [
    `${name} took ${detail} in stride, which was probably the first sign that things were about to get interesting`,
    `${detail} changed the mood, and ${name} was suddenly much more invested in the proceedings`,
    `${name} encountered ${detail}, and somehow that became the turning point`,
  ] : [
    `${name} found a little room to relax, and the mood finally started behaving itself`,
    `${name} settled in, and the experience stopped feeling quite so serious`,
    `${name} found a little room for mischief, and took it`,
  ], `${name}|encounter|${beat.order}`);
}

function playfulEscalation(name: string, detail: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan)) return undefined;
  return choose(detail ? [
    `Then ${detail} entered the story, and ${name} decided to make the most of it`,
    `${name} went from merely participating to making ${detail} part of the legend`,
    `At that point, ${name} and ${detail} were clearly going to have a story of their own`,
  ] : [
    `Then ${name} found the fun part and refused to waste it`,
    `The mood escalated from ordinary to considerably more memorable`,
    `${name} took the moment and turned the volume up`,
  ], `${name}|escalation|${beat.order}`);
}

function playfulExit(name: string, after: string | undefined, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan)) return undefined;
  if (after) {
    return choose([
      `${name} left ${after}, with enough swagger to make the exit feel like a finale`,
      `${name} walked out ${after}, looking like the experience had finally clicked into place`,
      `${name} left ${after}, looking like there were plans to be made and absolutely no reason to be modest about them`,
    ], `${name}|exit|${beat.order}`);
  }
  return choose([
    `${name} left looking like the day had upgraded them`,
    `${name} walked out with the kind of energy that makes an ordinary exit feel like a finale`,
    `${name} left looking fierce enough to make the next chapter jealous`,
  ], `${name}|exit|${beat.order}`);
}

function concreteBeat(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const action = directive(beat, plan);
  const detail = context(beat, plan);
  const after = afterState(beat, plan);
  const isPlayful = playful(plan);
  const explicitTransformation = premiseValues(plan, "transformation");

  switch (beat.kind) {
    case "orientation":
      if (isPlayful) return playfulOpening(name, beat, plan);
      if (detail) return `${name} enters with ${detail} already in view`;
      if (action) return `${name} begins by ${action}`;
      return `${name} enters the experience`;

    case "hook":
      return isPlayful ? playfulOpening(name, beat, plan) : detail ? `${name} notices ${detail}, and the experience starts moving` : undefined;

    case "encounter":
      return playfulEncounter(name, detail, beat, plan) ?? (action ? `${name} encounters the next condition when ${action}` : detail ? `${name} encounters ${detail}` : undefined);

    case "challenge":
      return action ? `${name} meets the challenge by ${action}` : detail ? `${name} has to deal with ${detail}` : undefined;

    case "action":
      return action ? `${name} ${action}` : detail ? `${name} acts on ${detail}` : undefined;

    case "contribution":
      return action ? `${name} adds ${action} to the moment` : detail ? `${name} adds ${detail} to what is happening` : undefined;

    case "discovery":
      return action ? `${name} discovers what changes when ${action}` : detail ? `${name} discovers another layer in ${detail}` : undefined;

    case "reveal":
      return detail ? `${name} finally sees ${detail} clearly` : undefined;

    case "feedback":
      return after ? `${name} can see the result: ${after}` : detail ? `${name} sees what changed after ${detail}` : undefined;

    case "escalation":
      return playfulEscalation(name, detail, beat, plan) ?? (detail ? `${name} goes further with ${detail}` : undefined);

    case "transformation":
      if (explicitTransformation.length >= 2) return `${name} moves from ${sentence(explicitTransformation[0])} to ${sentence(explicitTransformation[1])}`;
      return playfulExit(name, after, beat, plan) ?? (after ? `${name} is visibly different after ${after}` : detail ? `${name} is visibly different after ${detail}` : undefined);

    case "reflection":
      return detail ? `${name} looks back at ${detail} and sees what it changed` : undefined;

    case "identity":
      return isPlayful ? `${name} has officially become the kind of subject people remember` : detail ? `${name} becomes identifiable through ${detail}` : undefined;

    case "milestone":
      return after ? `${name} reaches ${after}` : detail ? `${name} reaches the next milestone through ${detail}` : undefined;

    case "unlock":
    case "earned_access":
      return detail ? `${name} earns access to what ${detail} makes possible` : undefined;

    case "payoff":
      return playfulExit(name, after, beat, plan) ?? (after ? `${name} reaches ${after}` : detail ? `${name} reaches a result shaped by ${detail}` : undefined);

    case "next_step":
      return action ? `${name} takes the next step: ${action}` : detail ? `${name} carries ${detail} into what comes next` : undefined;

    case "continuation":
      return isPlayful ? `${name} leaves the door open for the next chapter` : detail ? `${name} carries ${detail} forward` : undefined;

    default:
      return undefined;
  }
}

export function realizeTransformationalBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!plan?.premise) return undefined;
  const evidence = unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "transformation"),
    ...(beat.entities ?? []),
    beat.text,
  ]);
  if (!evidence.length) return undefined;

  const text = concreteBeat(subject(beat, plan), beat, plan);
  return text ? `${sentence(text)}.` : undefined;
}

export function inspectTransformation(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const explicit = premiseValues(plan, "transformation");
  return {
    subject: subject(beat, plan),
    before: explicit[0],
    after: explicit[1] ?? premiseValues(plan, "outcome")[0] ?? detailCandidates(beat, plan).at(-1),
    evidence: [
      ...premiseValues(plan, "event"),
      ...premiseValues(plan, "artifact"),
      ...premiseValues(plan, "outcome"),
      ...detailCandidates(beat, plan),
    ].slice(0, 12),
    playful: playful(plan),
    beatKind: beat.kind,
  };
}
