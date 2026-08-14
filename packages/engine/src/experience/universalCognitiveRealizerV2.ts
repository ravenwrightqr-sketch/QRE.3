import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL COGNITIVE REALIZER V2
 *
 * STATUS: ACTIVE / SINGLE LANGUAGE AUTHORITY
 *
 * This layer is deliberately domain-neutral. It does not contain groomer,
 * restaurant, nightlife, wedding, housekeeper, pet, horror, or other domain
 * branches. Those are vocabulary supplied by the prompt.
 *
 * The engine reasons over the prompt as a small world model:
 *
 *   PROMPT
 *     -> explicit entities / actors / objects / places / times
 *     -> events and state changes
 *     -> causal links and attention peaks
 *     -> discourse plan
 *     -> rhetorical realization
 *
 * The key distinction is factual evidence vs. creative framing:
 *
 *   OBSERVED  = directly present in the prompt
 *   REQUESTED = explicitly asked for by the prompt
 *   INFERRED  = safe structural interpretation of supplied evidence
 *   CREATIVE  = rhetorical attitude, comparison, metaphor, or consequence
 *
 * Creative material may intensify the experience, but it may not smuggle in
 * an unprompted actor, location, relationship, profession, ownership, or
 * physical event.
 */

type EvidenceKind = "observed" | "requested" | "inferred" | "creative";
type Tone = "playful" | "dark" | "cinematic" | "warm" | "urgent";
type Intent = "record" | "create" | "remember" | "teach" | "promote" | "explore" | "rescue" | "unknown";

type Evidence = {
  id: string;
  text: string;
  kind: EvidenceKind;
  weight: number;
  subject?: string;
  object?: string;
  actor?: string;
  place?: string;
  time?: string;
  action?: string;
  sourceClause: number;
};

type EventNode = {
  id: string;
  order: number;
  raw: string;
  subject?: string;
  actor?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  evidence: Evidence[];
  change: number;
  attention: number;
};

type World = {
  prompt: string;
  intent: Intent;
  tone: Tone;
  events: EventNode[];
  people: string[];
  participants: string[];
  subjects: string[];
  objects: string[];
  places: string[];
  times: string[];
  actions: string[];
  emotions: string[];
  anchors: string[];
  explicitLenses: string[];
};

type RealizationState = {
  usedEvidence: Set<string>;
  usedPhrases: Set<string>;
  previousTopic?: string;
  lastEvent?: EventNode;
  world: World;
};

const CLEAN = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const sentence = (value: unknown): string => CLEAN(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text[0]!.toUpperCase() + text.slice(1) : "";
};

const META_LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|dynamic behavior|situation is static|concrete reason to continue|result is available|current state|next experiential state)\b/i;
const DELIVERY_LEAK = /\b(?:delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output|customer-facing)\b/i;
const META_VERBS = /^(?:create|make|build|design|write|turn|generate|give|show|tell|produce|develop|prepare|invent)\b/i;
const ACTION = /\b(?:arrive|arrived|arrives|enter|entered|enters|walk|walked|walks|go|went|goes|come|came|comes|leave|left|leaves|return|returned|returns|find|found|finds|clean|cleaned|cleans|wash|washed|washes|repair|repaired|repairs|fix|fixed|fixes|restore|restored|restores|build|built|builds|make|made|makes|create|created|creates|design|designed|designs|write|wrote|writes|cook|cooked|cooks|serve|served|serves|prepare|prepared|prepares|open|opened|opens|close|closed|closes|visit|visited|visits|travel|traveled|travelled|drive|drove|drives|ride|rode|rides|paint|painted|paints|dance|danced|dances|sing|sang|sings|play|played|plays|choose|chose|chooses|pick|picked|picks|select|selected|selects|decide|decided|decides|touch|touched|touches|hold|held|holds|wear|wore|wears|taste|tasted|tastes|smell|smelled|smells|look|looked|looks|see|saw|sees|watch|watched|watches|share|shared|shares|give|gave|gives|take|took|takes|bring|brought|brings|receive|received|receives|check|checked|checks|inspect|inspected|inspects|test|tested|tests|measure|measured|measures|install|installed|installs|remove|removed|removes|change|changed|changes|turn|turned|turns|transform|transformed|transforms|finish|finished|finishes|complete|completed|completes|celebrate|celebrated|celebrates|marry|married|marries|photograph|photographed|photographs|capture|captured|captures|record|recorded|records|teach|taught|teaches|learn|learned|learns|discover|discovered|discovers|collect|collected|collects|organize|organized|organizes|decorate|decorated|decorates|style|styled|styles|trim|trimmed|trims|cut|cuts|brush|brushed|brushes|dry|dried|dries|massage|massaged|massages|relax|relaxed|relaxes|pamper|pampered|pampers|spoil|spoiled|spoils|treat|treated|treats|shake|shook|shakes|chew|chewed|chews|steal|stole|steals|tear|tore|tears|eat|ate|eats|run|ran|runs|call|called|calls|rent|rented|rents|document|documented|documents|start|started|starts|stop|stopped|stops|hit|hits|open|opened|climb|climbed|climbs|sit|sat|sits|stand|stood|stands|talk|talked|talks|meet|met|meets|stay|stayed|stays|sleep|slept|sleeps|sing|sang|sings|play|played|plays|learn|learned|learns|practice|practiced|practices)\b/i;
const CHANGE = /\b(?:but|then|until|after|before|finally|suddenly|however|instead|became|becomes|turned|changed|ended|left|arrived|hit|stole|found|lost|missing|wrong|broken|first|last|again|another|still|no longer|from .* to)\b/i;
const ATTENTION = /\b(?:suddenly|finally|apparently|somehow|then|until|but|except|only|first|last|again|favorite|missing|wrong|broken|stole|found|lost|surprise|surprised|excited|restless|happy|scared|angry|furious|quiet|loud|tiny|giant|absurd|ridiculous|terrifying|mysterious|unexpected|strange|weird)\b/i;
const PERSON = /\b(?:i|me|my|we|us|our|you|your|he|him|his|she|her|they|them|their|someone|somebody|kid|kids|child|children|guest|guests|visitor|visitors|crowd|family|friends?|fans?|customer|customers|client|clients|team|group|partner|sister|brother|mother|father|grandmother|grandfather|wife|husband|daughter|son|musician|artist|teacher|student|player|players|band|actor|actress)\b/i;
const PLACE_WORD = /\b(?:at|in|inside|near|around|outside|from|on)\s+([^,.!?]+)|\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|hotel|warehouse|church|hall)\b/i;
const TIME_WORD = /\b(?:at|around|by|before|after|on|during|since|from)\s+(?:the\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{1,2})?)\b/i;
const QUOTE = /["“”']([^"“”']{2,80})["“”']/g;
const PROPER = /\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,4}\b/g;
const EMOTION = /\b(?:scared|afraid|happy|excited|angry|furious|sad|restless|nervous|suspicious|surprised|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled)\b/i;

const STOPWORDS = new Set([
  "the","a","an","and","or","but","for","with","about","from","this","that","into","onto","then","there","here","when","where","while","because","was","were","is","are","be","been","being","it","its","they","them","their","he","she","his","her","we","our","you","your","i","my","me","to","of","in","on","at","as","by","than","more","very","really","just","want","need","make","create","build","design","write","show","give","send","something","anything","experience","story","people","will","can","should","could","would","like","into","some","everything","nothing","someone","somebody"
]);

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function choose<T>(values: readonly T[], seed: string): T | undefined {
  if (!values.length) return undefined;
  return values[hash(seed) % values.length];
}

function normalizeWords(text: string): string[] {
  return sentence(text)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function explicitPlace(text: string): string | undefined {
  const match = text.match(/\b(?:at|in|inside|near|around|outside|from|on)\s+([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’\-]*){0,5})/);
  if (match?.[1]) return sentence(match[1]);
  const fallback = text.match(/\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall)\b/i);
  return fallback?.[0];
}

function explicitTime(text: string): string | undefined {
  return text.match(TIME_WORD)?.[0];
}

function namedEntities(text: string): string[] {
  const quoted = [...text.matchAll(QUOTE)].map((m) => sentence(m[1] ?? ""));
  const proper = [...text.matchAll(PROPER)]
    .map((m) => sentence(m[0] ?? ""))
    .filter((value) => !/^(?:Create|Make|Build|Turn|Generate|The|Then|And|At|By|For|A|An|My|Our|I|We|This|That)$/i.test(value));
  return unique([...quoted, ...proper]);
}

function splitSentences(prompt: string): string[] {
  return prompt
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9\"'“])/)
    .map(sentence)
    .filter(Boolean);
}

function splitClauses(text: string): string[] {
  const base = sentence(text);
  if (!base) return [];
  const pieces = base
    .replace(/\s*;\s*/g, "|")
    .replace(/\s*,\s+(?=(?:and|but|then|while|until|because|so)\b)/gi, "|")
    .replace(/\s+(?:and then|then suddenly|but then)\s+/gi, "|")
    .split("|")
    .map((part) => sentence(part.replace(/^\s*(?:and|but|then)\s+/i, "")))
    .filter((part) => part.length >= 3);
  return pieces.length ? unique(pieces) : [base];
}

function detectIntent(prompt: string): Intent {
  const text = lower(prompt);
  if (/\b(?:remember|preserve|memory|grandfather|grandmother|wedding|birthday|forever|keeps? growing|years?)\b/i.test(text)) return "remember";
  if (/\b(?:teach|learn|lesson|tutorial|how to|explain|practice)\b/i.test(text)) return "teach";
  if (/\b(?:rescue|missing|lost pet|adopt|shelter)\b/i.test(text)) return "rescue";
  if (/\b(?:promote|advertis|brand|loyalty|customer|business|restaurant|bar|shop|service)\b/i.test(text)) return "promote";
  if (/\b(?:create|make|build|design|invent|turn .* into|treasure hunt|experience)\b/i.test(text)) return "create";
  if (/\b(?:visit|travel|trip|adventure|route|road|place|museum|concert|rave|festival)\b/i.test(text)) return "explore";
  if (sententialEventLikelihood(prompt)) return "record";
  return "unknown";
}

function sententialEventLikelihood(prompt: string): boolean {
  const clauses = splitSentences(prompt);
  return clauses.some((text) => ACTION.test(text) || CHANGE.test(text));
}

function detectTone(prompt: string, plan?: CognitiveExperiencePlan): Tone {
  const corpus = lower([
    prompt,
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.dynamicBehavior ?? []),
  ].join(" "));
  if (/\b(?:urgent|rescue|missing|emergency)\b/i.test(corpus)) return "urgent";
  if (/\b(?:horror|horrifying|horrific|creepy|terrifying|terror|haunted|sinister|disturbing|dark|nightmare|ominous|cursed|demented)\b/i.test(corpus)) return "dark";
  if (/\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|wild|silly|whimsical|cute|cheeky|witty|crazy|mischief)\b/i.test(corpus)) return "playful";
  if (/\b(?:warm|heartfelt|tender|intimate|family|love|remember|memory|memorial|wedding|birthday)\b/i.test(corpus)) return "warm";
  return "cinematic";
}

function actionWord(text: string): string | undefined {
  return text.match(ACTION)?.[0];
}

function subjectCandidate(text: string): string | undefined {
  const cleanText = sentence(text);
  const named = namedEntities(cleanText)[0];
  if (named && !ACTION.test(named) && !META_VERBS.test(named)) return named;

  const pattern = cleanText.match(/^(?:(?:my|our|the|a|an)\s+)?([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9'’-]*){0,4})\s+(?=(?:arrived|arrives|walked|walks|entered|enters|sat|sits|stood|stands|started|starts|found|finds|went|goes|came|comes|was|were|is|are|had|has)\b)/i);
  const candidate = sentence(pattern?.[1] ?? "");
  return candidate || undefined;
}

function objectCandidate(text: string, subject?: string): string | undefined {
  const words = normalizeWords(text).filter((word) => word !== lower(subject ?? "") && !ACTION.test(word));
  if (!words.length) return undefined;
  const explicit = [
    "bow","bubbles","bath","kitchen","bathroom","recipe","watch","truck","guitar","pick","cake","door","window","lights","elevator","rain","clues","museum","song","chairs","table","coffee","shoes","hat","photo","video","crowd","band","house","home","spa","tattoo","surfboard","wave","keys","phone","dress","ring","cake"
  ];
  return choose(words.filter((word) => explicit.includes(word)), `${text}|object`) ?? words[0];
}

function explicitParticipants(prompt: string): string[] {
  const corpus = lower(prompt);
  const candidates = [
    "kids","children","guests","visitors","crowd","family","friends","fans","customers","clients","team","group","partner","sister","brother","mother","father","grandmother","grandfather","wife","husband","daughter","son","musician","artist","teacher","student","player","players","band","someone","somebody","i","we","you"
  ];
  return unique(candidates.filter((candidate) => new RegExp(`\\b${candidate}\\b`, "i").test(corpus)));
}

function evidenceForClause(text: string, index: number): Evidence[] {
  const subject = subjectCandidate(text);
  const actor = PERSON.test(text) ? subject : undefined;
  const action = actionWord(text);
  const place = explicitPlace(text);
  const time = explicitTime(text);
  const object = objectCandidate(text, subject);
  const out: Evidence[] = [];

  out.push({ id: `c${index}:raw`, text: sentence(text), kind: "observed", weight: 1, subject, actor, action, object, place, time, sourceClause: index });
  if (subject) out.push({ id: `c${index}:subject`, text: subject, kind: "observed", weight: 0.98, subject, sourceClause: index });
  if (action) out.push({ id: `c${index}:action`, text: action, kind: "observed", weight: 0.94, action, sourceClause: index });
  if (object) out.push({ id: `c${index}:object`, text: object, kind: "observed", weight: 0.9, object, sourceClause: index });
  if (place) out.push({ id: `c${index}:place`, text: place, kind: "observed", weight: 0.96, place, sourceClause: index });
  if (time) out.push({ id: `c${index}:time`, text: time, kind: "observed", weight: 0.96, time, sourceClause: index });
  return out;
}

function eventChangeScore(text: string): number {
  let score = 0;
  if (CHANGE.test(text)) score += 0.35;
  if (ATTENTION.test(text)) score += 0.28;
  if (ACTION.test(text)) score += 0.18;
  if (EMOTION.test(text)) score += 0.24;
  if (/\b(?:first|last|again|finally|suddenly|until|after|before|then)\b/i.test(text)) score += 0.14;
  return Math.min(1, score);
}

function buildWorld(prompt: string, plan?: CognitiveExperiencePlan): World {
  const sentences = splitSentences(prompt);
  const events: EventNode[] = [];
  const subjects: string[] = [];
  const people = explicitParticipants(prompt);
  const places: string[] = [];
  const times: string[] = [];
  const actions: string[] = [];
  const objects: string[] = [];
  const emotions: string[] = [];
  const anchors: string[] = [];

  for (const [sentenceIndex, sentenceText] of sentences.entries()) {
    const clauses = splitClauses(sentenceText);
    for (const raw of clauses) {
      const evidence = evidenceForClause(raw, sentenceIndex);
      const first = evidence[0];
      const subject = first?.subject;
      const place = first?.place;
      const time = first?.time;
      const action = first?.action;
      const object = first?.object;
      if (subject) subjects.push(subject);
      if (place) places.push(place);
      if (time) times.push(time);
      if (action) actions.push(action);
      if (object) objects.push(object);
      if (EMOTION.test(raw)) emotions.push(raw.match(EMOTION)?.[0] ?? "");

      const event: EventNode = {
        id: `event-${events.length + 1}`,
        order: events.length,
        raw: sentence(raw),
        subject,
        actor: first?.actor,
        action,
        object,
        place,
        time,
        evidence,
        change: eventChangeScore(raw),
        attention: eventChangeScore(raw) + (raw.length > 18 ? 0.1 : 0),
      };
      events.push(event);

      if (place || time || object || action) {
        anchors.push(...[place, time, object, action].filter((value): value is string => Boolean(value)));
      }
    }
  }

  const premiseSubject = plan?.premise?.slots.find((slot) => slot.role === "subject")?.values ?? [];
  for (const value of premiseSubject) {
    if (lower(prompt).includes(lower(value))) subjects.push(value);
  }

  const named = namedEntities(prompt);
  const allSubjects = unique([...subjects, ...named.filter((value) => !META_VERBS.test(value))]);

  const intent = detectIntent(prompt);
  const tone = detectTone(prompt, plan);

  const explicitLenses = unique([
    ...(tone === "playful" ? ["comedy"] : []),
    ...(tone === "dark" ? ["horror"] : []),
    ...(tone === "cinematic" ? ["cinematic"] : []),
    ...(tone === "warm" ? ["memory"] : []),
    ...(tone === "urgent" ? ["urgent"] : []),
  ]);

  return {
    prompt,
    intent,
    tone,
    events,
    people: unique(people),
    participants: unique(people),
    subjects: unique(allSubjects),
    objects: unique(objects),
    places: unique(places),
    times: unique(times),
    actions: unique(actions),
    emotions: unique(emotions),
    anchors: unique(anchors),
    explicitLenses,
  };
}

function subjectFor(world: World, beat: StoryBeat): string | undefined {
  const fromBeat = beat.entities?.find((value) => value && !META_VERBS.test(value));
  return fromBeat ?? world.subjects.find((value) => !META_VERBS.test(value));
}

function eventScore(event: EventNode, beat: StoryBeat, state: RealizationState): number {
  let score = event.attention;
  if (state.usedEvidence.has(lower(event.raw))) score -= 100;
  if (beat.order === 0 && event.order === 0) score += 0.45;
  if (/^(?:discovery|reveal|escalation|payoff|milestone)$/.test(beat.kind) && event.change > 0.4) score += 0.35;
  if (/^(?:orientation|origin|threshold)$/.test(beat.kind) && event.order === 0) score += 0.3;
  if (/^(?:transformation|reflection)$/.test(beat.kind) && event.order === worldEventLast(state.world)) score += 0.25;
  if (event.place) score += 0.08;
  if (event.time) score += 0.08;
  return score;
}

function worldEventLast(world: World): number {
  return Math.max(0, world.events.length - 1);
}

function bestEvent(beat: StoryBeat, state: RealizationState): EventNode | undefined {
  const ranked = [...state.world.events].sort(
    (a, b) => eventScore(b, beat, state) - eventScore(a, beat, state),
  );
  return ranked[0];
}

function eventEvidence(event: EventNode | undefined, state: RealizationState): Evidence[] {
  if (!event) return [];
  return event.evidence.filter((item) => !state.usedEvidence.has(item.id));
}

function markEvent(event: EventNode | undefined, state: RealizationState): void {
  if (!event) return;
  state.lastEvent = event;
  state.usedEvidence.add(lower(event.raw));
  for (const evidence of event.evidence) state.usedEvidence.add(evidence.id);
  if (event.subject) state.previousTopic = event.subject;
}

function article(value: string): string {
  const text = lower(value);
  if (!text) return "";
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return /^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`;
}

function naturalClause(event: EventNode): string {
  let text = sentence(event.raw);
  text = text.replace(/^\s*(?:and|but|then)\s+/i, "");
  text = text.replace(/^\s*(?:create|make|build|design|write|turn|generate)\s+(?:a|an|the)?\s*/i, "");
  return sentence(text);
}

function lensPhrase(world: World, event: EventNode, beat: StoryBeat, seed: string): string | undefined {
  const actor = event.subject ?? event.actor ?? world.subjects[0];
  const object = event.object ?? world.objects[0];
  if (!actor && !object) return undefined;

  if (world.tone === "playful") {
    const options = [
      actor && object ? `${actor} treated ${article(object)} like there had been terms and conditions.` : actor ? `${actor} arrived with opinions.` : `${article(object)} was clearly going to be important.`,
      actor && object ? `${actor} approached ${article(object)} as if compensation was already part of the package.` : `Apparently, ${article(object)} had entered the negotiations.`,
      actor && object ? `${actor} gave ${article(object)} the kind of attention usually reserved for suspicious decisions.` : `${article(object)} suddenly had headline status.`,
      actor && object ? `For ${actor}, ${article(object)} was not going to pass without comment.` : `${article(object)} did not exactly go unnoticed.`,
    ];
    return choose(options, seed);
  }

  if (world.tone === "dark") {
    const options = [
      actor && object ? `${actor} noticed ${article(object)}. That was the first mistake.` : `${article(object)} was there, and suddenly it mattered.`,
      actor && object ? `${actor} became aware of ${article(object)} at exactly the wrong time.` : `${article(object)} should have been ordinary. It wasn't.`,
      actor && object ? `Something about ${article(object)} changed the way ${actor} saw the place.` : `${article(object)} changed the atmosphere without needing an explanation.`,
    ];
    return choose(options, seed);
  }

  if (world.tone === "cinematic") {
    const options = [
      object ? `${cap(article(object))} became the detail the scene kept returning to.` : actor ? `${actor} became the center of the scene without announcing it.` : undefined,
      event.place && object ? `At ${event.place}, ${article(object)} became impossible to overlook.` : undefined,
      event.time && object ? `${sentence(event.time)} was when ${article(object)} changed the temperature of the scene.` : undefined,
      actor && object ? `${actor} and ${article(object)} became the point where everything else seemed to line up.` : undefined,
    ].filter((value): value is string => Boolean(value));
    return choose(options, seed);
  }

  if (world.tone === "warm") {
    const options = [
      actor && object ? `${actor} kept coming back to ${article(object)}, which is usually how a memory announces itself.` : undefined,
      event.place && object ? `At ${event.place}, ${article(object)} became part of what was worth keeping.` : undefined,
      object ? `${cap(article(object))} became one of the details that made the whole thing personal.` : undefined,
    ].filter((value): value is string => Boolean(value));
    return choose(options, seed);
  }

  if (world.tone === "urgent") {
    const options = [
      actor && object ? `${actor} had to deal with ${article(object)} before anything else could move.` : undefined,
      object ? `${cap(article(object))} became the immediate problem.` : undefined,
    ].filter((value): value is string => Boolean(value));
    return choose(options, seed);
  }

  return undefined;
}

function locationTimeAnchor(event: EventNode): string | undefined {
  if (event.place && event.time) return `${event.place} at ${sentence(event.time).replace(/^at\s+/i, "")}`;
  if (event.place) return `at ${event.place}`;
  if (event.time) return sentence(event.time);
  return undefined;
}

function cleanAwkward(text: string): string {
  return sentence(text)
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\b(?:a|an)\s+(?:a|an)\b/gi, "$1")
    .replace(/\bthe\s+the\b/gi, "the")
    .trim();
}

function isCopiedPrompt(text: string, event: EventNode, world: World): boolean {
  const candidate = lower(cleanAwkward(text));
  const source = lower(event.raw);
  if (!candidate || !source) return false;
  if (candidate === source) return true;
  const candidateWords = normalizeWords(candidate);
  const sourceWords = new Set(normalizeWords(source));
  const overlap = candidateWords.filter((word) => sourceWords.has(word)).length;
  return candidateWords.length >= 8 && overlap / Math.max(candidateWords.length, 1) > 0.82 && world.intent !== "record";
}

function antiGeneric(text: string): boolean {
  return /\b(?:things got underway|the day moved on|the difference was easy to see|the moment moved|the result spoke for itself|the story continued|the scene changed|the experience became|the next part followed|the situation changed|something happened|the result was clear)\b/i.test(text);
}

function safeFinal(text: string): string | undefined {
  const value = cleanAwkward(text);
  if (!value) return undefined;
  if (META_LEAK.test(value) || DELIVERY_LEAK.test(value)) return undefined;
  if (antiGeneric(value)) return undefined;
  return `${value}.`;
}

function recordSentence(event: EventNode, world: World, beat: StoryBeat, state: RealizationState): string | undefined {
  let base = naturalClause(event);
  if (!base) return undefined;

  const anchor = locationTimeAnchor(event);
  if (anchor && !lower(base).includes(lower(anchor))) {
    base = `${base} ${anchor}`;
  }

  const topicShift = event.subject && state.previousTopic && lower(event.subject) !== lower(state.previousTopic);
  if (beat.order > 0 && !/^(?:and|then|by then|looking back|after that|at|on|before|during)\b/i.test(base)) {
    if (topicShift) base = `Then ${base}`;
  }

  return safeFinal(rhetoricalize(base, event, world, beat, state));
}

function rhetoricalize(base: string, event: EventNode, world: World, beat: StoryBeat, state: RealizationState): string {
  const seed = `${world.prompt}|${beat.kind}|${beat.order}|${event.id}|${world.tone}`;
  const lens = lensPhrase(world, event, beat, seed);

  if (world.intent === "record" && beat.order === 0) {
    return base;
  }

  if (beat.kind === "orientation" || beat.kind === "origin") {
    return base;
  }

  if (world.intent === "remember" && beat.kind === "payoff") {
    const anchor = event.place ?? event.time ?? event.object;
    if (anchor) {
      return choose([
        `${base} That was the detail worth keeping from ${anchor}.`,
        `${base} Somehow, ${anchor} became part of what stayed.`,
        `${base} It was the sort of detail a memory keeps.`,
      ], seed) ?? base;
    }
  }

  if (world.intent === "create" && beat.order === 0 && !ACTION.test(base)) {
    return lens ? `${base}. ${lens}` : base;
  }

  if (lens && (beat.kind === "hook" || beat.kind === "encounter" || beat.kind === "challenge" || beat.kind === "escalation")) {
    return `${base}. ${lens}`;
  }

  if (beat.kind === "discovery" || beat.kind === "reveal") {
    return choose([
      `And that was when ${lower(base).replace(/^(?:and\s+that\s+was\s+when\s+)/i, "")}.`,
      `Then ${lower(base)}.`,
      `${base}. That was the detail that changed the reading of everything around it.`,
    ], seed) ?? base;
  }

  if (beat.kind === "transformation") {
    const before = event.order > 0 ? world.events[event.order - 1] : undefined;
    if (before && before.object && event.object && lower(before.object) !== lower(event.object)) {
      return `${base}. The focus had shifted from ${article(before.object)} to ${article(event.object)}.`;
    }
    if (lens) return `${base}. ${lens}`;
  }

  if (beat.kind === "reflection") {
    const topic = event.object ?? event.place ?? event.time ?? event.subject;
    if (topic) {
      return choose([
        `Looking back, ${article(topic)} was the giveaway.`,
        `Looking back, ${article(topic)} was doing more work than it first appeared to.`,
        `By then, ${article(topic)} had become part of what the whole thing meant.`,
      ], seed) ?? base;
    }
  }

  if (beat.kind === "payoff") {
    if (world.tone === "playful") {
      return choose([
        `${base} Somehow, that felt like the part everyone would retell.`,
        `${base} Which was a perfectly good ending until you remembered how it started.`,
        `${base} By then, the original plan had clearly taken a detour.`,
      ], seed) ?? base;
    }
    if (world.tone === "dark") {
      return choose([
        `${base} And that was the part nobody could unsee.`,
        `${base} The explanation could wait. The feeling could not.`,
        `${base} After that, the place did not feel quite as ordinary.`,
      ], seed) ?? base;
    }
    if (world.tone === "cinematic") {
      return choose([
        `${base} By then, the earlier details had acquired a different weight.`,
        `${base} That was when the scattered pieces finally belonged to the same scene.`,
        `${base} Suddenly, the whole sequence felt intentional.`,
      ], seed) ?? base;
    }
  }

  return base;
}

function syntheticCreativeEvent(world: World, beat: StoryBeat, state: RealizationState): string | undefined {
  if (world.intent === "record" || world.intent === "teach" || world.intent === "rescue") return undefined;
  const subject = subjectFor(world, beat);
  const object = world.objects[0];
  const place = world.places[0];
  const time = world.times[0];
  if (!subject && !object && !place) return undefined;

  const seed = `${world.prompt}|synthetic|${beat.kind}|${beat.order}`;
  if (world.tone === "playful") {
    return choose([
      subject && object ? `${subject} and ${article(object)} appeared to have negotiated their terms.` : object ? `${cap(article(object))} was already acting like the main event.` : subject ? `${subject} had somehow acquired the energy of someone who knew the day would become a story.` : undefined,
      place && subject ? `At ${place}, ${subject} suddenly felt less like a subject and more like the center of the whole production.` : undefined,
      time && object ? `${sentence(time)} was when ${article(object)} started feeling suspiciously important.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }
  if (world.tone === "dark") {
    return choose([
      place && subject ? `At ${place}, ${subject} discovered that ordinary had become an unreliable category.` : undefined,
      object ? `${cap(article(object))} became the detail that made the rest of the scene feel wrong.` : undefined,
      subject ? `${subject} had the distinct feeling that the next part had already started.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }
  if (world.tone === "cinematic") {
    return choose([
      place && object ? `At ${place}, ${article(object)} became the visual anchor of the whole scene.` : undefined,
      subject && place ? `${subject} turned ${place} into the kind of place a story could return to.` : undefined,
      time && subject ? `${sentence(time)} became the timestamp the sequence seemed to orbit.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }
  if (world.tone === "warm") {
    return choose([
      object ? `${cap(article(object))} became one of the details that made the story feel lived in.` : undefined,
      place ? `${place} became part of the memory rather than just the setting.` : undefined,
      subject ? `${subject} became the thread that kept the details connected.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }
  return undefined;
}

function buildBeatSequence(world: World, beatCount: number): number[] {
  const n = world.events.length;
  if (!n) return [];
  const ranked = [...world.events].sort((a, b) => b.attention - a.attention).map((event) => event.order);
  const result: number[] = [];
  if (n) result.push(0);

  const target = Math.max(1, beatCount - 2);
  for (const index of ranked) {
    if (result.includes(index)) continue;
    result.push(index);
    if (result.length >= target) break;
  }
  if (n > 1 && !result.includes(n - 1)) result.push(n - 1);
  return unique(result.map(String)).map(Number);
}

function realizeBeat(world: World, beat: StoryBeat, state: RealizationState, plannedEventIndex?: number): string | undefined {
  const event = plannedEventIndex !== undefined ? world.events[plannedEventIndex] : bestEvent(beat, state);

  if (event) {
    const rendered = recordSentence(event, world, beat, state);
    if (rendered && !isCopiedPrompt(rendered, event, world)) {
      markEvent(event, state);
      return rendered;
    }
  }

  const synthetic = syntheticCreativeEvent(world, beat, state);
  if (synthetic) return safeFinal(synthetic);

  const fallbackTopic = world.objects[beat.order % Math.max(1, world.objects.length)] ?? world.places[beat.order % Math.max(1, world.places.length)] ?? world.subjects[0];
  if (fallbackTopic && beat.kind === "continuation") return safeFinal(`There was more to come from ${article(fallbackTopic)}`);
  return undefined;
}

export function createUniversalCognitiveState(prompt: string, plan?: CognitiveExperiencePlan): RealizationState {
  return {
    usedEvidence: new Set<string>(),
    usedPhrases: new Set<string>(),
    previousTopic: undefined,
    lastEvent: undefined,
    world: buildWorld(prompt, plan),
  };
}

export function realizeUniversalCognitiveBeat(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  prompt: string,
  state?: RealizationState,
): string | undefined {
  if (!CLEAN(prompt)) return undefined;
  const runtime = state ?? createUniversalCognitiveState(prompt, plan);

  // Sentence count is controlled by cognition; language realization is not.
  const sequence = buildBeatSequence(runtime.world, Math.max(4, Math.min(8, beat.order + 4)));
  const planned = sequence[beat.order];
  const text = realizeBeat(runtime.world, beat, runtime, planned);
  if (!text) return undefined;

  const canonical = lower(text);
  if (runtime.usedPhrases.has(canonical)) return undefined;
  runtime.usedPhrases.add(canonical);
  return text;
}

export function inspectUniversalCognitiveWorld(
  prompt: string,
  plan?: CognitiveExperiencePlan,
) {
  const world = buildWorld(prompt, plan);
  return {
    intent: world.intent,
    tone: world.tone,
    people: world.people,
    participants: world.participants,
    subjects: world.subjects,
    objects: world.objects,
    places: world.places,
    times: world.times,
    actions: world.actions,
    emotions: world.emotions,
    anchors: world.anchors,
    explicitLenses: world.explicitLenses,
    events: world.events.map((event) => ({
      id: event.id,
      order: event.order,
      raw: event.raw,
      subject: event.subject,
      actor: event.actor,
      action: event.action,
      object: event.object,
      place: event.place,
      time: event.time,
      change: event.change,
      attention: event.attention,
    })),
  };
}
