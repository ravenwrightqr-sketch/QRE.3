import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL TRANSFORMATION REALIZER
 *
 * Cognitive structure may speak in roles and mechanics. Customer-facing copy
 * must speak in concrete moments, visible change, personality and consequence.
 *
 * Evidence is authoritative. Creative attitude is presentation only.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const GENERIC = new Set([
  "a", "an", "the", "and", "or", "but", "with", "for", "from", "into", "over", "under",
  "about", "this", "that", "these", "those", "someone", "something", "people", "person",
  "customer", "client", "business", "company", "story", "stories", "experience", "experiences",
  "receipt", "prompt", "output", "result", "moment", "subject", "thing", "things", "place",
  "fun", "funny", "show", "shows", "new", "old", "good", "great", "ready", "home", "work",
  "service", "services", "offer", "offers", "history", "memory", "memories", "milestone",
  "milestones", "participation", "choice", "action", "event", "condition", "detail", "layer",
  "next", "step", "path", "way", "what", "happens", "happening", "progression", "meaning",
]);

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|progression|meaning context)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|deliver|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|send|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat)\w*\b/i;

function premiseValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function isGeneric(value: string): boolean {
  return GENERIC.has(lower(value)) || META.test(value);
}

function likelyName(value: string): boolean {
  return /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value) && !META.test(value);
}

function scoreSubject(value: string, index: number): number {
  let score = 0;
  if (isGeneric(value)) score -= 35;
  if (likelyName(value)) score += 20;
  if (ACTION.test(value)) score += 3;
  if (value.split(/\s+/).length <= 3) score += 3;
  if (value.length >= 4 && value.length <= 40) score += 2;
  score -= index * 0.01;
  return score;
}

/**
 * Pick the human/concrete actor before abstract delivery artifacts.
 * "receipt" must never defeat "Coco" merely because it appears earlier.
 */
function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "subject"),
    ...(beat.entities ?? []),
    clean(plan?.centralSubject),
  ]);

  const best = candidates
    .map((value, index) => ({ value, score: scoreSubject(value, index) }))
    .sort((a, b) => b.score - a.score)[0]?.value;

  return best || "the subject";
}

function clauses(value: string): string[] {
  return unique(
    sentence(value)
      .replace(/\b(?:and then|then)\b/gi, ",")
      .split(/,|;|\s+and\s+/i)
      .map((part) => part.trim())
      .map((part) => part.replace(/^(?:shows?|showing|about|that|which|what)\s+/i, ""))
      .filter((part) => part.length >= 3)
      .slice(0, 12),
  );
}

function rawEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "participants"),
    ...(beat.entities ?? []),
    beat.text,
  ]);
}

function detailCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const name = lower(subject(beat, plan));
  return unique(
    rawEvidence(beat, plan)
      .flatMap(clauses)
      .map((value) => sentence(value).replace(new RegExp(`^${name}\\s+`, "i"), "").trim())
      .filter((value) => lower(value) !== name && !META.test(value)),
  );
}

function context(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const details = detailCandidates(beat, plan);
  return details
    .map((value, index) => {
      let score = 0;
      if (ACTION.test(value)) score += 22;
      if (/\b(?:show|shows|fun|funny|story|receipt|experience|business|customer|client)\b/i.test(value)) score -= 12;
      if (value.length >= 6 && value.length <= 100) score += 5;
      score -= index * 0.01;
      return { value, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.value ?? "";
}

function concreteDetails(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return detailCandidates(beat, plan)
    .filter((value) => ACTION.test(value) || value.length > 5)
    .slice(0, 8);
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

function choose(values: string[], seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length] ?? values[0]!;
}

function afterState(plan?: CognitiveExperiencePlan): string | undefined {
  const transformation = premiseValues(plan, "transformation");
  if (transformation[1]) return sentence(transformation[1]);
  const outcome = premiseValues(plan, "outcome")[0];
  return outcome ? sentence(outcome) : undefined;
}

function opening(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  if (playful(plan)) {
    return choose([
      `${name} arrived like this was going to require a formal complaint`,
      `${name} showed up with opinions, standards, and absolutely no intention of making this easy`,
      `${name} walked in ready to see what kind of nonsense the day had planned`,
      `${name} arrived with just enough attitude to make an ordinary moment interesting`,
      `${name} showed up looking like the situation had better be worth it`,
    ], `${name}|opening|${beat.order}`);
  }
  const detail = context(beat, plan);
  return detail ? `${name} arrives with ${detail} already in motion` : `${name} arrives and the story begins`;
}

function encounter(name: string, detail: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  if (!detail) return `${name} settles in, and the experience starts moving`;
  if (playful(plan)) {
    return choose([
      `${name} met ${detail}, and the negotiations immediately got more interesting`,
      `${detail} entered the picture, and ${name} started reconsidering the situation`,
      `${name} discovered ${detail}, which turned out to be the first real plot twist`,
    ], `${name}|encounter|${beat.order}`);
  }
  return `${name} encounters ${detail}`;
}

function escalation(name: string, details: string[], beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details[0];
  if (playful(plan)) {
    if (detail) {
      return choose([
        `Then ${detail} happened, and ${name} decided to make the most of it`,
        `${name} went from merely participating to making ${detail} part of the legend`,
        `At that point, ${name} and ${detail} were clearly going to have a story of their own`,
      ], `${name}|escalation|${beat.order}`);
    }
    return choose([
      `Then ${name} found the fun part and refused to waste it`,
      `The mood escalated from ordinary to considerably more memorable`,
      `${name} took the moment and turned the volume up`,
    ], `${name}|escalation|${beat.order}`);
  }
  return detail ? `${name} goes further with ${detail}` : `${name} keeps the experience moving`;
}

function transformation(name: string, details: string[], plan?: CognitiveExperiencePlan): string {
  const explicit = premiseValues(plan, "transformation");
  if (explicit.length >= 2) {
    return `${name} moved from ${sentence(explicit[0])} to ${sentence(explicit[1])}`;
  }
  const after = afterState(plan);
  if (after) return `${name} came out the other side ${after}`;
  const detail = details.find((value) => ACTION.test(value));
  return detail
    ? `${name} was not quite the same after ${detail}`
    : `${name} came out of the experience changed in a way that could actually be felt`;
}

function payoff(name: string, details: string[], beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const after = afterState(plan);
  if (playful(plan)) {
    if (after) {
      return choose([
        `${name} left ${after}, looking like the whole experience had finally clicked`,
        `${name} walked out ${after}, with enough swagger to make the exit feel like a finale`,
        `${name} left ${after}, looking ready for whatever came next`,
      ], `${name}|payoff|${beat.order}`);
    }
    const detail = details.find((value) => ACTION.test(value));
    return detail
      ? `${name} walked out having turned ${detail} into a story worth retelling`
      : `${name} left looking like the day had upgraded them`;
  }
  return after ? `${name} reaches ${after}` : details[0] ? `${name} reaches the result shaped by ${details[0]}` : `${name} reaches the payoff`;
}

function concreteBeat(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const action = directive(beat, plan);
  const detail = context(beat, plan);
  const details = concreteDetails(beat, plan);
  const after = afterState(plan);

  switch (beat.kind) {
    case "orientation":
    case "hook":
      return opening(name, beat, plan);
    case "encounter":
      return encounter(name, detail, beat, plan);
    case "challenge":
      return action ? `${name} meets the challenge by ${action}` : detail ? `${name} has to deal with ${detail}` : undefined;
    case "action":
      return action ? `${name} ${action}` : detail ? `${name} gets into ${detail}` : undefined;
    case "contribution":
      return action ? `${name} puts that action into motion` : detail ? `${name} puts ${detail} into motion` : undefined;
    case "discovery":
      return detail ? `${name} discovers that ${detail} changes the feel of the experience` : action ? `${name} discovers what changes when ${action}` : undefined;
    case "reveal":
      return detail ? `${name} finally sees ${detail} clearly` : undefined;
    case "feedback":
      return after ? `${name} can finally see the result: ${after}` : detail ? `${name} sees what changed after ${detail}` : undefined;
    case "escalation":
      return escalation(name, details, beat, plan);
    case "transformation":
      return transformation(name, details, plan);
    case "reflection":
      return detail ? `${name} looks back at ${detail} and can see what it changed` : undefined;
    case "identity":
      return playful(plan) ? `${name} has officially become the kind of subject people remember` : detail ? `${name} becomes known through ${detail}` : undefined;
    case "milestone":
      return after ? `${name} reaches ${after}` : detail ? `${name} reaches a visible milestone through ${detail}` : undefined;
    case "unlock":
    case "earned_access":
      return detail ? `${name} earns what ${detail} makes possible` : undefined;
    case "payoff":
      return payoff(name, details, beat, plan);
    case "next_step":
      return action ? `${name} takes the next step by ${action}` : detail ? `${name} carries ${detail} into what comes next` : undefined;
    case "continuation":
      return playful(plan) ? `${name} leaves the door open for the next chapter` : detail ? `${name} carries ${detail} forward` : undefined;
    default:
      return undefined;
  }
}

export function realizeTransformationalBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;
  const evidence = unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
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
    ].slice(0, 16),
    playful: playful(plan),
    beatKind: beat.kind,
  };
}
