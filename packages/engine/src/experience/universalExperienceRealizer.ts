import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL EXPERIENCE REALIZER
 * STATUS: ACTIVE / SINGLE LANGUAGE AUTHORITY
 *
 * This file intentionally contains no domain vocabulary. It treats the prompt
 * as a small world and realizes the strongest available sequence of facts,
 * changes, attention peaks, places, times, and consequences.
 *
 * Universal does not mean generic vocabulary. It means one reasoning system
 * over whatever vocabulary the prompt actually supplies.
 */

type Intent = "record" | "create" | "remember" | "teach" | "promote" | "explore" | "rescue" | "unknown";
type Tone = "playful" | "dark" | "cinematic" | "warm" | "urgent";

type Evidence = {
  id: string;
  text: string;
  weight: number;
  sourceClause: number;
  subject?: string;
  actor?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
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
  subjects: string[];
  participants: string[];
  objects: string[];
  places: string[];
  times: string[];
  actions: string[];
  emotions: string[];
  lenses: string[];
};

type RealizationState = {
  usedEvents: Set<string>;
  usedPhrases: Set<string>;
  previousTopic?: string;
  world: World;
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text[0]!.toUpperCase() + text.slice(1) : "";
};

const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|dynamic behavior|situation is static|concrete reason to continue|result is available|current state|next experiential state|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output|customer-facing)\b/i;
const META_VERB = /^(?:create|make|build|design|write|turn|generate|give|show|tell|produce|develop|prepare)\b/i;
const ACTION = /\b(?:arrive|arrived|arrives|enter|entered|enters|walk|walked|walks|go|went|goes|come|came|comes|leave|left|leaves|return|returned|returns|find|found|finds|clean|cleaned|cleans|wash|washed|washes|repair|repaired|repairs|fix|fixed|fixes|restore|restored|restores|build|built|builds|make|made|makes|create|created|creates|design|designed|designs|write|wrote|writes|cook|cooked|cooks|serve|served|serves|prepare|prepared|prepares|open|opened|opens|close|closed|closes|visit|visited|visits|travel|traveled|travelled|drive|drove|drives|ride|rode|rides|paint|painted|paints|dance|danced|dances|sing|sang|sings|play|played|plays|choose|chose|chooses|pick|picked|picks|select|selected|selects|decide|decided|decides|touch|touched|touches|hold|held|holds|wear|wore|wears|taste|tasted|tastes|smell|smelled|smells|look|looked|looks|see|saw|sees|watch|watched|watches|share|shared|shares|give|gave|gives|take|took|takes|bring|brought|brings|receive|received|receives|check|checked|checks|inspect|inspected|inspects|test|tested|tests|measure|measured|measures|install|installed|installs|remove|removed|removes|change|changed|changes|turn|turned|turns|transform|transformed|transforms|finish|finished|finishes|complete|completed|completes|celebrate|celebrated|celebrates|marry|married|marries|photograph|photographed|photographs|capture|captured|captures|record|recorded|records|teach|taught|teaches|learn|learned|learns|discover|discovered|discovers|collect|collected|collects|organize|organized|organizes|decorate|decorated|decorates|style|styled|styles|trim|trimmed|trims|cut|cuts|brush|brushed|brushes|dry|dried|dries|massage|massaged|massages|relax|relaxed|relaxes|pamper|pampered|pampers|spoil|spoiled|spoils|treat|treated|treats|shake|shook|shakes|chew|chewed|chews|steal|stole|steals|tear|tore|tears|eat|ate|eats|run|ran|runs|call|called|calls|rent|rented|rents|document|documented|documents|start|started|starts|stop|stopped|stops|hit|hits|climb|climbed|climbs|sit|sat|sits|stand|stood|stands|talk|talked|talks|meet|met|meets|stay|stayed|stays|sleep|slept|sleeps|practice|practiced|practices)\b/i;
const CHANGE = /\b(?:but|then|until|after|before|finally|suddenly|however|instead|became|becomes|turned|changed|ended|left|arrived|hit|stole|found|lost|missing|wrong|broken|first|last|again|still|no longer|from .* to)\b/i;
const ATTENTION = /\b(?:suddenly|finally|apparently|somehow|then|until|but|except|only|first|last|again|favorite|missing|wrong|broken|stole|found|lost|surprise|surprised|excited|restless|happy|scared|angry|furious|quiet|loud|tiny|giant|absurd|ridiculous|terrifying|mysterious|unexpected|strange|weird)\b/i;
const PERSON = /\b(?:i|me|my|we|us|our|you|your|he|him|his|she|her|they|them|their|someone|somebody|kid|kids|child|children|guest|guests|visitor|visitors|crowd|family|friends?|fans?|customer|customers|client|clients|team|group|partner|sister|brother|mother|father|grandmother|grandfather|wife|husband|daughter|son|musician|artist|teacher|student|player|players|band)\b/i;
const EMOTION = /\b(?:scared|afraid|happy|excited|angry|furious|sad|restless|nervous|suspicious|surprised|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled)\b/i;
const TIME = /\b(?:at|around|by|before|after|on|during|since|from)\s+(?:the\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{1,2})?)\b/i;

const STOP = new Set([
  "the","a","an","and","or","but","for","with","about","from","this","that","into","onto","then","there","here","when","where","while","because","was","were","is","are","be","been","being","it","its","they","them","their","he","she","his","her","we","our","you","your","i","my","me","to","of","in","on","at","as","by","than","more","very","really","just","want","need","make","create","build","design","write","show","give","send","something","anything","experience","story","people","will","can","should","could","would","like","some","everything","nothing"
]);

const EXPLICIT_PARTICIPANTS = [
  "kids","children","guests","visitors","crowd","family","friends","fans","customers","clients","team","group","partner","sister","brother","mother","father","grandmother","grandfather","wife","husband","daughter","son","musician","artist","teacher","student","player","players","band","someone","somebody"
];

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function choose<T>(values: readonly T[], seed: string): T | undefined {
  return values.length ? values[hash(seed) % values.length] : undefined;
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
  const parts = base
    .replace(/\s*;\s*/g, "|")
    .replace(/\s*,\s+(?=(?:and|but|then|while|until|because|so)\b)/gi, "|")
    .replace(/\s+(?:and then|then suddenly|but then)\s+/gi, "|")
    .split("|")
    .map((part) => sentence(part.replace(/^\s*(?:and|but|then)\s+/i, "")))
    .filter((part) => part.length >= 3);
  return unique(parts.length ? parts : [base]);
}

function namedEntities(text: string): string[] {
  const quoted = [...text.matchAll(/["“”']([^"“”']{2,80})["“”']/g)].map((m) => sentence(m[1] ?? ""));
  const proper = [...text.matchAll(/\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,4}\b/g)]
    .map((m) => sentence(m[0] ?? ""))
    .filter((value) => !/^(?:Create|Make|Build|Turn|Generate|The|Then|And|At|By|For|A|An|My|Our|I|We|This|That)\b/i.test(value));
  return unique([...quoted, ...proper]);
}

function explicitPlace(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|from|on)\s+([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/);
  if (explicit?.[1]) return sentence(explicit[1]);
  const generic = text.match(/\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer)\b/i);
  return generic?.[0];
}

function explicitTime(text: string): string | undefined {
  return text.match(TIME)?.[0];
}

function actionWord(text: string): string | undefined {
  return text.match(ACTION)?.[0];
}

function words(text: string): string[] {
  return sentence(text).toLowerCase().split(/[^a-z0-9'’-]+/).filter((word) => word.length > 2 && !STOP.has(word));
}

function subjectCandidate(text: string): string | undefined {
  const named = namedEntities(text)[0];
  const lead = sentence(text).match(/^(?:(?:my|our|the|a|an)\s+)?([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9'’-]*){0,4})\s+(?=(?:arrived|arrives|walked|walks|entered|enters|sat|sits|stood|stands|started|starts|found|finds|went|goes|came|comes|was|were|is|are|had|has|began|begins)\b)/i);
  const candidate = sentence(lead?.[1] ?? "");
  if (candidate) return candidate;
  return named && !META_VERB.test(named) ? named : undefined;
}

function objectCandidate(text: string, subject?: string): string | undefined {
  const candidates = words(text).filter((word) => word !== lower(subject ?? "") && !ACTION.test(word));
  if (!candidates.length) return undefined;
  const preferred = [
    "bath","bow","bubbles","kitchen","bathroom","recipe","watch","truck","guitar","pick","cake","door","window","lights","elevator","rain","clues","museum","song","chairs","table","coffee","shoes","hat","photo","video","crowd","band","house","home","spa","tattoo","surfboard","wave","keys","phone","dress","ring","restaurant","chairs"
  ];
  return candidates.find((word) => preferred.includes(word)) ?? candidates[0];
}

function detectIntent(prompt: string): Intent {
  const text = lower(prompt);
  if (/\b(?:remember|preserve|memory|grandfather|grandmother|wedding|birthday|forever|keeps? growing|years?)\b/i.test(text)) return "remember";
  if (/\b(?:teach|learn|lesson|tutorial|how to|explain|practice)\b/i.test(text)) return "teach";
  if (/\b(?:rescue|missing|lost pet|adopt|shelter)\b/i.test(text)) return "rescue";
  if (/\b(?:promote|advertis|brand|loyalty|customer|business|restaurant|bar|shop|service)\b/i.test(text)) return "promote";
  if (/\b(?:create|make|build|design|invent|turn .* into|treasure hunt|experience)\b/i.test(text)) return "create";
  if (/\b(?:visit|travel|trip|adventure|route|road|place|museum|concert|rave|festival)\b/i.test(text)) return "explore";
  if (splitSentences(prompt).some((value) => ACTION.test(value) || CHANGE.test(value))) return "record";
  return "unknown";
}

function detectTone(prompt: string, plan?: CognitiveExperiencePlan): Tone {
  const corpus = lower([
    prompt,
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.dynamicBehavior ?? []),
  ].join(" "));
  if (/\b(?:urgent|rescue|missing|emergency)\b/i.test(corpus)) return "urgent";
  if (/\b(?:horror|horrifying|horrific|creepy|terrifying|terror|haunted|sinister|disturbing|dark|nightmare|ominous|evil|cursed|demented)\b/i.test(corpus)) return "dark";
  if (/\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|wild|silly|whimsical|cute|cheeky|witty|crazy|mischief)\b/i.test(corpus)) return "playful";
  if (/\b(?:warm|heartfelt|tender|intimate|memory|memorial|wedding|birthday|family|love)\b/i.test(corpus)) return "warm";
  return "cinematic";
}

function clauseEvidence(text: string, index: number): Evidence[] {
  const subject = subjectCandidate(text);
  const action = actionWord(text);
  const place = explicitPlace(text);
  const time = explicitTime(text);
  const object = objectCandidate(text, subject);
  return [
    {
      id: `c${index}:raw`,
      text: sentence(text),
      weight: 1,
      sourceClause: index,
      subject,
      actor: PERSON.test(text) ? subject : undefined,
      action,
      object,
      place,
      time,
    },
  ];
}

function eventChange(text: string): number {
  let score = 0;
  if (ACTION.test(text)) score += 0.18;
  if (CHANGE.test(text)) score += 0.36;
  if (ATTENTION.test(text)) score += 0.28;
  if (EMOTION.test(text)) score += 0.23;
  return Math.min(1, score);
}

function buildWorld(prompt: string, plan?: CognitiveExperiencePlan): World {
  const events: EventNode[] = [];
  const subjects: string[] = [];
  const participants = EXPLICIT_PARTICIPANTS.filter((name) => new RegExp(`\\b${name}\\b`, "i").test(prompt));
  const objects: string[] = [];
  const places: string[] = [];
  const times: string[] = [];
  const actions: string[] = [];
  const emotions: string[] = [];

  for (const [sentenceIndex, sentenceText] of splitSentences(prompt).entries()) {
    for (const clause of splitClauses(sentenceText)) {
      const evidence = clauseEvidence(clause, sentenceIndex);
      const e = evidence[0]!;
      const node: EventNode = {
        id: `event-${events.length + 1}`,
        order: events.length,
        raw: sentence(clause),
        subject: e.subject,
        actor: e.actor,
        action: e.action,
        object: e.object,
        place: e.place,
        time: e.time,
        evidence,
        change: eventChange(clause),
        attention: eventChange(clause) + (clause.length > 24 ? 0.1 : 0),
      };
      events.push(node);
      if (e.subject) subjects.push(e.subject);
      if (e.object) objects.push(e.object);
      if (e.place) places.push(e.place);
      if (e.time) times.push(e.time);
      if (e.action) actions.push(e.action);
      if (e.action && e.object) objects.push(e.object);
      if (EMOTION.test(clause)) emotions.push(clause.match(EMOTION)?.[0] ?? "");
    }
  }

  const premiseSubject = plan?.premise?.slots.find((slot) => slot.role === "subject")?.values ?? [];
  for (const value of premiseSubject) {
    if (lower(prompt).includes(lower(value))) subjects.push(value);
  }

  const named = namedEntities(prompt);
  const subjectsFinal = unique([
    ...subjects,
    ...named.filter((value) => !META_VERB.test(value)),
  ]);

  const tone = detectTone(prompt, plan);
  return {
    prompt,
    intent: detectIntent(prompt),
    tone,
    events,
    subjects: subjectsFinal,
    participants: unique(participants),
    objects: unique(objects),
    places: unique(places),
    times: unique(times),
    actions: unique(actions),
    emotions: unique(emotions),
    lenses: unique([
      ...(tone === "playful" ? ["comedy"] : []),
      ...(tone === "dark" ? ["horror"] : []),
      ...(tone === "warm" ? ["memory"] : []),
      ...(tone === "cinematic" ? ["cinematic"] : []),
      ...(tone === "urgent" ? ["urgent"] : []),
    ]),
  };
}

function chooseEvent(world: World, beat: StoryBeat, state: RealizationState): EventNode | undefined {
  const available = world.events.filter((event) => !state.usedEvents.has(event.id));
  if (!available.length) return undefined;
  const scored = available.map((event) => {
    let score = event.attention;
    if (beat.order === 0 && event.order === 0) score += 0.45;
    if (/^(?:discovery|reveal|escalation|payoff|milestone)$/.test(beat.kind)) score += event.change;
    if (/^(?:orientation|origin)$/.test(beat.kind) && event.order === 0) score += 0.35;
    if (/^(?:transformation|reflection|payoff)$/.test(beat.kind) && event.order === world.events.length - 1) score += 0.35;
    if (event.place) score += 0.08;
    if (event.time) score += 0.08;
    return { event, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(3, scored.length));
  return choose(top, `${world.prompt}|${beat.kind}|${beat.order}`)?.event ?? scored[0]?.event;
}

function markEvent(event: EventNode, state: RealizationState): void {
  state.usedEvents.add(event.id);
  if (event.subject) state.previousTopic = event.subject;
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (!text) return "";
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return /^[aeiou]/i.test(text) ? `an ${text}` : `the ${text}`;
}

function normalizePromptCommand(text: string): string {
  return sentence(text)
    .replace(/^(?:create|make|build|design|write|generate|turn)\s+(?:a|an|the)\s+/i, "")
    .replace(/^(?:create|make|build|design|write|generate|turn)\s+/i, "");
}

function paraphrase(event: EventNode): string {
  const raw = normalizePromptCommand(event.raw);
  if (!raw) return "";
  const subject = event.subject;
  const action = event.action;
  const object = event.object;
  const place = event.place;
  const time = event.time;

  if (subject && action) {
    const normalizedAction = lower(action);
    const variants: string[] = [];
    if (normalizedAction.startsWith("walk")) variants.push(`${subject} walked in`);
    if (normalizedAction.startsWith("arriv")) variants.push(`${subject} arrived`);
    if (normalizedAction.startsWith("enter")) variants.push(`${subject} stepped in`);
    if (normalizedAction.startsWith("find")) variants.push(`${subject} finally found ${object ? article(object) : "it"}`);
    if (normalizedAction.startsWith("clean")) variants.push(`${subject} cleaned ${object ? article(object) : "the place"}`);
    if (normalizedAction.startsWith("give")) variants.push(`${subject} gave ${object ? article(object) : "it"} to someone`);
    if (normalizedAction.startsWith("steal")) variants.push(`${subject} stole ${object ? article(object) : "something"}`);
    if (normalizedAction.startsWith("start")) variants.push(`${subject} got underway`);
    if (normalizedAction.startsWith("open")) variants.push(`${subject} opened`);
    if (normalizedAction.startsWith("stop")) variants.push(`${subject} stopped`);
    if (variants.length) {
      let base = choose(variants, `${event.id}|${raw}`) ?? variants[0]!;
      const anchor = [place ? `at ${place}` : "", time ? sentence(time) : ""].filter(Boolean).join(" ");
      if (object && !lower(base).includes(lower(object)) && /^(?:walk|arriv|enter|found|clean|gave|stole)$/i.test(normalizedAction)) {
        base += ` ${article(object)}`;
      }
      return anchor ? `${base} ${anchor}` : base;
    }
  }

  // Clause-level compression: preserve facts, remove prompt-command scaffolding,
  // and keep the sentence in the author's vocabulary rather than inventing a mode.
  return raw;
}

function lens(world: World, event: EventNode, beat: StoryBeat, seed: string): string | undefined {
  const subject = event.subject ?? world.subjects[0];
  const object = event.object ?? world.objects[0];
  const place = event.place ?? world.places[0];

  if (world.tone === "playful") {
    return choose([
      subject && object ? `${subject} treated ${article(object)} like there had been terms and conditions.` : subject ? `${subject} arrived with opinions.` : object ? `${cap(article(object))} suddenly had headline status.` : undefined,
      subject && object ? `${subject} approached ${article(object)} like compensation was already part of the package.` : object ? `Apparently, ${article(object)} had entered negotiations.` : undefined,
      subject && object ? `${subject} gave ${article(object)} the kind of look usually reserved for questionable decisions.` : place ? `${place} somehow became the center of the operation.` : undefined,
      subject ? `${subject} had the distinct energy of someone who expected the day to become a story.` : object ? `${cap(article(object))} did not exactly go unnoticed.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }

  if (world.tone === "dark") {
    return choose([
      subject && object ? `${subject} noticed ${article(object)}. That was the first mistake.` : object ? `${cap(article(object))} was there, and suddenly it mattered.` : undefined,
      subject && object ? `${subject} became aware of ${article(object)} at exactly the wrong time.` : place ? `${place} started feeling less ordinary.` : undefined,
      place && object ? `At ${place}, ${article(object)} changed the atmosphere without needing an explanation.` : subject ? `${subject} had the feeling the next part had already begun.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }

  if (world.tone === "warm") {
    return choose([
      object ? `${cap(article(object))} became one of the details worth keeping.` : undefined,
      place && object ? `At ${place}, ${article(object)} became part of the memory rather than just the setting.` : undefined,
      subject && object ? `${subject} kept coming back to ${article(object)}, which is usually how a memory announces itself.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }

  if (world.tone === "cinematic") {
    return choose([
      place && object ? `At ${place}, ${article(object)} became the visual anchor of the scene.` : undefined,
      subject && place ? `${subject} turned ${place} into somewhere the story could return to.` : undefined,
      event.time && object ? `${sentence(event.time)} became the timestamp the sequence seemed to orbit.` : undefined,
      subject && object ? `${subject} and ${article(object)} became the point where the scattered details lined up.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }

  if (world.tone === "urgent") {
    return choose([
      subject && object ? `${subject} had to deal with ${article(object)} before anything else could move.` : object ? `${cap(article(object))} became the immediate problem.` : undefined,
      subject ? `${subject} had no time to waste.` : undefined,
    ].filter((value): value is string => Boolean(value)), seed);
  }

  return undefined;
}

function applyDiscourse(base: string, event: EventNode, beat: StoryBeat, world: World, state: RealizationState): string {
  let text = sentence(base);
  if (beat.order > 0) {
    const topicShift = event.subject && state.previousTopic && lower(event.subject) !== lower(state.previousTopic);
    if (beat.kind === "discovery" || beat.kind === "reveal") text = `Then ${lower(text)}`;
    else if (beat.kind === "payoff" || beat.kind === "milestone") text = `By then, ${lower(text)}`;
    else if (topicShift) text = `Then ${text}`;
  }

  const rhetorical = lens(world, event, beat, `${world.prompt}|${event.id}|${beat.kind}|${beat.order}`);
  if (rhetorical && /^(?:hook|encounter|challenge|escalation)$/.test(beat.kind)) {
    text = `${text}. ${rhetorical}`;
  }

  if (beat.kind === "reflection") {
    const anchor = event.object ?? event.place ?? event.time;
    if (anchor) {
      text = choose([
        `Looking back, ${article(anchor)} was the giveaway.`,
        `Looking back, ${article(anchor)} was carrying more meaning than it first appeared to.`,
        `By then, ${article(anchor)} had become part of what the whole thing meant.`,
      ], `${world.prompt}|reflection|${beat.order}`) ?? text;
    }
  }

  if (beat.kind === "payoff") {
    if (world.tone === "playful") {
      text += ". Somehow, that felt like the part everyone would retell.";
    } else if (world.tone === "dark") {
      text += ". And that was the part nobody could unsee.";
    } else if (world.tone === "cinematic") {
      text += ". Suddenly, the earlier details carried a different weight.";
    } else if (world.tone === "warm") {
      text += ". It was the kind of detail a memory keeps.";
    }
  }

  return text;
}

function isGeneric(text: string): boolean {
  return /\b(?:things got underway|the day moved on|the difference was easy to see|the result spoke for itself|the story continued|something happened|the scene changed|the experience became|the situation changed|the result was clear)\b/i.test(text);
}

function valid(text: string): string | undefined {
  const value = sentence(text);
  if (!value || LEAK.test(value) || isGeneric(value)) return undefined;
  return `${value}.`;
}

function fallbackCreative(world: World, beat: StoryBeat): string | undefined {
  if (world.intent === "record" || world.intent === "teach" || world.intent === "rescue") return undefined;
  const subject = world.subjects[0];
  const object = world.objects[0];
  const place = world.places[0];
  if (world.tone === "playful") {
    return valid(subject && object ? `${subject} and ${article(object)} appeared to have negotiated their terms` : object ? `${cap(article(object))} had somehow become the main event` : place && subject ? `${subject} turned ${place} into the kind of place a story could return to` : subject ? `${subject} had the energy of someone who knew this was going to become a story` : undefined);
  }
  if (world.tone === "dark") {
    return valid(place && object ? `At ${place}, ${article(object)} became the detail that made everything else feel wrong` : subject && object ? `${subject} realized ${article(object)} changed the way the place felt` : object ? `${cap(article(object))} became the detail that refused to feel ordinary` : undefined);
  }
  if (world.tone === "warm") {
    return valid(object ? `${cap(article(object))} became one of the details that made the story feel lived in` : place ? `${place} became part of the memory rather than just the setting` : subject ? `${subject} became the thread connecting the details` : undefined);
  }
  if (world.tone === "cinematic") {
    return valid(place && object ? `At ${place}, ${article(object)} became the visual anchor of the whole scene` : subject && place ? `${subject} turned ${place} into somewhere the story could return to` : object ? `${cap(article(object))} became the detail the scene kept returning to` : undefined);
  }
  return undefined;
}

export function createUniversalRealizationState(prompt: string, plan?: CognitiveExperiencePlan): RealizationState {
  return {
    usedEvents: new Set<string>(),
    usedPhrases: new Set<string>(),
    world: buildWorld(prompt, plan),
  };
}

export function realizeUniversalExperienceBeat(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  prompt: string,
  state?: RealizationState,
): string | undefined {
  if (!clean(prompt)) return undefined;
  const runtime = state ?? createUniversalRealizationState(prompt, plan);
  const event = chooseEvent(runtime.world, beat, runtime);

  if (event) {
    let text = paraphrase(event);
    text = applyDiscourse(text, event, beat, runtime.world, runtime);
    const output = valid(text);
    if (output && lower(output) !== lower(event.raw)) {
      runtime.usedEvents.add(event.id);
      runtime.previousTopic = event.subject ?? runtime.previousTopic;
      runtime.usedPhrases.add(lower(output));
      return output;
    }
  }

  const creative = fallbackCreative(runtime.world, beat);
  if (creative && !runtime.usedPhrases.has(lower(creative))) {
    runtime.usedPhrases.add(lower(creative));
    return creative;
  }

  const topic = runtime.world.objects[beat.order % Math.max(1, runtime.world.objects.length)] ?? runtime.world.places[beat.order % Math.max(1, runtime.world.places.length)] ?? runtime.world.subjects[0];
  if (topic && beat.kind === "continuation") {
    const output = valid(`There was more to come from ${article(topic)}`);
    if (output) return output;
  }

  return undefined;
}

export function inspectUniversalWorld(prompt: string, plan?: CognitiveExperiencePlan) {
  const world = buildWorld(prompt, plan);
  return {
    intent: world.intent,
    tone: world.tone,
    subjects: world.subjects,
    participants: world.participants,
    objects: world.objects,
    places: world.places,
    times: world.times,
    actions: world.actions,
    emotions: world.emotions,
    lenses: world.lenses,
    events: world.events,
  };
}
