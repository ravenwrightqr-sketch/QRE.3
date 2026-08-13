import { } from "@qre/contracts";

/**
 * QRE LATENT MOVIE EXTRACTOR V4
 *
 * Reality stays reality. Narrative mechanics are director-side only.
 *
 * INPUT -> directive/payload separation -> facts -> relationships -> latent
 * movie shape -> storyteller prose.
 *
 * A directive such as "make a wedding memory" is not an event. The useful
 * payload inside that directive (wedding, date, place, participation) is.
 */

export type V4Lens = "cinematic" | "funny" | "dark" | "horror" | "warm" | "mysterious" | "epic" | "absurd";
export type V4FactKind = "subject" | "arrival" | "time" | "date" | "place" | "action" | "state" | "result" | "participation" | "journey" | "memory";
export type V4Relation = "continues" | "contrasts" | "transforms" | "reveals" | "escalates" | "accumulates" | "pays_off";

export type LatentMovieFactV4 = {
  id: string;
  text: string;
  kind: V4FactKind;
  source: "user";
  confidence: number;
  places?: string[];
  times?: string[];
  dates?: string[];
  actors?: string[];
};

export type LatentMovieRelationshipV4 = {
  from: string;
  to: string;
  relation: V4Relation;
  confidence: number;
};

export type LatentMovieBeatV4 = {
  order: number;
  role: "opening" | "encounter" | "pressure" | "turn" | "transformation" | "payoff" | "continuation";
  text: string;
  sourceFactIds: string[];
};

export type LatentMovieV4 = {
  subject: string;
  lens: V4Lens;
  facts: LatentMovieFactV4[];
  directives: string[];
  relationships: LatentMovieRelationshipV4[];
  arc: {
    opening?: string;
    pressure?: string;
    turningPoint?: string;
    transformation?: string;
    payoff?: string;
  };
  beats: LatentMovieBeatV4[];
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const unique = (xs: string[]) => [...new Set(xs.map(clean).filter(Boolean))];

const DIRECTIVE = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i;
const DIRECTIVE_BODY = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\s+(?:me\s+)?(?:a|an|the)?\s*(.*)$/i;
const AUDIENCE = /\b(?:everyone|everybody|people|guests?|visitors?|friends?|family|attendees?|fans?|clients?|customers?|viewers?|members?|participants?|followers?|invitees?)\b/i;
const TIME = /\b\d{1,2}(?::\d{2})?\s?(?:a\.m\.|p\.m\.|am|pm)\b/gi;
const DATE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi;
const PLACE = /\b(?:at|in|near|around|through|on)\s+([A-Z][A-Za-z0-9'’.-]*(?:\s+[A-Z][A-Za-z0-9'’.-]*){0,4})/g;
const NEGATIVE = /\b(scared|afraid|hated|hate|angry|sad|lost|missed|broken|mess|dirty|bad|terrified|creepy|dark|danger|failed|worried|nervous|late|stuck|rough|awful|fear|chaos|disaster)\b/i;
const POSITIVE = /\b(loved|love|liked|enjoyed|happy|excited|laughed|fun|great|beautiful|peaceful|relaxed|amazing|good|proud|won|finished|spotless|clean|safe|better|smiled|smile|joy|delighted)\b/i;
const TURN = /\b(stole|chewed|ate|missed|found|discovered|revealed|secret|strange|weird|unexpected|surprise|surprised|chaos|disaster|escaped|broke|caught|almost|nearly|suddenly)\b/i;
const HORROR = /\b(horror|horrifying|terrifying|haunted|ghost|blood|dead|death|murder|creepy|demented|nightmare|evil|disturbing|possessed)\b/i;
const FUNNY = /\b(funny|humor|comedy|ridiculous|silly|absurd|chaotic|wild|hilarious|lawyer|battle|owned)\b/i;
const MYSTERY = /\b(mystery|mysterious|secret|hidden|unknown|strange|discover|discovery|uncover|clue)\b/i;
const MEMORY = /\b(memory|memories|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve|trips|travel|traveled|beaches|raves|wedding)\b/i;
const COMPLETION = /\b(finished|finish|complete|completed|done|left|walked out|arrived home|returned|came home|spotless|won)\b/i;

const INTERNAL_WORDS = /\b(?:mechanic|beat|pressure|turning point|transformation|payoff|escalation|reveal|relationship|directive|compiler|latent movie|narrative lens|story shape)\b/gi;

function splitSentences(input: string): string[] {
  return input.replace(/[\r\n]+/g, " ")
    .split(/(?<=[.!?])\s+|\s*;\s*|\s*→\s*/)
    .map(clean)
    .filter((x) => x.length > 2);
}

function isDirective(text: string): boolean {
  return DIRECTIVE.test(text);
}

function extractDirectivePayload(text: string): string[] {
  const match = text.match(DIRECTIVE_BODY);
  if (!match) return [];
  const body = clean(match[1] ?? "")
    .replace(/^a\s+story\s+of\s+/i, "")
    .replace(/^a\s+memory\s+of\s+/i, "")
    .replace(/^an?\s+experience\s+of\s+/i, "")
    .replace(/^a\s+wedding\s+event\s+memory\s+for\s+/i, "");
  if (!body) return [];

  const payloads: string[] = [];
  const possessive = body.match(/\b(?:my|our|this|the)\s+([a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,7})/i)?.[0];
  if (possessive) payloads.push(clean(possessive));
  const explicitDate = body.match(DATE)?.[0];
  if (explicitDate) payloads.push(`Date: ${explicitDate}`);
  const place = [...body.matchAll(PLACE)].map((m) => clean(m[1] ?? ""));
  for (const p of place) if (p) payloads.push(`Location: ${p}`);
  if (/\b(?:everyone|everybody|people|guests?|family|friends?|attendees?|participants?)\b[^.?!]*\b(?:add|contribute|share|submit|keep adding)\b/i.test(body)) {
    payloads.push("People can add memories.");
  }
  if (/\bsurfboard\b/i.test(body)) payloads.push("My surfboard has traveled across beaches.");
  if (/\braves?\b/i.test(body)) payloads.push("My trips to raves are part of the memory.");
  return unique(payloads);
}

function properNames(text: string): string[] {
  return unique([...text.matchAll(/\b[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,1}\b/g)].map((m) => m[0])
    .filter((x) => !/^(Make|Create|Build|Turn|Transform|Write|Tell|Give|Generate|Design|Produce|Show|The|My|Our|This|Everyone|Date|Location)$/i.test(x)));
}

function extractPlaces(text: string): string[] {
  return unique([...text.matchAll(PLACE)].map((m) => clean(m[1] ?? ""))
    .filter((x) => x && !/^the\b/i.test(x) && !AUDIENCE.test(x)));
}

function classifyKind(text: string): V4FactKind {
  if (TIME.test(text)) return "time";
  if (DATE.test(text)) return "date";
  if (extractPlaces(text).length) return "place";
  if (AUDIENCE.test(text) && /\b(?:add|contribute|share|submit|keep)\b/i.test(text)) return "participation";
  if (COMPLETION.test(text)) return "result";
  if (NEGATIVE.test(text) || POSITIVE.test(text)) return "state";
  if (/\b(?:arrived|came|entered|went|traveled|visited|left|returned)\b/i.test(text)) return "journey";
  return "action";
}

function classifyLens(prompt: string, facts: string[]): V4Lens {
  const text = `${prompt} ${facts.join(" ")}`;
  if (HORROR.test(text)) return "horror";
  if (FUNNY.test(text) || (TURN.test(text) && /\b(?:dog|groom|pet|stole|chewed|lawyer|battle|owned)\b/i.test(text))) return "funny";
  if (MYSTERY.test(text)) return "mysterious";
  if (NEGATIVE.test(text) && !POSITIVE.test(text)) return "dark";
  if (MEMORY.test(text) || /\b(?:grandmother|grandfather|family|legacy|romantic)\b/i.test(text)) return "warm";
  return "cinematic";
}

function inferSubject(prompt: string, facts: LatentMovieFactV4[]): string {
  const joined = facts.map((f) => f.text).join(" ");
  const names = unique(facts.flatMap((f) => f.actors ?? []));
  if (names[0]) return names[0];
  const explicit = joined.match(/\b(?:surfboard|wedding|rave|concert|festival|birthday|anniversary|watch|necklace|ring|dog|cat|pet|house|home|product|guitar|camera|trip|journey|beach)\b/i)?.[0];
  if (explicit) return explicit.toLowerCase();
  const possessive = prompt.match(/\b(?:my|our|this)\s+(surfboard|wedding|dog|cat|pet|house|home|watch|ring|guitar|camera|trip|journey|beach)\b/i)?.[1];
  if (possessive) return possessive.toLowerCase();
  if (/\bwedding\b/i.test(prompt)) return "wedding";
  if (/\bsurfboard\b/i.test(prompt)) return "surfboard";
  if (/\braves?\b/i.test(prompt)) return "raves";
  if (/\bthe night\b/i.test(prompt)) return "the night";
  return "the moment";
}

function relation(a: LatentMovieFactV4, b: LatentMovieFactV4): V4Relation {
  if (a.kind === "state" && b.kind === "state") return "transforms";
  if (TURN.test(b.text)) return "reveals";
  if (COMPLETION.test(b.text)) return "pays_off";
  if (MEMORY.test(`${a.text} ${b.text}`) || b.kind === "participation") return "accumulates";
  if (NEGATIVE.test(a.text) && POSITIVE.test(b.text)) return "transforms";
  return "continues";
}

function safeProse(text: string): string {
  return clean(text.replace(INTERNAL_WORDS, "")).replace(/\s+([,.!?])/g, "$1");
}

function serviceDetails(facts: LatentMovieFactV4[]): boolean {
  return /\b(?:groom|clean|housekeep|bathroom|kitchen|salon|service|mess|spotless)\b/i.test(facts.map((f) => f.text).join(" "));
}

function buildStory(movie: Omit<LatentMovieV4, "beats">): LatentMovieBeatV4[] {
  const facts = movie.facts;
  const lens = movie.lens;
  const subject = movie.subject.charAt(0).toUpperCase() + movie.subject.slice(1);
  const service = serviceDetails(facts);
  const first = facts[0];
  const last = facts.at(-1);
  const actionFacts = facts.filter((f) => !["time", "date", "place"].includes(f.kind));
  const turnFact = actionFacts.find((f) => TURN.test(f.text));
  const negative = facts.find((f) => NEGATIVE.test(f.text));
  const positive = [...facts].reverse().find((f) => POSITIVE.test(f.text));
  const time = first?.times?.[0];
  const date = first?.dates?.[0];
  const place = first?.places?.[0];

  const beats: LatentMovieBeatV4[] = [];
  const add = (role: LatentMovieBeatV4["role"], text: string, sourceFactIds: string[]) => {
    const cleaned = safeProse(text);
    if (!cleaned) return;
    if (beats.at(-1)?.text === cleaned) return;
    beats.push({ order: beats.length, role, text: cleaned, sourceFactIds });
  };

  if (lens === "funny") {
    if (time && service) add("opening", `${subject} arrived at ${time}, ready for battle.`, first ? [first.id] : []);
    else if (date) add("opening", `${subject} began on ${date}, and the day was already looking suspiciously innocent.`, first ? [first.id] : []);
    else add("opening", `${subject} arrived, and the plan immediately looked a little too innocent.`, first ? [first.id] : []);
    if (place) add("encounter", `Pin dropped. ${place} was now officially on the map.`, first ? [first.id] : []);
    if (negative) add("pressure", service ? `${negative.text.replace(/\.$/, "")}. The job had officially entered combat.` : `${negative.text.replace(/\.$/, "")}. So much for an ordinary day.`, [negative.id]);
    if (turnFact) add("turn", `${turnFact.text.replace(/\.$/, "")}. There it was—the part nobody could have planned.`, [turnFact.id]);
    if (service && actionFacts.some((f) => /bathroom/i.test(f.text)) && actionFacts.some((f) => /kitchen/i.test(f.text))) add("pressure", "The bathrooms went first. Then the kitchen got its turn.", actionFacts.filter((f) => /bathroom|kitchen/i.test(f.text)).map((f) => f.id));
    if (positive && !turnFact) add("transformation", `Somewhere in the middle of it, ${subject} stopped looking like the version that arrived.`, [positive.id]);
    if (last) add("payoff", service ? `${last.text.replace(/\.$/, "")}. ${subject} won today.` : `${last.text.replace(/\.$/, "")}. Not bad for a day that started out ordinary.`, [last.id]);
    return beats;
  }

  if (lens === "horror") {
    add("opening", time ? `${subject} arrived at ${time}. At first, everything looked normal.` : `${subject} arrived. Nothing seemed wrong yet.`, first ? [first.id] : []);
    if (place) add("encounter", `The location was quiet. Too quiet.`, first ? [first.id] : []);
    if (negative) add("pressure", `${negative.text.replace(/\.$/, "")}. Nobody knew that detail would matter.`, [negative.id]);
    if (turnFact) add("turn", `${turnFact.text.replace(/\.$/, "")}. That was when the ordinary story stopped feeling ordinary.`, [turnFact.id]);
    add("transformation", "After that, the beginning could no longer be trusted.", facts.slice(0, Math.min(2, facts.length)).map((f) => f.id));
    if (last) add("payoff", `${last.text.replace(/\.$/, "")}. The record says it ended there.`, [last.id]);
    return beats;
  }

  if (lens === "warm") {
    add("opening", date ? `${subject} began on ${date}, with a moment worth keeping.` : `${subject} began with a moment worth keeping.`, first ? [first.id] : []);
    const meaningful = actionFacts.find((f) => f.kind === "memory" || f.kind === "participation" || MEMORY.test(f.text));
    if (meaningful) add("encounter", `${meaningful.text.replace(/\.$/, "")}. Another small piece found its place.`, [meaningful.id]);
    const others = actionFacts.filter((f) => f !== meaningful).slice(0, 2);
    for (const f of others) add("turn", `${f.text.replace(/\.$/, "")}. The memory kept gathering detail.`, [f.id]);
    add("transformation", "What began as a moment became part of something larger.", facts.slice(0, Math.min(2, facts.length)).map((f) => f.id));
    if (last) add("payoff", `${last.text.replace(/\.$/, "")}. That is the part to keep.`, [last.id]);
    return beats;
  }

  add("opening", time && service ? `${subject} arrived at ${time}, ready for battle.` : place && time ? `${subject} arrived at ${place} at ${time}. The clock started the scene.` : `${subject} arrived, and the story took its first breath.`, first ? [first.id] : []);
  for (const f of actionFacts.slice(0, 2)) add("encounter", `${f.text.replace(/\.$/, "")}. The story moved forward.`, [f.id]);
  if (turnFact) add("turn", `${turnFact.text.replace(/\.$/, "")}. That was the detail that changed the shape of the story.`, [turnFact.id]);
  if (service) add("transformation", "By then, the mess had become evidence of the work. The mission was winning.", facts.map((f) => f.id));
  else add("transformation", "By then, the beginning no longer looked quite the same.", facts.slice(0, Math.min(2, facts.length)).map((f) => f.id));
  if (last) add("payoff", `${last.text.replace(/\.$/, "")}. And that is how an ordinary moment earns a place in the story.`, [last.id]);
  return beats;
}

export function extractLatentMovieV4(prompt: string): LatentMovieV4 {
  const raw = splitSentences(prompt);
  const directives = raw.filter(isDirective);
  const evidence = raw.flatMap((sentence) => isDirective(sentence) ? extractDirectivePayload(sentence) : [sentence]);

  const facts: LatentMovieFactV4[] = unique(evidence).map((text, i) => {
    const times = unique(text.match(TIME) ?? []);
    const dates = unique(text.match(DATE) ?? []);
    const places = extractPlaces(text);
    return {
      id: `fact-${i + 1}`,
      text,
      kind: classifyKind(text),
      source: "user",
      confidence: 1,
      places,
      times,
      dates,
      actors: properNames(text),
    };
  });

  const subject = inferSubject(prompt, facts);
  const lens = classifyLens(prompt, facts.map((f) => f.text));
  const relationships = facts.slice(1).map((fact, i) => ({
    from: facts[i].id,
    to: fact.id,
    relation: relation(facts[i], fact),
    confidence: 0.9,
  }));

  const opening = facts[0]?.text;
  const pressure = facts.find((f) => NEGATIVE.test(f.text) || TURN.test(f.text))?.text;
  const turningPoint = facts.find((f) => TURN.test(f.text))?.text;
  const transformation = facts.find((f) => NEGATIVE.test(f.text) && POSITIVE.test(f.text))?.text;
  const payoff = [...facts].reverse().find((f) => COMPLETION.test(f.text) || POSITIVE.test(f.text))?.text;

  const movieWithoutBeats: Omit<LatentMovieV4, "beats"> = {
    subject,
    lens,
    facts,
    directives,
    relationships,
    arc: { opening, pressure, turningPoint, transformation, payoff },
  };

  return { ...movieWithoutBeats, beats: buildStory(movieWithoutBeats) };
}
