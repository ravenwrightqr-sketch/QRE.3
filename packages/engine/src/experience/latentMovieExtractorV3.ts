import type { LatentMovie, LatentMovieEvent, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * QRE LATENT MOVIE EXTRACTOR V3
 *
 * This layer is intentionally upstream of prose generation.
 *
 * USER LANGUAGE
 *   -> directive / evidence separation
 *   -> reality facts
 *   -> relationships
 *   -> latent arc
 *   -> narrative-ready movie
 *
 * The extractor may infer relationships (mess -> battle, fear -> relief,
 * collection -> journey), but it must not turn a compiler instruction into an
 * observed event. Narrative invention belongs downstream to the storyteller.
 */

export type NarrativeLens = "cinematic" | "funny" | "dark" | "horror" | "warm" | "mysterious" | "epic" | "absurd";

export type RealityFact = {
  id: string;
  text: string;
  source: "prompt";
  confidence: number;
  temporal?: string[];
  places?: string[];
  actors?: string[];
};

export type MovieRelationship = {
  from: string;
  to: string;
  relation: "causes" | "contrasts" | "escalates" | "transforms" | "accumulates" | "continues" | "reveals";
  confidence: number;
};

export type LatentMovieV3 = {
  movie: LatentMovie;
  facts: RealityFact[];
  directives: string[];
  relationships: MovieRelationship[];
  arc: {
    opening?: string;
    pressure?: string;
    turningPoint?: string;
    transformation?: string;
    payoff?: string;
  };
  lenses: NarrativeLens[];
  beats: StoryBeat[];
};

const clean = (v: string) => v.replace(/\s+/g, " ").trim();
const unique = (xs: string[]) => [...new Set(xs.map(clean).filter(Boolean))];

const DIRECTIVE = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i;
const META = /\b(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\s+(?:me\s+)?(?:a|an|the)?\s*(?:story|memory|experience|event|piece|invite|movie|film|art|history|journey|collection)\b/i;
const AUDIENCE = /\b(?:everyone|everybody|people|guests?|visitors?|friends?|family|attendees?|fans?|clients?|customers?|viewers?|members?|participants?|followers?|invitees?)\b/i;

const TIME = /\b\d{1,2}(?::\d{2})?\s?(?:a\.m\.|p\.m\.|am|pm)\b/gi;
const DATE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi;
const PLACE = /\b(?:at|in|near|around|through|on)\s+([A-Z][A-Za-z0-9'’.-]*(?:\s+[A-Z][A-Za-z0-9'’.-]*){0,4})/g;

const NEGATIVE = /\b(scared|afraid|hated|hate|angry|sad|lost|missed|broken|mess|dirty|bad|terrified|creepy|dark|danger|failed|worried|nervous|late|stuck|rough|awful|fear|chaos|disaster)\b/i;
const POSITIVE = /\b(loved|love|liked|enjoyed|happy|excited|laughed|fun|great|beautiful|peaceful|relaxed|amazing|good|proud|won|finished|spotless|clean|safe|better|smiled|smile|joy|delighted)\b/i;
const TURN = /\b(stole|chewed|ate|missed|found|discovered|revealed|secret|strange|weird|unexpected|surprise|surprised|chaos|disaster|escaped|broke|caught|almost|nearly|suddenly|then)\b/i;
const HORROR = /\b(horror|horrifying|terrifying|haunted|ghost|blood|dead|death|murder|creepy|demented|nightmare|evil|disturbing|possessed)\b/i;
const FUNNY = /\b(funny|humor|comedy|ridiculous|silly|absurd|chaotic|wild|hilarious|lawyer|battle|owned)\b/i;
const MYSTERY = /\b(mystery|mysterious|secret|hidden|unknown|strange|discover|discovery|uncover|clue)\b/i;
const MEMORY = /\b(memory|memories|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve|trips|travel|traveled|beaches|raves)\b/i;
const COMPLETION = /\b(finished|finish|complete|completed|done|left|walked out|arrived home|returned|came home|spotless|won)\b/i;

function splitSentences(input: string): string[] {
  return input.replace(/[\r\n]+/g, " ")
    .split(/(?<=[.!?])\s+|\s*;\s*|\s*→\s*/)
    .map(clean)
    .filter((x) => x.length > 2);
}

function isDirective(s: string): boolean {
  return DIRECTIVE.test(s) && META.test(s);
}

function extractPlaces(text: string): string[] {
  return unique([...text.matchAll(PLACE)].map((m) => clean(m[1] ?? ""))
    .filter((x) => x && !/^the\b/i.test(x) && !AUDIENCE.test(x)));
}

function properNames(text: string): string[] {
  return unique([...text.matchAll(/\b[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,1}\b/g)]
    .map((m) => m[0])
    .filter((x) => !/^(Make|Create|Build|Turn|Transform|Write|Tell|Give|Generate|Design|Produce|Show|The|My|Our|This|Everyone)$/i.test(x)));
}

function subject(prompt: string, facts: string[]): string {
  const names = unique(facts.flatMap(properNames));
  if (names[0]) return names[0];

  const collection = prompt.match(/\b(?:beaches|raves|trips|memories|places|events)\b[^.?!]*?\b(?:my|our|this)\s+([a-z][a-z0-9'’-]*)/i)?.[1];
  if (collection) return collection.toLowerCase();

  const possessive = prompt.match(/\b(?:my|our|this)\s+([a-z][a-z0-9'’-]*)/i)?.[1];
  if (possessive && !/^(story|memory|experience|event|piece|movie|film|history|journey|collection)$/i.test(possessive)) return possessive.toLowerCase();

  const domain = prompt.match(/\b(surfboard|wedding|rave|concert|festival|birthday|anniversary|watch|necklace|ring|dog|cat|pet|house|home|product|guitar|camera|trip|journey|beach)\b/i)?.[1];
  return domain ?? "the moment";
}

function state(text: string): "positive" | "negative" | "neutral" {
  if (NEGATIVE.test(text) && !POSITIVE.test(text)) return "negative";
  if (POSITIVE.test(text) && !NEGATIVE.test(text)) return "positive";
  return "neutral";
}

function classifyLens(prompt: string, facts: string[]): NarrativeLens {
  const text = `${prompt} ${facts.join(" ")}`;
  if (HORROR.test(text)) return "horror";
  if (FUNNY.test(text) || (TURN.test(text) && /\b(?:dog|groom|pet|stole|chewed|lawyer|battle|owned)\b/i.test(text))) return "funny";
  if (MYSTERY.test(text)) return "mysterious";
  if (NEGATIVE.test(text) && !POSITIVE.test(text)) return "dark";
  if (MEMORY.test(text) || /\b(?:wedding|grandmother|grandfather|family|legacy|romantic)\b/i.test(text)) return "warm";
  return "cinematic";
}

function buildRelationships(events: LatentMovieEvent[]): MovieRelationship[] {
  const out: MovieRelationship[] = [];
  for (let i = 1; i < events.length; i += 1) {
    const a = events[i - 1];
    const b = events[i];
    const aState = a.stateAfter as string | undefined;
    const bState = b.stateAfter as string | undefined;
    const relation = aState && bState && aState !== bState
      ? "transforms"
      : TURN.test(b.fact)
        ? "reveals"
        : COMPLETION.test(b.fact)
          ? "payoff"
          : MEMORY.test(`${a.fact} ${b.fact}`)
            ? "accumulates"
            : "continues";
    out.push({ from: a.id, to: b.id, relation: relation as MovieRelationship["relation"], confidence: aState && bState && aState !== bState ? 0.94 : 0.82 });
  }
  return out;
}

function narrativeBeatText(lens: NarrativeLens, movie: LatentMovie, kind: StoryBeatKind, fact?: string): string {
  const s = movie.subject.charAt(0).toUpperCase() + movie.subject.slice(1);
  const first = movie.events[0]?.fact;
  const last = movie.events.at(-1)?.fact;
  const time = (movie.events[0] as LatentMovieEvent & { time?: string })?.time;
  const date = (movie.events[0] as LatentMovieEvent & { date?: string })?.date;
  const places = movie.places ?? [];
  const service = /\b(?:groom|clean|housekeep|bathroom|kitchen|salon|service)\b/i.test(movie.details.join(" "));
  const travel = /\b(?:travel|trip|journey|beach|rave|festival|concert|tour|visited|traveled)\b/i.test(movie.details.join(" "));

  if (lens === "funny") {
    if (kind === "orientation") return time && service ? `${s} arrived at ${time}, ready for battle.` : `${s} arrived, and the plan immediately looked a little too innocent.`;
    if (kind === "encounter") return fact ? `${fact}. So far, everything was still pretending to be normal.` : "Then reality entered the room.";
    if (kind === "discovery" || kind === "escalation") return fact ? `${fact}. There it was: the plot twist hiding in plain sight.` : "Then the ordinary part developed a personality.";
    if (kind === "transformation") return service ? "Somewhere between the mess and the finish line, the job became a victory lap." : "By then, the original plan had acquired a much better story.";
    return last && service ? `${last}. ${s} won today.` : last ? `${last}. Not bad for a day that started out ordinary.` : "And somehow, that became the part worth telling.";
  }

  if (lens === "horror") {
    if (kind === "orientation") return time ? `${s} arrived at ${time}. At first, everything looked normal.` : `${s} arrived. Nothing seemed wrong yet.`;
    if (kind === "encounter") return fact ? `${fact}. Nobody knew that detail would matter.` : "The first sign was easy to dismiss.";
    if (kind === "discovery" || kind === "escalation") return fact ? `${fact}. That was when the ordinary story stopped feeling ordinary.` : "Then the details stopped lining up.";
    if (kind === "transformation") return "After that, the beginning could no longer be trusted.";
    return last ? `${last}. The record says it ended there.` : "The moment ended. The unease stayed.";
  }

  if (lens === "warm") {
    if (kind === "orientation") return date ? `${s} began on ${date}, with a moment worth keeping.` : `${s} began with a moment worth keeping.`;
    if (kind === "encounter") return fact ? `${fact}. Another small piece found its place.` : "Then another piece joined the story.";
    if (kind === "discovery" || kind === "escalation") return fact ? `${fact}. One of those details that grows every time it is remembered.` : "The details gathered, one after another.";
    if (kind === "transformation") return travel ? `The places changed, the years moved, and the memory kept accumulating.` : "What began as a moment became part of something larger.";
    return last ? `${last}. That is the part to keep.` : "Now the memory has somewhere to grow.";
  }

  if (lens === "mysterious") {
    if (kind === "orientation") return places[0] ? `${s} arrived at ${places[0]}. The record begins there.` : `${s} arrived. That is where the trail begins.`;
    if (kind === "encounter") return fact ? `${fact}. One detail did not quite fit.` : "Then a detail surfaced that was easy to overlook.";
    if (kind === "discovery" || kind === "escalation") return fact ? `${fact}. The clue had finally become part of the story.` : "Then the pattern became visible.";
    if (kind === "transformation") return "By then, the beginning meant something different.";
    return last ? `${last}. The record closes there, but the question remains.` : "Some stories leave a door open.";
  }

  if (kind === "orientation") {
    if (time && service) return `${s} arrived at ${time}, ready for battle.`;
    if (places[0] && time) return `${s} arrived at ${places[0]} at ${time}. The clock started the scene.`;
    if (date) return `${s} began on ${date}. That is where the story starts.`;
    return first ? `${s} arrived, and the story took its first breath.` : `${s} is where the story begins.`;
  }
  if (kind === "encounter") return fact ? `${fact}. The story moved forward.` : "Then the next moment arrived.";
  if (kind === "discovery" || kind === "escalation") return fact ? `${fact}. That was the detail that changed the shape of the story.` : "Then came the detail that gave the story somewhere to go.";
  if (kind === "transformation") return service ? "By then, the mess had become evidence of the work. The mission was winning." : travel ? "One place became another, then another. The history kept moving." : "By then, the beginning no longer looked quite the same.";
  return last ? `${last}. And that is how an ordinary moment earns a place in the story.` : "The moment ends. The memory does not.";
}

export function extractLatentMovieV3(prompt: string): LatentMovieV3 {
  const raw = splitSentences(prompt);
  const directives = raw.filter(isDirective);
  const evidence = raw.filter((s) => !isDirective(s));
  const facts: RealityFact[] = evidence.map((text, i) => ({
    id: `fact-${i + 1}`,
    text,
    source: "prompt",
    confidence: 1,
    temporal: unique([...(text.match(TIME) ?? []), ...(text.match(DATE) ?? [])]),
    places: extractPlaces(text),
    actors: properNames(text),
  }));

  const subjectName = subject(prompt, evidence);
  const allPlaces = unique(facts.flatMap((f) => f.places ?? []));
  const times = unique(facts.flatMap((f) => f.temporal ?? []).filter((x) => /am|pm/i.test(x)));
  const dates = unique(facts.flatMap((f) => f.temporal ?? []).filter((x) => !/am|pm/i.test(x)));

  const events: LatentMovieEvent[] = facts.map((fact, i) => {
    const before = i ? state(facts[i - 1].text) : undefined;
    const after = state(fact.text);
    return {
      id: `movie-event-${i + 1}`,
      order: i,
      fact: fact.text,
      actor: subjectName,
      place: fact.places?.[0],
      stateBefore: before && before !== "neutral" ? before : undefined,
      stateAfter: after !== "neutral" ? after : undefined,
      confidence: fact.confidence,
      temporal: fact.temporal,
      ...(i === 0 && times[0] ? { time: times[0] } : {}),
      ...(i === 0 && dates[0] ? { date: dates[0] } : {}),
    } as LatentMovieEvent;
  });

  // Instruction-only prompts get a low-confidence premise, never an observed fact.
  if (!events.length && directives.length) {
    events.push({
      id: "movie-event-premise",
      order: 0,
      fact: `Premise: ${subjectName}`,
      actor: subjectName,
      confidence: 0.72,
    } as LatentMovieEvent);
  }

  const lens = classifyLens(prompt, evidence);
  const relationships = buildRelationships(events);
  const turn = events.find((e) => TURN.test(e.fact));
  const finalEvent = events.at(-1);

  const movie: LatentMovie = {
    subject: subjectName,
    participants: unique(facts.flatMap((f) => f.actors ?? []).filter((x) => x !== subjectName)),
    places: allPlaces,
    before: events[0]?.stateAfter,
    after: finalEvent?.stateAfter,
    events,
    details: unique([...evidence, ...allPlaces, ...times, ...dates]),
    emotionalDirection: unique([lens, ...relationships.map((r) => r.relation)]),
    styleLenses: [lens],
    memoryPotential: unique(["timeline", "meaningful moments", ...(allPlaces.length ? ["geography"] : []), ...(dates.length ? ["date"] : []), ...(times.length ? ["time"] : []), ...(MEMORY.test(prompt) ? ["continuation"] : [])]),
    continuation: "new moments can be added later without erasing this history",
  } as LatentMovie;

  const beatKinds: StoryBeatKind[] = events.length >= 4
    ? ["orientation", "encounter", turn ? "discovery" : "escalation", "transformation", "payoff"]
    : events.length >= 2
      ? ["orientation", "encounter", "transformation", "payoff"]
      : ["orientation", "transformation", "payoff"];

  const beats: StoryBeat[] = beatKinds.map((kind, i) => {
    const eventIndex = kind === "orientation" ? 0 : kind === "payoff" ? Math.max(0, events.length - 1) : Math.min(Math.max(i - 1, 0), Math.max(events.length - 1, 0));
    const fact = events[eventIndex]?.fact;
    return {
      id: `movie-v3-beat-${i + 1}-${kind}`,
      kind,
      order: i,
      purpose: kind === "orientation"
        ? "Establish the subject and strongest reality anchor."
        : kind === "payoff"
          ? "Land the meaning of the evidence without inventing a new event."
          : "Advance the latent movie using observed evidence and inferred relationships.",
      text: narrativeBeatText(lens, movie, kind, fact),
      emotionalTarget: lens,
      entities: unique([subjectName, ...allPlaces, ...(fact ? [fact] : [])]),
      provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
    };
  });

  return {
    movie,
    facts,
    directives,
    relationships,
    arc: {
      opening: events[0]?.fact,
      pressure: relationships.find((r) => r.relation === "escalates" || r.relation === "reveals") ? events.find((e) => TURN.test(e.fact))?.fact : undefined,
      turningPoint: turn?.fact,
      transformation: events.find((e) => e.stateBefore && e.stateAfter && e.stateBefore !== e.stateAfter)?.fact,
      payoff: finalEvent?.fact,
    },
    lenses: [lens],
    beats,
  };
}
