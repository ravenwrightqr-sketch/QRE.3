import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * UNIVERSAL TRANSFORMATION REALIZER
 *
 * FINAL SENTENCE AUTHORITY
 *
 * Cognition decides what kind of experience is happening.
 * This layer decides how that experience is said to a human.
 *
 * Evidence authority:
 *   observed concrete evidence > derived concrete evidence > creative framing
 *   semantic state/directive scaffolding is never factual evidence.
 */

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const cap = (value: string): string => { const text = sentence(value); return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""; };
const lowerSentence = (value: string): string => sentence(value).toLowerCase();
const article = (value: string): string => { const text = sentence(value).toLowerCase(); if (!text) return ""; if (/^(?:the|a|an)\b/i.test(text)) return text; return /^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`; };

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics)\b/i;

// Delivery mechanics are excluded only when they are acting as instructions,
// not when they are themselves meaningful concrete artifacts in the prompt.
const DELIVERY_INSTRUCTION = /\b(?:receipt|prompt|output|customer-facing|customer|client|audience|user|users|send|sending|deliver|delivery|message|text message)\b/i;

const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted|crazy|cheeky|witty|comic)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|deliver|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted|shake|shook|chew|chewed|run|ran|call|called)\w*\b/i;
const ABSTRACTION = /\b(?:situation|circumstance|experience|process|journey|moment|thing|things|result|outcome|meaning|change|transformation|progress|development|interaction|dynamic|behavior|behaviour|possibility|potential|future|memory|memories|discovery)\b/i;

const GENERIC_WORDS = new Set([
  "the","a","an","and","or","but","for","with","about","from","into","this","that","then","there","here","moment","situation","thing","things","story","experience","result","outcome","part","way","time","one","something","everything","nothing","really","very","just","got","getting","looked","looking","started","happened","made","make","create","created","creating","change","changed","changing","ready",
]);

function premiseValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots.filter(slot => slot.role === role).flatMap(slot => slot.values) ?? []);
}

function stripDeliveryTail(value: string): string {
  return clean(value
    .replace(/\b(?:to|for)\s+(?:send|sending|share|deliver|give)\b.*$/i, "")
    .replace(/\b(?:to|for)\s+(?:the|a|an)?\s*(?:client|customer|user|audience|business)\b.*$/i, "")
    .replace(/\b(?:story|receipt|message|text)\s+(?:about|for)\b.*$/i, "")
    .replace(/\bnew memories can change what later visitors discover\b.*$/i, ""));
}

function usable(value: string): boolean {
  const text = clean(value);
  return Boolean(text) && !META.test(text);
}

function concrete(value: string): boolean {
  const text = clean(value);
  if (!usable(text)) return false;
  const words = text.toLowerCase().split(/[^a-z0-9'’-]+/).filter(Boolean);
  return words.some(word => !GENERIC_WORDS.has(word) && word.length > 2);
}

function observedCandidate(value: string): boolean {
  return concrete(value) && !DELIVERY_INSTRUCTION.test(value);
}

/**
 * The premise's subject slot is authoritative for the story subject.
 * Participants/social values are NEVER promoted to the subject position.
 * This prevents prompts such as "a treasure hunt for kids" from becoming a
 * story about "kids" simply because kids are the audience.
 */
function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    ...premiseValues(plan, "subject"),
    clean(plan?.centralSubject),
    ...(beat.entities ?? []),
    beat.directive?.subject,
  ]).map(stripDeliveryTail).filter(usable);

  const named = candidates.find(value => /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value) && !ACTION.test(value));
  if (named) return named;

  const concreteSubject = candidates.find(value =>
    !ABSTRACTION.test(value) && observedCandidate(value) && !ACTION.test(value),
  );
  return concreteSubject ?? "the subject";
}

function rawEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "transformation"),
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "temporal"),
    ...(beat.entities ?? []),
  ])
    .map(stripDeliveryTail)
    .filter(usable);
}

function detailScore(value: string, plan?: CognitiveExperiencePlan): number {
  const text = lower(value);
  if (!text || !concrete(value) || ABSTRACTION.test(text)) return -100;
  const words = text.split(/\s+/).filter(Boolean);
  let score = Math.min(10, words.length * 2);
  if (/\d|\b(?:red|blue|black|white|gold|silver|tiny|giant|old|new|little|big|long|short|warm|cold|bright|dark|soft|clean|fresh|shiny|messy|wild|luxury|spa|concert|birthday|wedding|recipe|watch|truck|surfboard|guitar|robot|museum|gas station|aliens?)\b/i.test(value)) score += 6;
  if (ACTION.test(value)) score += 4;
  if (plan && premiseValues(plan, "artifact").some(v => lower(v) === text)) score += 4;
  if (plan && premiseValues(plan, "event").some(v => lower(v) === text)) score += 5;
  return score;
}

function details(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique(rawEvidence(beat, plan))
    .filter(concrete)
    .sort((a,b) => detailScore(b, plan) - detailScore(a, plan) || b.length - a.length);
}

function actions(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...premiseValues(plan, "event"),
    beat.directive?.action ?? "",
    ...(beat.entities ?? []),
  ]).filter(value => concrete(value) && ACTION.test(value));
}

function outcome(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  return unique([
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "transformation"),
  ]).filter(value => concrete(value)).find(Boolean);
}

function playful(plan?: CognitiveExperiencePlan): boolean {
  const signal = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    plan?.purpose ?? "",
  ].join(" "));
  return !SERIOUS.test(signal) && PLAYFUL.test(signal);
}

function choose<T>(values: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length] ?? values[0]!;
}

type ComedyMove = "formal" | "reaction" | "authority" | "status" | "deadpan" | "understatement";
function comedyMove(beat: StoryBeat): ComedyMove {
  return choose(["formal","reaction","authority","status","deadpan","understatement"], `${beat.id}|${beat.order}|move`);
}

function flourish(subjectName: string, detail: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan) || !detail || SERIOUS.test(detail)) return undefined;
  const d = article(detail);
  switch (comedyMove(beat)) {
    case "formal": return `${subjectName} treated ${d} like it deserved a formal review.`;
    case "reaction": return `${subjectName} had opinions about ${d}.`;
    case "authority": return `${subjectName} appeared ready to take charge of ${d}.`;
    case "status": return `${cap(d)} quietly became the main event.`;
    case "deadpan": return `Then there was ${d}. Naturally, it mattered.`;
    default: return `${cap(d)} made things a little more interesting.`;
  }
}

function actionLine(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const action = actions(beat, plan)[0];
  const detail = details(beat, plan)[0];
  if (action) return cap(action);
  if (detail) return `${cap(detail)} got its turn.`;
  return "Things kept moving.";
}

function opening(subjectName: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  if (playful(plan)) return choose([
    `${subjectName} walked in looking like this deserved a formal review.`,
    `${subjectName} arrived with opinions.`,
    `${subjectName} showed up looking suspiciously unconvinced.`,
  ], `${subjectName}|opening|${beat.id}`);
  return `${subjectName} arrived, and things got underway.`;
}

function transformationLine(subjectName: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const transforms = premiseValues(plan, "transformation").filter(concrete);
  if (transforms.length >= 2) {
    return `${subjectName} went from ${lowerSentence(transforms[0])} to ${lowerSentence(transforms[1])}.`;
  }
  const result = outcome(beat, plan);
  if (result) return playful(plan) ? `By the end, ${lowerSentence(result)}.` : `By the end, ${sentence(result)}.`;
  const action = actions(beat, plan)[0];
  if (action) return `By the end, ${lowerSentence(action)} had changed the picture.`;
  const detail = details(beat, plan)[0];
  return detail ? `By the end, ${subjectName} had something new to show for it: ${lowerSentence(detail)}.` : `${subjectName} was not quite the same as when this started.`;
}

function realizeBeat(subjectName: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const detailBank = details(beat, plan);
  const detail = detailBank[0];
  const secondary = detailBank.find(v => v.toLowerCase() !== detail?.toLowerCase());
  const action = actions(beat, plan)[0];
  const result = outcome(beat, plan);
  switch (beat.kind) {
    case "orientation": return opening(subjectName, beat, plan);
    case "hook": return detail ? (flourish(subjectName, detail, beat, plan) ?? `Then came ${article(detail)}.`) : `The real work began.`;
    case "need": return detail ? `There was something worth dealing with: ${article(detail)}.` : `There was work to do.`;
    case "threshold": return detail ? `Then came ${article(detail)}.` : `The next part began.`;
    case "origin": return action ? `It started with ${lowerSentence(action)}.` : detail ? `It started with ${article(detail)}.` : `That was where it began.`;
    case "encounter": return detail ? (flourish(subjectName, detail, beat, plan) ?? `Then came ${article(detail)}.`) : action ? cap(action) : `The day moved on.`;
    case "challenge": return detail ? (playful(plan) ? `${cap(article(detail))} had other ideas.` : `${cap(article(detail))} had to be dealt with.`) : `That was the part that needed handling.`;
    case "discovery": return detail ? (playful(plan) ? choose([`And there it was: ${article(detail)}.`,`That was when ${article(detail)} finally got the attention it deserved.`], `${subjectName}|discovery|${beat.id}`) : `And there it was: ${article(detail)}.`) : `A new detail came into focus.`;
    case "reveal": return result ? `And there it was: ${lowerSentence(result)}.` : detail ? `And there it was: ${article(detail)}.` : `The result finally came into view.`;
    case "instruction": return action ? `The next move was ${sentence(action).toLowerCase()}.` : detail ? `The next move involved ${article(detail)}.` : `The next move became clear.`;
    case "action": return actionLine(beat, plan);
    case "feedback": return playful(plan) ? `${subjectName} had clearly reached an opinion.` : detail ? `${cap(article(detail))} showed the difference.` : `The difference started to show.`;
    case "contribution": return detail ? `${cap(article(detail))} became part of what followed.` : `Another piece fell into place.`;
    case "escalation":
      if (detail && secondary && playful(plan)) return `${cap(article(detail))} helped. ${cap(article(secondary))} helped more.`;
      return detail ? `${cap(article(detail))} moved things forward.` : `Then things went a little further.`;
    case "transformation": return transformationLine(subjectName, beat, plan);
    case "reflection": return detail ? `Looking back, ${article(detail)} was the giveaway.` : `Looking back, the difference was clear.`;
    case "provenance": return detail ? `${cap(article(detail))} was part of what made this one memorable.` : `The story stayed connected to what came before.`;
    case "identity": return result ? `${subjectName} now carried ${article(result)}.` : `${subjectName} had become something different.`;
    case "milestone": return result ? `That marked the change: ${sentence(result).toLowerCase()}.` : detail ? `${cap(article(detail))} marked the change.` : `That marked the change.`;
    case "payoff":
      if (result) return playful(plan) ? choose([`And there it was: ${lowerSentence(result)}.`,`By then, ${lowerSentence(result)}.`], `${subjectName}|payoff|${beat.id}`) : `The result was clear: ${sentence(result)}.`;
      if (playful(plan) && detail) return `By the time it was over, ${lowerSentence(detail)}.`;
      return detail ? `By the time it was over, ${lowerSentence(detail)}.` : `By the time it was over, the result spoke for itself.`;
    case "next_step": return detail ? `From there, ${article(detail)} was next.` : `From there, the next move was clear.`;
    case "continuation": return `And that left the door open for whatever came next.`;
    case "unlock":
    case "earned_access": return detail ? `That opened the next door: ${sentence(detail).toLowerCase()}.` : `That opened the next door.`;
    default: return undefined;
  }
}

export function realizeTransformationalBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!plan?.premise) return undefined;
  const evidence = rawEvidence(beat, plan).filter(observedCandidate);
  if (!evidence.length) return undefined;
  const text = realizeBeat(subject(beat, plan), beat, plan);
  return text ? `${sentence(text)}.` : undefined;
}

export function inspectTransformation(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  return { subject: subject(beat, plan), evidence: rawEvidence(beat, plan).filter(observedCandidate), strongestDetails: details(beat, plan).slice(0,8), actions: actions(beat, plan), beatKind: beat.kind, beatOrder: beat.order, playful: playful(plan), serious: SERIOUS.test(lower(plan?.purpose ?? "")) };
}
