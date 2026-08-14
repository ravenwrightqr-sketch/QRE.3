import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL EXPERIENCE REALIZER — V1
 *
 * FINAL LANGUAGE AUTHORITY FOR THE COGNITIVE EXPERIENCE COMPILER.
 *
 * This file intentionally contains NO domain/story templates.
 *
 * Core pipeline:
 *   prompt
 *     -> observed clauses
 *     -> actors / objects / actions / places / times / changes
 *     -> attention ranking
 *     -> discourse realization
 *
 * The prompt is the world model. Cognitive plans may shape tone and order,
 * but they are never allowed to manufacture factual people, places, events,
 * objects, measurements, or actions.
 *
 * Explicit participant rule:
 *   an actor is available only when the prompt actually names or describes it.
 *   A house is not an owner. A property is not a homeowner. A treasure hunt
 *   does not imply kids unless the prompt says kids/children.
 *
 * Location/time rule:
 *   explicit places and times are first-class evidence and are preserved.
 *
 * Legacy realizers must not be imported by this path.
 */

type Tone = "playful" | "dark" | "serious" | "cinematic";
type Clause = {
  raw: string;
  text: string;
  subject?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  score: number;
};

type PromptWorld = {
  sentences: string[];
  clauses: Clause[];
  subjects: string[];
  participants: string[];
  places: string[];
  times: string[];
  objects: string[];
  actions: string[];
  emotions: string[];
  changes: string[];
  tone: Tone;
};

const COGNITIVE_LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|dynamic behavior|situation is static)\b/i;
const DELIVERY_LEAK = /\b(?:delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output|customer-facing)\b/i;
const PROMPT_META = /\b(?:create|make|build|design|write|turn|generate|give|show|want|need|please|something|anything|experience|story)\b/i;
const PLAYFUL = /\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|wild|silly|whimsical|cute|cheeky|witty|crazy|mischief|delight)\b/i;
const DARK = /\b(?:horror|horrifying|horrific|creepy|terrifying|terror|haunted|sinister|disturbing|dark|nightmare|ominous|evil|cursed)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;

const ACTIONS = /\b(?:arrive|arrived|arrives|enter|entered|enters|walk|walked|walks|go|went|goes|come|came|comes|leave|left|leaves|return|returned|returns|find|found|finds|clean|cleaned|cleans|wash|washed|washes|repair|repaired|repairs|fix|fixed|fixes|restore|restored|restores|build|built|builds|make|made|makes|create|created|creates|design|designed|designs|write|wrote|writes|cook|cooked|cooks|serve|served|serves|prepare|prepared|prepares|open|opened|opens|close|closed|closes|visit|visited|visits|travel|traveled|travelled|drives|drive|drove|ride|rode|rides|paint|painted|paints|dance|danced|dances|sing|sang|sings|play|played|plays|choose|chose|chooses|pick|picked|picks|select|selected|selects|decide|decided|decides|touch|touched|touches|hold|held|holds|wear|wore|wears|taste|tasted|tastes|smell|smelled|smells|look|looked|looks|see|saw|sees|watch|watched|watches|share|shared|shares|give|gave|gives|take|took|takes|bring|brought|brings|receive|received|receives|check|checked|checks|inspect|inspected|inspects|test|tested|tests|measure|measured|measures|install|installed|installs|remove|removed|removes|change|changed|changes|turn|turned|turns|transform|transformed|transforms|finish|finished|finishes|complete|completed|completes|celebrate|celebrated|celebrates|marry|married|marries|photograph|photographed|photographs|capture|captured|captures|record|recorded|records|teach|taught|teaches|learn|learned|learns|discover|discovered|discovers|collect|collected|collects|organize|organized|organizes|decorate|decorated|decorates|style|styled|styles|trim|trimmed|trims|cut|cuts|brush|brushed|brushes|dry|dried|dries|massage|massaged|massages|relax|relaxed|relaxes|pamper|pampered|pampers|spoil|spoiled|spoils|treat|treated|treats|shake|shook|shakes|chew|chewed|chews|tear|tore|tears|eat|ate|eats|run|ran|runs|call|called|calls|rent|rented|rents|document|documented|documents|start|started|starts|stop|stopped|stops|hit|hits|arrange|arranged|arranges|steal|stole|steals|leave|left|leaves)\b/i;

const STOP = new Set([
  "the","a","an","and","or","but","for","with","about","from","this","that","into","onto",
  "then","there","here","when","where","while","because","while","was","were","is","are","be",
  "been","being","it","its","they","them","their","he","she","his","her","we","our","you","your",
  "i","my","me","to","of","in","on","at","as","by","than","more","very","really","just","want",
  "need","make","create","build","design","write","show","give","send","something","anything","experience",
  "story","people","will","can","should","could","would","like","into","some","everything","nothing",
]);

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => clean(value).toLowerCase();
const cap = (value: string): string => {
  const s = sentence(value);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function splitSentences(prompt: string): string[] {
  return prompt
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9\"'“])/)
    .map((value) => sentence(value))
    .filter(Boolean);
}

function splitClauses(text: string): string[] {
  const normalized = sentence(text);
  if (!normalized) return [];
  const pieces = normalized
    .replace(/\s*,\s*(?=(?:and|but|then|while|whereas|because)\b)/gi, "|$&")
    .replace(/\s+(?:and then|then|but then)\s+/gi, "|and then ")
    .split("|")
    .map((value) => sentence(value.replace(/^\s*(?:and|but)\s+/i, "")))
    .filter((value) => value.split(/\s+/).length >= 2);

  return pieces.length > 1 ? pieces : [normalized];
}

function extractTime(text: string): string | undefined {
  return text.match(/\b(?:at|around|by|before|after|on|during|since|from)\s+(?:the\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{1,2})?)\b/i)?.[0];
}

function extractPlace(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|from)\s+([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,5})/);
  if (explicit?.[1]) return explicit[1];
  const locationish = text.match(/\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town)\b/i);
  return locationish?.[0];
}

function extractQuotedOrNamed(text: string): string[] {
  const quoted = [...text.matchAll(/["“”']([^"“”']{2,60})["“”']/g)].map((m) => sentence(m[1] ?? ""));
  const proper = [...text.matchAll(/\b[A-Z][A-Za-z0-9'’-]{2,}(?:\s+[A-Z][A-Za-z0-9'’-]{2,}){0,3}\b/g)]
    .map((m) => sentence(m[0] ?? ""))
    .filter((value) => !/^(?:Create|Make|Build|Turn|My|The|Then|And|At|By|For|A|An)\b/i.test(value));
  return unique([...quoted, ...proper]);
}

function nouns(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length >= 3 && !STOP.has(word));

  return unique(words.filter((word) => !ACTIONS.test(word)));
}

function verbs(text: string): string[] {
  return unique((text.match(ACTIONS)?.[0] ?? "") ? [text.match(ACTIONS)?.[0] ?? ""] : []);
}

function detectTone(prompt: string, plan?: CognitiveExperiencePlan): Tone {
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

function extractSubject(sentenceText: string): string | undefined {
  const text = sentence(sentenceText);
  if (!text) return undefined;

  const patterns = [
    /^((?:my|our|the|a|an)?\s*[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z][A-Za-z0-9'’-]*){0,4})\s+(?:walked|walks|arrived|arrives|entered|enters|sat|sits|started|starts|was|were|is|are|came|comes|went|goes|stole|steals|found|finds|rented|rents|opened|opens|began|begins)\b/i,
    /^(my\s+[a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,4})\s+(?:was|sat|stood|ended|started|turned|became)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.split(/\s+/).length <= 6) return candidate;
  }

  const explicit = extractQuotedOrNamed(text)[0];
  if (explicit) return explicit;

  const lead = text.match(/^(?:the|a|an|my|our)\s+([a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,3})\b/i);
  return lead?.[1]?.trim();
}

function isExplicitParticipant(text: string, word: string): boolean {
  const p = lower(text);
  const w = lower(word);
  return p.includes(w) || new RegExp(`\\b(?:kids?|children|guests?|visitors?|crowd|family|friends?|fans?|customers?|team|group|someone|somebody|musician|artist|players?|students?|teacher|client|sister|brother|grandmother|grandfather|mother|father|wife|husband|partner|daughter|son)\\b`, "i").test(w);
}

function scoreClause(clause: Clause, index: number, world: PromptWorld): number {
  let score = 10 - index * 0.15;
  if (clause.action) score += 10;
  if (clause.object) score += 7;
  if (clause.place) score += 5;
  if (clause.time) score += 5;
  if (clause.subject) score += 4;
  if (/\b(?:suddenly|finally|apparently|somehow|then|until|after|before|but|except|only|first|last|favorite|missing|wrong|broken|stole|found|lost|surprise|surprised|excited|restless|happy|scared|angry|furious|quiet|loud)\b/i.test(clause.text)) score += 9;
  if (world.changes.some((change) => lower(clause.text).includes(lower(change)))) score += 6;
  return score;
}

function buildWorld(prompt: string, plan?: CognitiveExperiencePlan): PromptWorld {
  const sentences = splitSentences(prompt);
  const clauses: Clause[] = [];
  const subjects: string[] = [];
  const places: string[] = [];
  const times: string[] = [];
  const actions: string[] = [];
  const objects: string[] = [];
  const participants: string[] = [];
  const emotions: string[] = [];
  const changes: string[] = [];

  for (const [sentenceIndex, sentenceText] of sentences.entries()) {
    const subject = extractSubject(sentenceText);
    if (subject) subjects.push(subject);

    const sentencePlace = extractPlace(sentenceText);
    if (sentencePlace) places.push(sentencePlace);
    const sentenceTime = extractTime(sentenceText);
    if (sentenceTime) times.push(sentenceTime);

    const sentenceParticipants = extractQuotedOrNamed(sentenceText);
    for (const candidate of sentenceParticipants) {
      if (isExplicitParticipant(prompt, candidate)) participants.push(candidate);
    }

    for (const rawClause of splitClauses(sentenceText)) {
      const action = verbs(rawClause)[0];
      const place = extractPlace(rawClause) ?? sentencePlace;
      const time = extractTime(rawClause) ?? sentenceTime;
      const words = nouns(rawClause);
      const object = words.find((word) => word !== lower(subject ?? ""));
      const clause: Clause = {
        raw: rawClause,
        text: rawClause,
        subject,
        action,
        object,
        place,
        time,
        score: 0,
      };
      clauses.push(clause);
      if (action) actions.push(action);
      if (object) objects.push(object);
      if (place) places.push(place);
      if (time) times.push(time);
      if (/\b(?:scared|afraid|happy|excited|angry|furious|sad|restless|nervous|suspicious|surprised|delighted|terrified|calm|proud)\b/i.test(rawClause)) {
        emotions.push(rawClause.match(/\b(?:scared|afraid|happy|excited|angry|furious|sad|restless|nervous|suspicious|surprised|delighted|terrified|calm|proud)\b/i)?.[0] ?? "");
      }
      if (/\b(?:but|then|until|after|before|finally|suddenly|became|turned into|went from|left|ended|changed|hit)\b/i.test(rawClause)) {
        changes.push(rawClause);
      }
    }

    if (sentenceIndex > 0 && subject && subjects.length > 1) {
      const previous = subjects[subjects.length - 2];
      if (lower(previous) !== lower(subject)) changes.push(sentenceText);
    }
  }

  const planSubjects = unique([
    ...(plan?.premise?.slots.find((slot) => slot.role === "subject")?.values ?? []),
  ]);
  for (const value of planSubjects) {
    if (prompt.toLowerCase().includes(lower(value))) subjects.push(value);
  }

  const world: PromptWorld = {
    sentences,
    clauses,
    subjects: unique(subjects),
    participants: unique(participants),
    places: unique(places),
    times: unique(times),
    objects: unique(objects),
    actions: unique(actions),
    emotions: unique(emotions),
    changes: unique(changes),
    tone: detectTone(prompt, plan),
  };

  for (const [index, clause] of world.clauses.entries()) {
    clause.score = scoreClause(clause, index, world);
  }

  return world;
}

function normalizePromptClause(text: string): string {
  let value = sentence(text).trim();
  value = value.replace(/^\s*(?:and|but|then)\s+/i, "");
  value = value.replace(/\s*,\s*$/g, "");
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function removePromptCommand(text: string): string {
  let value = sentence(text);
  value = value
    .replace(/^(?:create|make|build|design|write|turn|generate)\s+(?:a|an|the)\s+/i, "")
    .replace(/^(?:create|make|build|design|write|turn|generate)\s+/i, "");
  return sentence(value);
}

function subjectDisplay(world: PromptWorld, beat: StoryBeat): string | undefined {
  const candidates = unique([
    ...world.subjects,
    ...(beat.entities ?? []),
  ]).filter(Boolean);
  return candidates.find((value) => !PROMPT_META.test(value)) ?? candidates[0];
}

function chooseClause(world: PromptWorld, beat: StoryBeat, used: Set<string>): Clause | undefined {
  const available = world.clauses
    .filter((clause) => !used.has(lower(clause.text)))
    .sort((a, b) => b.score - a.score);

  if (!available.length) return undefined;

  const pivot = beat.order % Math.min(3, available.length);
  return available[pivot] ?? available[0];
}

function rhetoricalFrame(text: string, beat: StoryBeat, world: PromptWorld): string {
  const value = sentence(text);
  if (!value) return "";

  if (world.tone === "playful") {
    if (/\b(?:stole|chewed|tore|broke|stuck|missing|wrong|restless|suspicious)\b/i.test(value)) {
      return `${value} Like there was a perfectly reasonable explanation for all of this.`;
    }
    if (beat.kind === "payoff" || beat.kind === "milestone") {
      return `${value} Somehow, that felt like the part people would repeat later.`;
    }
  }

  if (world.tone === "dark") {
    if (beat.kind === "reveal" || beat.kind === "escalation" || beat.kind === "payoff") {
      return `${value} And that was the part that stayed.`;
    }
  }

  return value;
}

function connective(beat: StoryBeat, clause: Clause, previousSubject?: string): string {
  if (beat.order === 0) return "";
  if (clause.time) return `${sentence(clause.time)} — `;
  if (beat.kind === "discovery" || beat.kind === "reveal") return "Then, ";
  if (beat.kind === "payoff" || beat.kind === "milestone") return "By then, ";
  if (beat.kind === "reflection") return "Looking back, ";
  if (beat.kind === "continuation") return "After that, ";
  if (previousSubject && clause.subject && lower(previousSubject) === lower(clause.subject)) return "Then ";
  return "Then ";
}

function realizeFromClause(clause: Clause, beat: StoryBeat, world: PromptWorld, previousSubject?: string): string {
  let text = normalizePromptClause(clause.text);
  if (!text) return "";

  const commandRemoved = removePromptCommand(text);
  if (commandRemoved && commandRemoved.split(/\s+/).length < text.split(/\s+/).length) {
    text = normalizePromptClause(commandRemoved);
  }

  const prefix = connective(beat, clause, previousSubject);
  const location = clause.place && !lower(text).includes(lower(clause.place)) ? ` at ${clause.place}` : "";
  const time = clause.time && !lower(text).includes(lower(sentence(clause.time))) ? ` ${sentence(clause.time)}` : "";

  if (text.length < 18 && (clause.object || clause.action)) {
    const subject = clause.subject ?? previousSubject;
    if (subject && clause.action) text = `${subject} ${clause.action}${clause.object ? ` ${clause.object}` : ""}`;
  }

  text = `${prefix}${text}${location}${time}`.trim();
  text = text.replace(/\s+,/g, ",");
  return rhetoricalFrame(text, beat, world);
}

function consequence(world: PromptWorld, used: Set<string>, beat: StoryBeat): string | undefined {
  const unused = world.changes
    .filter((value) => !used.has(lower(value)))
    .sort((a, b) => a.length - b.length);

  const candidate = unused[beat.order % Math.max(1, unused.length)];
  if (!candidate) return undefined;

  if (world.tone === "playful") {
    return `${sentence(candidate)} That was when the whole thing got interesting.`;
  }

  if (world.tone === "dark") {
    return `${sentence(candidate)} That was when the tone changed.`;
  }

  return sentence(candidate);
}

function safeFinal(text: string): string | undefined {
  const value = `${sentence(text)}.`;
  if (!value.trim() || value === ".") return undefined;
  if (COGNITIVE_LEAK.test(value) || DELIVERY_LEAK.test(value)) return undefined;
  return value;
}

export function realizeUniversalExperienceBeat(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  prompt: string,
  state?: { used: Set<string>; world?: PromptWorld; previousSubject?: string },
): string | undefined {
  if (!prompt.trim()) return undefined;

  const world = state?.world ?? buildWorld(prompt, plan);
  const used = state?.used ?? new Set<string>();
  const clause = chooseClause(world, beat, used);
  const subject = subjectDisplay(world, beat);

  if (clause) {
    used.add(lower(clause.text));
    const text = realizeFromClause(clause, beat, world, state?.previousSubject ?? subject);
    if (state) state.previousSubject = clause.subject ?? state.previousSubject ?? subject;
    return safeFinal(text);
  }

  const extra = consequence(world, used, beat);
  if (extra) {
    used.add(lower(extra));
    return safeFinal(extra);
  }

  if (beat.kind === "continuation") {
    const nextAnchor = world.places[0] ?? world.times[0] ?? world.objects[0] ?? subject;
    return nextAnchor ? safeFinal(`There was more to come from ${nextAnchor}`) : undefined;
  }

  return subject ? safeFinal(`${subject} stayed at the center of what happened`) : undefined;
}

export function createUniversalRealizationState(
  prompt: string,
  plan?: CognitiveExperiencePlan,
) {
  return {
    used: new Set<string>(),
    world: buildWorld(prompt, plan),
    previousSubject: undefined as string | undefined,
  };
}

export function inspectUniversalWorld(
  prompt: string,
  plan?: CognitiveExperiencePlan,
) {
  const world = buildWorld(prompt, plan);
  return {
    tone: world.tone,
    sentences: world.sentences,
    clauses: world.clauses.map(({ raw, text, subject, action, object, place, time, score }) => ({ raw, text, subject, action, object, place, time, score })),
    subjects: world.subjects,
    participants: world.participants,
    places: world.places,
    times: world.times,
    objects: world.objects,
    actions: world.actions,
    emotions: world.emotions,
    changes: world.changes,
  };
}
