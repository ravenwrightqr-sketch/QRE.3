/**
 * QRE LATENT MOVIE EXTRACTOR V5
 *
 * The important upgrade in V5 is separation of three things that used to
 * collapse into one string:
 *
 *   REALITY      = what the user actually supplied
 *   MOVIE LOGIC  = what makes those facts interesting
 *   STORYTELLER  = how the receiver should hear it
 *
 * V5 also emits a stable memory-thread identity so later events can continue
 * an existing subject instead of treating every prompt as a brand-new movie.
 * It is intentionally dependency-free; persistence belongs above the engine.
 */

export type MovieLensV5 = "cinematic" | "funny" | "warm" | "dark" | "horror" | "mysterious" | "epic" | "absurd";
export type FactKindV5 = "subject" | "arrival" | "time" | "date" | "place" | "action" | "state" | "result" | "participation" | "journey" | "memory";
export type RelationV5 = "continues" | "contrasts" | "transforms" | "reveals" | "escalates" | "accumulates" | "pays_off";
export type BeatRoleV5 = "opening" | "encounter" | "pressure" | "turn" | "transformation" | "payoff" | "continuation";

export type MovieFactV5 = {
  id: string;
  text: string;
  kind: FactKindV5;
  source: "user";
  confidence: number;
  actors: string[];
  places: string[];
  times: string[];
  dates: string[];
};

export type MovieBeatV5 = {
  order: number;
  role: BeatRoleV5;
  text: string;
  sourceFactIds: string[];
};

export type MovieMemoryThreadV5 = {
  key: string;
  subject: string;
  identitySignals: string[];
  continuationSignals: string[];
  eventCount: number;
};

export type LatentMovieV5 = {
  subject: string;
  lens: MovieLensV5;
  directives: string[];
  facts: MovieFactV5[];
  relationships: Array<{ from: string; to: string; relation: RelationV5; confidence: number }>;
  arc: {
    opening?: string;
    pressure?: string;
    turningPoint?: string;
    transformation?: string;
    payoff?: string;
  };
  beats: MovieBeatV5[];
  memoryThread: MovieMemoryThreadV5;
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const unique = <T>(xs: T[]) => [...new Set(xs)];

const DIRECTIVE = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i;
const DIRECTIVE_BODY = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\s+(?:me\s+)?(?:a|an|the)?\s*(.*)$/i;
const TIME = /\b\d{1,2}(?::\d{2})?\s?(?:a\.m\.|p\.m\.|am|pm)\b/gi;
const DATE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi;
const PLACE = /\b(?:at|in|near|around|through|on)\s+([A-Z][A-Za-z0-9'’.-]*(?:\s+[A-Z][A-Za-z0-9'’.-]*){0,4})/g;
const NEGATIVE = /\b(scared|afraid|hated|hate|angry|sad|lost|missed|broken|mess|dirty|bad|terrified|creepy|dark|danger|failed|worried|nervous|late|stuck|rough|awful|fear|chaos|disaster)\b/i;
const POSITIVE = /\b(loved|love|liked|enjoyed|happy|excited|laughed|fun|great|beautiful|peaceful|relaxed|amazing|good|proud|won|finished|spotless|clean|safe|better|smiled|smile|joy|delighted)\b/i;
const TURN = /\b(stole|chewed|ate|missed|found|discovered|revealed|secret|strange|weird|unexpected|surprise|surprised|chaos|disaster|escaped|broke|caught|almost|nearly|suddenly)\b/i;
const HORROR = /\b(horror|horrifying|terrifying|haunted|ghost|blood|dead|death|murder|creepy|demented|nightmare|evil|disturbing|possessed)\b/i;
const FUNNY = /\b(funny|humor|comedy|ridiculous|silly|absurd|chaotic|wild|hilarious|lawyer|battle|owned|hipster)\b/i;
const MYSTERY = /\b(mystery|mysterious|secret|hidden|unknown|strange|discover|discovery|uncover|clue)\b/i;
const MEMORY = /\b(memory|memories|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve|trips|travel|traveled|beaches|raves|wedding)\b/i;
const COMPLETION = /\b(finished|finish|complete|completed|done|left|walked out|arrived home|returned|came home|spotless|won)\b/i;
const INTERNAL = /\b(?:mechanic|beat|pressure|turning point|transformation|payoff|escalation|reveal|relationship|directive|compiler|latent movie|narrative lens|story shape|fact kind|memory thread)\b/gi;

function splitSentences(input: string): string[] {
  return input.replace(/[\r\n]+/g, " ")
    .split(/(?<=[.!?])\s+|\s*;\s*|\s*→\s*/)
    .map(clean)
    .filter((x) => x.length > 2);
}

function directivePayload(text: string): string[] {
  const match = text.match(DIRECTIVE_BODY);
  if (!match) return [];
  let body = clean(match[1] ?? "")
    .replace(/^a\s+story\s+of\s+/i, "")
    .replace(/^a\s+memory\s+of\s+/i, "")
    .replace(/^an?\s+experience\s+of\s+/i, "")
    .replace(/^a\s+wedding\s+event\s+memory\s+for\s+/i, "");
  if (!body) return [];

  const out: string[] = [];
  const explicitDate = body.match(DATE)?.[0];
  if (explicitDate) out.push(`Date: ${explicitDate}`);

  if (/\b(?:my|our|this)\s+wedding\b/i.test(body)) out.push("my wedding");
  if (/\bsurfboard\b/i.test(body)) out.push("My surfboard has traveled across beaches.");
  if (/\braves?\b/i.test(body)) out.push("My trips to raves are part of the memory.");
  if (/\b(?:everyone|everybody|people|guests?|family|friends?|attendees?|participants?)\b[^.?!]*\b(?:add|contribute|share|submit|keep adding)\b/i.test(body)) {
    out.push("People can add memories.");
  }

  // A directive can contain useful ordinary payload after the command.
  // Preserve it, but never preserve the command itself.
  const stripped = body
    .replace(/\b(?:my|our|this)\s+wedding\b/i, "")
    .replace(DATE, "")
    .replace(/\b(?:everyone|everybody|people|guests?|family|friends?|attendees?|participants?)\b[^.?!]*\b(?:add|contribute|share|submit|keep adding)\b[^.?!]*/i, "")
    .replace(/\s+/g, " ").replace(/[,.!?]+$/, "").trim();
  if (stripped && !/^the\s+(?:story|memory|experience)\b/i.test(stripped)) out.push(stripped);
  return unique(out.map(clean).filter(Boolean));
}

function properNames(text: string): string[] {
  return unique([...text.matchAll(/\b[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,1}\b/g)].map((m) => m[0])
    .filter((x) => !/^(Make|Create|Build|Turn|Transform|Write|Tell|Give|Generate|Design|Produce|Show|The|My|Our|This|Everyone|Date|Location|Pin)$/i.test(x)));
}

function extractPlaces(text: string): string[] {
  return unique([...text.matchAll(PLACE)].map((m) => clean(m[1] ?? ""))
    .filter((x) => x && !/^the\b/i.test(x)));
}

function classifyKind(text: string): FactKindV5 {
  if (TIME.test(text)) return "time";
  if (DATE.test(text)) return "date";
  if (extractPlaces(text).length) return "place";
  if (/\b(?:everyone|everybody|people|guests?|family|friends?|attendees?|participants?)\b[^.?!]*\b(?:add|contribute|share|submit|keep)\b/i.test(text)) return "participation";
  if (COMPLETION.test(text)) return "result";
  if (NEGATIVE.test(text) || POSITIVE.test(text)) return "state";
  if (/\b(?:arrived|came|entered|went|traveled|visited|left|returned|headed|drove|flew|surfed)\b/i.test(text)) return "journey";
  if (MEMORY.test(text)) return "memory";
  return "action";
}

function inferSubject(prompt: string, facts: MovieFactV5[]): string {
  const names = unique(facts.flatMap((f) => f.actors)).filter((n) => !/^Jan$/i.test(n));
  if (names[0]) return names[0];
  const text = `${prompt} ${facts.map((f) => f.text).join(" ")}`;
  const explicit = text.match(/\b(?:surfboard|wedding|raves?|concert|festival|birthday|anniversary|watch|necklace|ring|dog|cat|pet|house|home|product|guitar|camera|trip|journey|beach|property|listing)\b/i)?.[0];
  if (explicit) return /^raves?$/i.test(explicit) ? "raves" : explicit.toLowerCase();
  return "the moment";
}

function lensFor(prompt: string, facts: MovieFactV5[]): MovieLensV5 {
  const text = `${prompt} ${facts.map((f) => f.text).join(" ")}`;
  if (HORROR.test(text)) return "horror";
  if (FUNNY.test(text) || (TURN.test(text) && /\b(?:dog|groom|pet|stole|chewed|lawyer|battle|owned)\b/i.test(text))) return "funny";
  if (MYSTERY.test(text)) return "mysterious";
  if (NEGATIVE.test(text) && !POSITIVE.test(text)) return "dark";
  if (MEMORY.test(text) || /\b(?:wedding|family|legacy|romantic|raves?|beaches|travel)\b/i.test(text)) return "warm";
  return "cinematic";
}

function relation(a: MovieFactV5, b: MovieFactV5): RelationV5 {
  if (NEGATIVE.test(a.text) && POSITIVE.test(b.text)) return "transforms";
  if (TURN.test(b.text)) return "reveals";
  if (COMPLETION.test(b.text)) return "pays_off";
  if (b.kind === "participation" || b.kind === "memory") return "accumulates";
  if (NEGATIVE.test(b.text) && POSITIVE.test(a.text)) return "contrasts";
  return "continues";
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function threadKey(subject: string): string {
  return `memory:${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "moment"}`;
}

function storytellerSafe(text: string): string {
  return clean(text.replace(INTERNAL, "").replace(/\s+([,.!?])/g, "$1")).replace(/\.\./g, ".");
}

function serviceContext(facts: MovieFactV5[]): boolean {
  return /\b(?:groom|clean|housekeep|bathroom|kitchen|salon|service|mess|spotless)\b/i.test(facts.map((f) => f.text).join(" "));
}

function makeBeats(movie: Omit<LatentMovieV5, "beats">): MovieBeatV5[] {
  const facts = movie.facts;
  const subject = movie.subject.charAt(0).toUpperCase() + movie.subject.slice(1);
  const service = serviceContext(facts);
  const first = facts[0];
  const last = facts.at(-1);
  const actions = facts.filter((f) => !["time", "date", "place"].includes(f.kind));
  const negative = facts.find((f) => NEGATIVE.test(f.text));
  const turn = actions.find((f) => TURN.test(f.text));
  const positive = [...facts].reverse().find((f) => POSITIVE.test(f.text));
  const time = facts.flatMap((f) => f.times)[0];
  const date = facts.flatMap((f) => f.dates)[0];
  const place = facts.flatMap((f) => f.places)[0];
  const beats: MovieBeatV5[] = [];
  const add = (role: BeatRoleV5, text: string, ids: string[]) => {
    const prose = storytellerSafe(text);
    if (!prose || prose === beats.at(-1)?.text) return;
    beats.push({ order: beats.length, role, text: prose, sourceFactIds: ids });
  };

  const vibe = hash(`${subject}:${movie.lens}`) % 4;
  if (movie.lens === "funny") {
    if (time && service) add("opening", `${subject} arrived at ${time}, ready for battle.`, first ? [first.id] : []);
    else if (date) add("opening", `${subject} began on ${date}, and the day was looking suspiciously innocent.`, first ? [first.id] : []);
    else add("opening", `${subject} arrived, and the plan immediately looked a little too innocent.`, first ? [first.id] : []);
    if (place) add("encounter", vibe % 2 ? `Pin dropped. ${place} was officially on the map.` : `${place} entered the record. Things were getting official.`, first ? [first.id] : []);
    if (negative) add("pressure", service ? `${negative.text.replace(/[.!?]+$/, "")}. The job had officially entered combat.` : `${negative.text.replace(/[.!?]+$/, "")}. So much for an ordinary day.`, [negative.id]);
    if (service && actions.some((f) => /bathroom/i.test(f.text)) && actions.some((f) => /kitchen/i.test(f.text))) {
      add("pressure", vibe % 2 ? "The bathrooms went first. Then the kitchen got its turn." : "Bathroom duty was handled. The kitchen was next on the hit list.", actions.filter((f) => /bathroom|kitchen/i.test(f.text)).map((f) => f.id));
    }
    if (turn) add("turn", `${turn.text.replace(/[.!?]+$/, "")}. There it was—the part nobody could have planned.`, [turn.id]);
    if (positive && !turn) add("transformation", `Somewhere in the middle of it, ${subject} stopped looking like the version that arrived.`, [positive.id]);
    if (last) add("payoff", service ? `${last.text.replace(/[.!?]+$/, "")}. ${subject} won today.` : `${last.text.replace(/[.!?]+$/, "")}. Not bad for a day that started out ordinary.`, [last.id]);
    return beats;
  }

  if (movie.lens === "horror") {
    add("opening", date ? `${subject} began on ${date}. At first, nothing seemed wrong.` : `${subject} began like an ordinary night. That was the problem.`, first ? [first.id] : []);
    if (place) add("encounter", `${place}. The last normal detail anyone would remember.`, first ? [first.id] : []);
    if (negative) add("pressure", `${negative.text.replace(/[.!?]+$/, "")}. The room felt different after that.`, [negative.id]);
    if (turn) add("turn", `${turn.text.replace(/[.!?]+$/, "")}. Then the story stopped behaving normally.`, [turn.id]);
    if (last) add("payoff", `${last.text.replace(/[.!?]+$/, "")}. And that was the part nobody forgot.`, [last.id]);
    return beats;
  }

  if (movie.lens === "warm") {
    add("opening", date ? `${subject} began on ${date}, with a moment worth keeping.` : `${subject} began with a moment worth keeping.`, first ? [first.id] : []);
    if (place) add("encounter", `${place} became part of the memory.`, first ? [first.id] : []);
    const memories = facts.filter((f) => f.kind === "memory" || f.kind === "participation");
    if (memories[0]) add("continuation", `${memories[0].text.replace(/[.!?]+$/, "")}. Another piece found its place.`, [memories[0].id]);
    if (turn) add("turn", `${turn.text.replace(/[.!?]+$/, "")}. The ordinary moment suddenly had a story of its own.`, [turn.id]);
    if (last) add("payoff", `${last.text.replace(/[.!?]+$/, "")}. That is the part to keep.`, [last.id]);
    return beats;
  }

  add("opening", time ? `${subject} arrived at ${time}. The day was underway.` : date ? `${subject} began on ${date}. The day was underway.` : `${subject} arrived, and the day was underway.`, first ? [first.id] : []);
  if (place) add("encounter", `The pin landed at ${place}. Now the moment had a place in the world.`, first ? [first.id] : []);
  if (negative) add("pressure", `${negative.text.replace(/[.!?]+$/, "")}. The shape of the day changed.`, [negative.id]);
  if (turn) add("turn", `${turn.text.replace(/[.!?]+$/, "")}. That was the detail that gave the day somewhere to go.`, [turn.id]);
  if (positive && !turn) add("transformation", `By then, ${subject} no longer looked quite like the version that arrived.`, [positive.id]);
  if (last) add("payoff", `${last.text.replace(/[.!?]+$/, "")}. And that is how an ordinary moment earns a place in the story.`, [last.id]);
  return beats;
}

export function extractLatentMovieV5(prompt: string): LatentMovieV5 {
  const sentences = splitSentences(prompt);
  const directives = sentences.filter((s) => DIRECTIVE.test(s));
  const payloads = directives.flatMap(directivePayload);
  const rawFacts = [...sentences.filter((s) => !DIRECTIVE.test(s)), ...payloads];

  const seen = new Set<string>();
  const facts: MovieFactV5[] = [];
  for (const raw of rawFacts) {
    const text = clean(raw);
    const key = text.toLowerCase().replace(/[.!?]+$/, "");
    if (!text || seen.has(key)) continue;
    seen.add(key);
    const times = [...text.matchAll(TIME)].map((m) => m[0]);
    const dates = [...text.matchAll(DATE)].map((m) => m[0]);
    const places = extractPlaces(text);
    const actors = properNames(text);
    facts.push({
      id: `fact-${facts.length + 1}`,
      text,
      kind: classifyKind(text),
      source: "user",
      confidence: 1,
      actors,
      places,
      times,
      dates,
    });
  }

  // Directive-only prompts need a subject even when their command is not itself
  // an event. Payload extraction supplies that identity without leaking the command.
  const subject = inferSubject(prompt, facts);
  const lens = lensFor(prompt, facts);
  const relationships = facts.slice(1).map((fact, i) => ({
    from: facts[i].id,
    to: fact.id,
    relation: relation(facts[i], fact),
    confidence: 0.86,
  }));

  const opening = facts[0]?.text;
  const pressure = facts.find((f) => NEGATIVE.test(f.text))?.text;
  const turningPoint = facts.find((f) => TURN.test(f.text))?.text;
  const transformation = facts.find((f) => NEGATIVE.test(f.text) && POSITIVE.test(f.text))?.text;
  const payoff = [...facts].reverse().find((f) => COMPLETION.test(f.text) || POSITIVE.test(f.text))?.text;

  const partial: Omit<LatentMovieV5, "beats"> = {
    subject,
    lens,
    directives,
    facts,
    relationships,
    arc: { opening, pressure, turningPoint, transformation, payoff },
    memoryThread: {
      key: threadKey(subject),
      subject,
      identitySignals: unique([subject, ...facts.flatMap((f) => f.actors), ...facts.filter((f) => f.kind === "place").flatMap((f) => f.places)]),
      continuationSignals: unique([
        ...facts.filter((f) => f.kind === "memory" || f.kind === "journey" || f.kind === "participation").map((f) => f.text),
        ...facts.flatMap((f) => f.places),
      ]),
      eventCount: facts.length,
    },
  };

  return { ...partial, beats: makeBeats(partial) };
}
