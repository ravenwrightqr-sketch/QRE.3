import type { CognitiveExperiencePlan, LatentMovie, StoryBeat } from "@qre/contracts";
import { buildLatentMovie } from "./latentMovie.js";

/**
 * ELITE UNIVERSAL COG REALIZER
 *
 * Active customer-language authority for the cognitive experience compiler.
 *
 * This is deliberately NOT a domain template engine.
 * It reasons over whatever the prompt actually contains.
 *
 * Pipeline:
 *   prompt
 *     -> observed world
 *     -> latent movie
 *     -> causal attention
 *     -> rhetorical lens
 *     -> writer realization
 *
 * Universal prompting does not mean universal vocabulary.
 * It means universal reasoning over arbitrary evidence.
 */

type Lens = "playful" | "dark" | "serious" | "cinematic";
type Mode = "observed" | "generative";

type PromptFact = {
  raw: string;
  subject?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  emphasis: number;
};

export type UniversalRealizationState = {
  prompt: string;
  movie: LatentMovie;
  facts: PromptFact[];
  explicitPeople: string[];
  explicitPlaces: string[];
  explicitTimes: string[];
  lens: Lens;
  mode: Mode;
  lines: string[];
};

const META_LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue)\b/i;
const DELIVERY_LEAK = /\b(?:delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output|customer-facing|customer language)\b/i;
const GENERATOR = /^(?:create|make|build|design|write|turn|generate|give|invent|teach|show|develop|imagine|craft)\b/i;
const PLAYFUL = /\b(?:funny|fun|playful|humou?r|comedy|hilarious|ridiculous|absurd|wild|silly|whimsical|cute|cheeky|witty|crazy|mischief|delight|comic)\b/i;
const DARK = /\b(?:horror|horrifying|horrific|creepy|terrifying|terror|haunted|sinister|disturbing|dark|nightmare|ominous|evil|cursed|demented|unsettling)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|returned|find|found|clean|cleaned|wash|washed|repair|repaired|fix|fixed|restore|restored|build|built|make|made|create|created|design|designed|write|wrote|cook|cooked|serve|served|prepare|prepared|open|opened|close|closed|visit|visited|travel|traveled|travelled|drive|drove|ride|rode|paint|painted|dance|danced|sing|sang|play|played|choose|chose|pick|picked|select|selected|decide|decided|touch|touched|hold|held|wear|wore|taste|tasted|smell|smelled|look|looked|see|saw|watch|watched|share|shared|give|gave|take|took|bring|brought|receive|received|check|checked|inspect|inspected|test|tested|measure|measured|install|installed|remove|removed|change|changed|turn|turned|transform|transformed|finish|finished|complete|completed|celebrat|marry|married|photograph|photographed|capture|captured|record|recorded|teach|taught|learn|learned|discover|discovered|find|found|collect|collected|organize|organized|decorate|decorated|style|styled|trim|trimmed|cut|cuts|brush|brushed|dry|dried|massage|massaged|relax|relaxed|pamper|pampered|spoil|spoiled|treat|treated|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called|rent|rented|document|documented|start|started|stop|stopped|hit|hits|arrange|arranged|steal|stole|steals|forgive|forgave|forgiven|remember|remembered|meet|met|talk|talked|laugh|laughed|promise|promised)\b/i;
const CHANGE = /\b(?:became|becomes|turned|changed|shifted|stopped|started|finally|suddenly|until|after|before|then|but|except|instead|again|returned|back|left|won|lost|found|stole|broke|fixed|clean|spotless|excited|restless|scared|happy|angry|furious|quiet|loud|first|last|favorite|missing|wrong|broken|new|old)\b/i;
const EXPLICIT_PERSON_WORD = /\b(?:kid|kids|child|children|guest|guests|visitor|visitors|crowd|family|friend|friends|fans|customers|customer|team|group|everyone|someone|somebody|musician|artist|player|players|student|students|teacher|client|sister|brother|grandmother|grandfather|mother|father|wife|husband|partner|daughter|son|band|couple|we|i|you|they|she|he)\b/i;
const PLACE_WORD = /\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|bathroom|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|riverside|harbor)\b/i;
const TIME_WORD = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|tonight|today|tomorrow|yesterday|this week|last week|two weeks ago|last night)\b/i;

const STOPWORDS = new Set([
  "the","a","an","and","or","but","for","with","about","from","this","that","into","onto","then","there","here","when","where","while","because","was","were","is","are","be","been","being","it","its","they","them","their","he","she","his","her","we","our","you","your","i","my","me","to","of","in","on","at","as","by","than","more","very","really","just","want","need","make","create","build","design","write","show","give","send","something","anything","experience","story","people","will","can","should","could","would","like","some","everything","nothing","one","another","part","way","time","today","now","old","new","good","great","nice","funny","fun","playful","absurd","ridiculous","wild","cute","horror","horrific","terrifying","dark","mysterious","interactive","memorable"
]);

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => clean(value).toLowerCase();
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function splitSentences(prompt: string): string[] {
  return prompt
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/)
    .map(sentence)
    .filter(Boolean);
}

function splitClauses(text: string): string[] {
  const value = sentence(text);
  if (!value) return [];
  const pieces = value
    .replace(/\s*,\s*(?=(?:and then|then|but|while|because|except|until)\b)/gi, "|")
    .replace(/\s+(?:and then|then|but then)\s+/gi, "|")
    .split("|")
    .map(sentence)
    .filter((item) => item.split(/\s+/).length >= 2);
  return pieces.length > 1 ? pieces : [value];
}

function extractTime(text: string): string | undefined {
  const match = text.match(/\b(?:at|around|by|before|after|on|during|since|from)\s+(?:the\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{1,2})?|today|tonight|tomorrow|yesterday|two weeks ago|last week|last night)\b/i);
  return match?.[0];
}

function extractPlace(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|from)\s+([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,5})/);
  if (explicit?.[1]) return sentence(explicit[1]);
  const known = text.match(/\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|bathroom|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse)\b(?:\s+[A-Z][A-Za-z0-9'’-]*){0,3}/i);
  return known?.[0];
}

function properNames(text: string): string[] {
  return unique([...text.matchAll(/\b[A-Z][A-Za-z0-9'’-]{2,}(?:\s+[A-Z][A-Za-z0-9'’-]{2,}){0,3}\b/g)]
    .map((match) => sentence(match[0] ?? ""))
    .filter((value) => !/^(?:Create|Make|Build|Turn|My|The|Then|And|At|By|For|A|An|We|I|You)$/i.test(value)));
}

function words(text: string): string[] {
  return clean(text).toLowerCase().split(/[^a-z0-9'’-]+/).filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function verb(text: string): string | undefined {
  return text.match(ACTION)?.[0];
}

function subjectOf(text: string, fallback?: string): string | undefined {
  const value = sentence(text);
  const patterns = [
    /^((?:my|our|the|a|an)?\s*[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z][A-Za-z0-9'’-]*){0,4})\s+(?:walked|walks|arrived|arrives|entered|enters|sat|sits|stood|stands|started|starts|was|were|is|are|came|comes|went|goes|found|finds|rented|rents|opened|opens|began|begins|returned|returns|met|meets|talked|talks|laughed|laughs)\b/i,
    /^(my\s+[a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,4})\s+(?:was|sat|stood|started|turned|became)\b/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return sentence(match[1]);
  }
  return properNames(value)[0] ?? fallback;
}

function objectOf(text: string, subject?: string): string | undefined {
  const ws = words(text).filter((word) => lower(subject) !== word && !ACTION.test(word));
  if (!ws.length) return undefined;
  const phrase = text.match(/\b(?:a|an|the|my|our)\s+([a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,4})\b/i)?.[1];
  if (phrase && !/^(?:couple|people|things|story|experience)$/i.test(phrase)) return sentence(phrase);
  return ws.slice(0, 3).join(" ");
}

function isExplicitParticipant(prompt: string, value: string): boolean {
  const candidate = lower(value);
  if (candidate === "owner" || candidate === "homeowner" || candidate === "host") return /\b(?:owner|homeowner|host)\b/i.test(prompt);
  if (candidate === "kids" || candidate === "children") return /\b(?:kids?|children)\b/i.test(prompt);
  if (candidate === "family") return /\bfamily\b/i.test(prompt);
  if (candidate === "guests" || candidate === "guest") return /\bguests?\b/i.test(prompt);
  return lower(prompt).includes(candidate) || EXPLICIT_PERSON_WORD.test(candidate);
}

function detectMode(prompt: string): Mode {
  return GENERATOR.test(prompt) ? "generative" : "observed";
}

function detectLens(prompt: string, plan?: CognitiveExperiencePlan): Lens {
  const text = lower([
    prompt,
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
  ].join(" "));
  if (SERIOUS.test(text)) return "serious";
  if (DARK.test(text)) return "dark";
  if (PLAYFUL.test(text)) return "playful";
  return "cinematic";
}

function parseFacts(prompt: string, fallbackSubject?: string): PromptFact[] {
  const facts: PromptFact[] = [];
  for (const [index, rawSentence] of splitSentences(prompt).entries()) {
    for (const raw of splitClauses(rawSentence)) {
      const action = verb(raw);
      const subject = subjectOf(raw, fallbackSubject);
      const place = extractPlace(raw) ?? extractPlace(rawSentence);
      const time = extractTime(raw) ?? extractTime(rawSentence);
      const object = objectOf(raw, subject);
      const emphasis = 10 + (action ? 8 : 0) + (place ? 4 : 0) + (time ? 4 : 0) + (CHANGE.test(raw) ? 7 : 0) - index * 0.2;
      facts.push({ raw, subject, action, object, place, time, emphasis });
    }
  }
  return facts.sort((a, b) => b.emphasis - a.emphasis);
}

function sourceDetails(movie: LatentMovie, facts: PromptFact[]): string[] {
  return unique([
    ...facts.flatMap((fact) => [fact.object ?? "", fact.place ?? "", fact.time ?? ""]),
    ...movie.details,
    ...movie.events.map((event) => event.fact),
  ]).filter((value) => value.length > 2 && !META_LEAK.test(value) && !DELIVERY_LEAK.test(value));
}

function similarity(a: string, b: string): number {
  const aa = new Set(words(a));
  const bb = new Set(words(b));
  if (!aa.size || !bb.size) return 0;
  let shared = 0;
  for (const word of aa) if (bb.has(word)) shared += 1;
  return shared / Math.max(aa.size, bb.size);
}

function explicitContext(facts: PromptFact[], movie: LatentMovie): { place?: string; time?: string } {
  const place = unique(facts.map((fact) => fact.place ?? "").filter(Boolean))[0] ?? movie.places[0];
  const time = unique(facts.map((fact) => fact.time ?? "").filter(Boolean))[0] ?? undefined;
  return { place, time };
}

function article(value: string, definite = true): string {
  const text = sentence(value);
  if (!text) return "";
  if (/^(?:the|a|an|my|our|their|his|her|this|that)\b/i.test(text)) return text;
  if (/^[aeiou]/i.test(text)) return `${definite ? "the" : "an"} ${text}`;
  return `${definite ? "the" : "a"} ${text}`;
}

function actionPhrase(fact: PromptFact): string {
  if (fact.action && fact.object) return `${fact.action.toLowerCase()} ${article(fact.object, false)}`;
  if (fact.action) return fact.action.toLowerCase();
  if (fact.object) return `dealt with ${article(fact.object)}`;
  return sentence(fact.raw).toLowerCase();
}

function writerMove(fact: PromptFact, lens: Lens, previous?: PromptFact): string {
  const subject = fact.subject ?? previous?.subject ?? "it";
  const object = fact.object;
  const action = fact.action;

  if (lens === "playful") {
    if (action && /steal|stole|chew|chewed|tear|tore|break|broke/i.test(action)) {
      return `${subject} ${action.toLowerCase()} ${object ? article(object, false) : "something"} like the negotiation had gone badly.`;
    }
    if (action && /clean|washed|brush|dried|massage|pamper|treat/i.test(action) && object) {
      return `${article(object)} changed the mood, which was a suspiciously efficient solution.`;
    }
    if (action && /arriv|enter|walk|came|go|went/i.test(action)) {
      return `${subject} walked into it with the kind of confidence usually reserved for decisions already made.`;
    }
    if (object) return `${article(object)} somehow became more important than it had any right to be.`;
    return `${subject} kept going as though the plan had been expecting this.`;
  }

  if (lens === "dark") {
    if (object) return `${article(object)} was the detail that made the room feel less harmless.`;
    if (action) return `${subject} ${action.toLowerCase()}, and the atmosphere changed with it.`;
    return `Something about ${subject} felt different after that.`;
  }

  if (lens === "serious") {
    if (action && object) return `${cap(subject)} ${action.toLowerCase()} ${article(object, false)}.`;
    if (object) return `${cap(object)} became part of what mattered.`;
    return `${cap(sentence(fact.raw))}.`;
  }

  if (object && action) return `${cap(subject)} ${action.toLowerCase()} ${article(object, false)}, and the shape of the day shifted.`;
  if (object) return `${cap(article(object))} became the detail that changed what came next.`;
  if (action) return `${cap(subject)} ${action.toLowerCase()}, and the story moved with it.`;
  return `Then the picture changed.`;
}

function generativeLines(prompt: string, movie: LatentMovie, lens: Lens, context: { place?: string; time?: string }): string[] {
  const subject = movie.subject !== "the subject" ? movie.subject : (movie.details[0] ?? "the idea");
  const detail = movie.details.find((value) => value.toLowerCase() !== subject.toLowerCase()) ?? movie.events[0]?.fact ?? subject;
  const placePhrase = context.place ? ` at ${context.place}` : "";
  const timePhrase = context.time ? ` ${context.time}` : "";

  if (lens === "playful") {
    return [
      `${cap(article(subject))} started with a simple premise${placePhrase}.`,
      `${cap(article(detail))} gave it the first real complication.`,
      `After that, the original plan stopped looking quite so innocent${timePhrase}.`,
      `By the end, the best part was that nobody could have mistaken it for the ordinary version.`,
    ];
  }
  if (lens === "dark") {
    return [
      `${cap(article(subject))} looked ordinary enough${placePhrase}${timePhrase}.`,
      `${cap(article(detail))} was where the atmosphere turned.`,
      `After that, each new detail seemed to make the previous one less reassuring.`,
      `By the end, the original idea had acquired teeth.`,
    ];
  }
  return [
    `${cap(article(subject))} took shape${placePhrase}${timePhrase}.`,
    `${cap(article(detail))} became the first thing that gave it a life of its own.`,
    `Then the pieces began to connect, and what had been an idea became an experience.`,
    `By the end, there was a version worth remembering rather than merely describing.`,
  ];
}

function observedLines(prompt: string, facts: PromptFact[], movie: LatentMovie, lens: Lens): string[] {
  const usableFacts = facts.length ? [...facts].sort((a, b) => b.emphasis - a.emphasis) : [];
  const context = explicitContext(usableFacts, movie);
  const lines: string[] = [];

  if (!usableFacts.length) return generativeLines(prompt, movie, lens, context);

  const first = usableFacts[0]!;
  const second = usableFacts[1];
  const third = usableFacts[2];
  const fourth = usableFacts[3];

  const openingSubject = first.subject ?? movie.subject;
  const openingLocation = context.place;
  const openingTime = context.time;

  if (openingSubject && openingSubject !== "the subject") {
    const location = openingLocation ? ` at ${openingLocation}` : "";
    const time = openingTime ? ` ${openingTime}` : "";
    if (lens === "playful") {
      lines.push(`${cap(openingSubject)} walked into the situation${location}${time} with the confidence of someone about to have an opinion.`);
    } else if (lens === "dark") {
      lines.push(`${cap(openingSubject)} entered${location}${time}, and the atmosphere was already carrying more weight than it should have.`);
    } else {
      lines.push(`${cap(openingSubject)} entered the scene${location}${time}, and the day took its shape from there.`);
    }
  }

  for (const fact of [first, second, third, fourth]) {
    if (!fact) continue;
    const candidate = writerMove(fact, lens, usableFacts[usableFacts.indexOf(fact) - 1]);
    const tooSimilar = lines.some((line) => similarity(line, fact.raw) > 0.82 || similarity(line, candidate) > 0.88);
    if (!tooSimilar && !lines.some((line) => similarity(line, candidate) > 0.72)) {
      lines.push(candidate);
    }
  }

  if (lines.length < 3 && second) {
    const consequence = lens === "playful"
      ? `By then, ${article(second.object ?? second.subject ?? movie.subject)} had quietly become the part everyone would remember.`
      : lens === "dark"
        ? `By then, ${article(second.object ?? second.subject ?? movie.subject)} was impossible to ignore.`
        : `By then, ${article(second.object ?? second.subject ?? movie.subject)} had become the detail that stayed.`;
    if (!lines.some((line) => similarity(line, consequence) > 0.7)) lines.push(consequence);
  }

  if (lines.length < 4) {
    const callback = lens === "playful"
      ? `And that was the point where the original plan quietly surrendered to what actually happened.`
      : lens === "dark"
        ? `After that, the earlier details carried a different meaning.`
        : `After that, the earlier details made more sense together.`;
    if (!lines.includes(callback)) lines.push(callback);
  }

  return unique(lines).slice(0, 6);
}

function sanitize(line: string): string {
  let text = sentence(line);
  text = text.replace(/\s+,/g, ",").replace(/,\s*,/g, ",");
  text = text.replace(/\b(?:the|a|an)\s+the\b/gi, "the");
  text = text.replace(/\b(?:a|an)\s+(?:a|an)\b/gi, "a");
  if (META_LEAK.test(text) || DELIVERY_LEAK.test(text)) return "";
  return text ? `${text}.` : "";
}

function preserveExplicitContext(lines: string[], facts: PromptFact[], movie: LatentMovie): string[] {
  const context = explicitContext(facts, movie);
  const required = [context.time, context.place].filter(Boolean) as string[];
  if (!required.length) return lines;
  const joined = lines.join(" ").toLowerCase();
  const missing = required.filter((value) => !joined.includes(value.toLowerCase()));
  if (!missing.length || !lines.length) return lines;

  const suffix = missing.join(" at ");
  const first = lines[0] ?? "";
  const base = sentence(first);
  const augmented = `${base} at ${suffix}`;
  return [sanitize(augmented), ...lines.slice(1)].filter(Boolean);
}

function distinctLines(lines: string[], prompt: string): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (similarity(line, prompt) > 0.9) continue;
    if (result.some((existing) => similarity(existing, line) > 0.78)) continue;
    result.push(line);
  }
  return result;
}

export function createUniversalRealizationState(
  prompt: string,
  plan?: CognitiveExperiencePlan,
): UniversalRealizationState {
  const movie = buildLatentMovie(plan);
  const mode = detectMode(prompt);
  const lens = detectLens(prompt, plan);
  const facts = parseFacts(prompt, movie.subject);
  const promptPeople = properNames(prompt).filter((name) => isExplicitParticipant(prompt, name));
  const rolePeople = movie.participants.filter((name) => isExplicitParticipant(prompt, name));
  const explicitPeople = unique([...promptPeople, ...rolePeople]);
  const explicitPlaces = unique([
    ...facts.map((fact) => fact.place ?? "").filter(Boolean),
    ...movie.places,
  ]);
  const explicitTimes = unique(facts.map((fact) => fact.time ?? "").filter(Boolean));

  const baseLines = mode === "generative"
    ? generativeLines(prompt, movie, lens, explicitContext(facts, movie))
    : observedLines(prompt, facts, movie, lens);

  const lines = preserveExplicitContext(
    distinctLines(baseLines.map(sanitize).filter(Boolean), prompt),
    facts,
    movie,
  );

  return {
    prompt,
    movie,
    facts,
    explicitPeople,
    explicitPlaces,
    explicitTimes,
    lens,
    mode,
    lines: lines.length ? lines : [sanitize(`The story began with ${movie.subject}.`)],
  };
}

export function realizeUniversalExperienceBeat(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  prompt: string,
  state: UniversalRealizationState,
): string | undefined {
  if (!state || state.prompt !== prompt) return undefined;

  const lines = state.lines;
  const index = Math.max(0, Math.min(lines.length - 1, beat.order));
  let line = lines[index];

  if (!line && lines.length) {
    const remaining = state.facts[beat.order % Math.max(1, state.facts.length)];
    if (remaining) {
      line = sanitize(writerMove(remaining, state.lens));
    }
  }

  if (!line) return undefined;
  return sanitize(line);
}
