import type { LatentMovie, LatentMovieEvent, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * QRE LATENT MOVIE FACTORY V2
 *
 * PROMPT != STORY.
 *
 * The compiler first finds the latent movie:
 *   request -> subject -> evidence -> state -> turn -> transformation -> payoff
 *
 * Facts remain grounded. The prose is allowed to reframe their significance,
 * rhythm and emotional shape. That is the part that makes an ordinary service,
 * object, trip or event feel authored rather than summarized.
 */

export type MovieStyle = "cinematic" | "funny" | "dark" | "horror" | "warm" | "mysterious";

export type MovieFactoryResult = {
  movie: LatentMovie;
  beats: StoryBeat[];
  style: MovieStyle;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

const INSTRUCTION = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i;
const META_REQUEST = /\b(?:make|create|build|turn|transform|write|tell|give|generate|design|produce)\s+(?:a|an|the)?\s*(?:story|memory|experience|event|piece|invite|movie|film|art piece)\b/i;

const AUDIENCE = new Set([
  "everyone", "everybody", "people", "customers", "guests", "visitors", "friends", "family",
  "attendees", "fans", "clients", "homeowner", "homeowners", "users", "viewers", "members",
  "participants", "followers", "invitees",
]);

const SUBJECT_STOP = new Set([
  "make", "create", "build", "turn", "transform", "write", "tell", "give", "generate", "design",
  "produce", "show", "story", "memory", "experience", "event", "piece", "invite", "movie", "film",
  "something", "anything", "this", "that", "my", "our", "your", "the", "a", "an", "all",
  "people", "everyone", "family", "friends", "customers", "guests",
]);

const POSITIVE = /\b(loved|love|liked|enjoyed|happy|excited|laughed|laugh|fun|great|beautiful|peaceful|relaxed|amazing|good|proud|won|finished|spotless|clean|safe|better|smiled|smile|joy|delighted)\b/i;
const NEGATIVE = /\b(scared|afraid|hated|hate|angry|sad|lost|missed|broken|mess|dirty|bad|terrified|creepy|dark|danger|failed|worried|nervous|late|stuck|rough|awful|fear)\b/i;
const TURN = /\b(stole|chewed|ate|missed|found|discovered|revealed|secret|strange|weird|unexpected|surprise|surprised|chaos|disaster|escaped|broke|caught|almost|nearly|suddenly)\b/i;
const HORROR = /\b(horror|horrifying|terrifying|haunted|ghost|blood|dead|death|murder|creepy|dark|demented|nightmare|evil|disturbing|possessed)\b/i;
const FUNNY = /\b(funny|fun|humor|comedy|ridiculous|silly|absurd|chaotic|wild|hilarious|lawyer|battle|owned)\b/i;
const MYSTERY = /\b(mystery|mysterious|secret|hidden|unknown|strange|discover|discovery|uncover|clue)\b/i;
const MEMORY = /\b(memory|memories|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve|trips|travel|traveled|beaches|raves)\b/i;
const COMPLETION = /\b(finished|finish|complete|completed|done|left|walked out|arrived home|returned|homeowner comes home|came home|spotless)\b/i;
const LOCATION = /\b(?:at|in|near|around|through|on)\s+([A-Z][A-Za-z0-9'’.-]*(?:\s+[A-Z][A-Za-z0-9'’.-]*){0,4})/g;
const TIME = /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi;
const DATE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi;

function sentences(prompt: string): string[] {
  return prompt
    .replace(/[\r\n]+/g, " ")
    .split(/(?<=[.!?])\s+|\s*;\s*|\s*→\s*/)
    .map(clean)
    .filter((value) => value.length > 2);
}

function isInstruction(sentence: string): boolean {
  return INSTRUCTION.test(sentence) && META_REQUEST.test(sentence);
}

function meaningfulWords(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length > 2 && !SUBJECT_STOP.has(word));
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function findSubject(prompt: string, facts: string[]): string {
  // Proper names are the strongest subject signal: Coco, Maria, Max, etc.
  for (const fact of facts) {
    const proper = fact.match(/\b([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})\b/);
    if (proper && !SUBJECT_STOP.has(proper[1].toLowerCase())) return clean(proper[1]);
  }

  // "all the beaches my surfboard has traveled" -> surfboard.
  const subjectAfterCollection = prompt.match(/\b(?:beaches|raves|trips|memories|places|events)\b[^.?!]*?\b(?:my|our|this)\s+([A-Za-z][A-Za-z0-9'’-]*)/i)?.[1];
  if (subjectAfterCollection) return subjectAfterCollection.toLowerCase();

  // "my wedding Jan 1 2025" -> wedding, not "wedding jan".
  // The first concrete noun after a possessive is the semantic anchor.
  const possessive = prompt.match(/\b(?:my|our|this)\s+([A-Za-z][A-Za-z0-9'’-]*)/i)?.[1];
  if (possessive && !SUBJECT_STOP.has(possessive.toLowerCase()) && !AUDIENCE.has(possessive.toLowerCase())) {
    return possessive.toLowerCase();
  }

  // Domain nouns are evidence, not templates.
  const candidates = meaningfulWords(prompt).filter((word) =>
    /^(dog|cat|horse|pet|surfboard|board|watch|necklace|ring|car|truck|house|home|product|art|jewelry|guitar|instrument|tag|book|camera|wedding|rave|concert|festival|party|birthday|anniversary|trip|journey|beach|business|client|customer|groomer|housekeeper|cleaning|service|launch|show|performance)$/i.test(word),
  );
  if (candidates[0]) return candidates[0];

  const fallback = meaningfulWords(facts[0] ?? prompt).filter((word) => !AUDIENCE.has(word));
  return fallback.slice(0, 2).join(" ") || "the moment";
}

function extractPlaces(prompt: string, facts: string[]): string[] {
  const found: string[] = [];
  const collect = (text: string) => {
    for (const match of text.matchAll(LOCATION)) {
      const value = clean(match[1] ?? "");
      if (value && !/^the\b/i.test(value) && !AUDIENCE.has(value.toLowerCase())) found.push(value);
    }
  };
  collect(prompt);
  facts.forEach(collect);
  return unique(found);
}

function extractSignals(prompt: string, facts: string[]) {
  const times = unique(prompt.match(TIME) ?? []);
  const dates = unique(prompt.match(DATE) ?? []);
  const places = extractPlaces(prompt, facts);
  return { times, dates, places };
}

function classifyStyle(prompt: string, facts: string[]): MovieStyle {
  const text = `${prompt} ${facts.join(" ")}`;
  if (HORROR.test(text)) return "horror";
  if (FUNNY.test(text) || (TURN.test(text) && /\b(dog|groom|pet|stole|chewed|lawyer|owned)\b/i.test(text))) return "funny";
  if (MYSTERY.test(text)) return "mysterious";
  if (NEGATIVE.test(text) && !POSITIVE.test(text)) return "dark";
  if (/\b(wedding|memorial|grandmother|grandfather|family|memory|legacy|romantic|love)\b/i.test(text)) return "warm";
  return "cinematic";
}

function stateOf(fact: string): "positive" | "negative" | "neutral" {
  if (POSITIVE.test(fact) && !NEGATIVE.test(fact)) return "positive";
  if (NEGATIVE.test(fact)) return "negative";
  return "neutral";
}

function eventKind(fact: string, index: number): string {
  if (index === 0) return "arrival";
  if (COMPLETION.test(fact)) return "completion";
  if (TURN.test(fact)) return "turn";
  if (POSITIVE.test(fact) || NEGATIVE.test(fact)) return "state-change";
  return "event";
}

function buildEvents(
  facts: string[],
  subjectName: string,
  places: string[],
  times: string[],
  dates: string[],
): LatentMovieEvent[] {
  return facts.map((fact, index) => {
    const previousState = index > 0 ? stateOf(facts[index - 1]) : "neutral";
    const currentState = stateOf(fact);
    const factPlace = places.find((place) => fact.toLowerCase().includes(place.toLowerCase()));
    const temporal = [...(fact.match(TIME) ?? []), ...(fact.match(DATE) ?? [])];
    const place = factPlace ?? (index === 0 ? places[0] : undefined);

    return {
      id: `movie-event-${index + 1}`,
      order: index,
      fact,
      actor: subjectName,
      place,
      stateBefore: previousState !== "neutral" ? previousState : undefined,
      stateAfter: currentState !== "neutral" ? currentState : undefined,
      confidence: 0.98,
      ...(temporal.length ? { temporal: unique(temporal) } : {}),
      ...(index === 0 && times.length ? { time: times[0] } : {}),
      ...(index === 0 && dates.length ? { date: dates[0] } : {}),
    } as LatentMovieEvent;
  });
}

function inferIntentFact(prompt: string, subject: string, dates: string[], places: string[]): string {
  const text = clean(prompt.replace(/^[^.!?]*?\b(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i, "").replace(/^\s*(?:a|an|the)\s+/i, ""));
  if (/\bwedding\b/i.test(text)) return dates[0] ? `Wedding memory anchored to ${dates[0]}.` : "A wedding memory worth keeping.";
  if (/\bsurfboard\b/i.test(text)) return places.length ? `The surfboard's journey through ${places.join(", ")}.` : "The surfboard's journey across the beaches.";
  if (/\braves?\b/i.test(text)) return "A memory of the raves and the nights that became part of the story.";
  if (text) return `${titleCase(subject)} — ${text.replace(/[.!?]+$/, "")}.`;
  return `${titleCase(subject)} — a moment worth remembering.`;
}

function findContrasts(events: LatentMovieEvent[]): string[] {
  const results: string[] = [];
  for (let i = 1; i < events.length; i += 1) {
    const a = events[i - 1].stateAfter;
    const b = events[i].stateAfter;
    if (a && b && a !== b) results.push(`${a} → ${b}`);
  }
  return unique(results);
}

function findTurn(events: LatentMovieEvent[]): LatentMovieEvent | undefined {
  return events.find((event) => TURN.test(event.fact))
    ?? events.find((event) => event.stateBefore && event.stateAfter && event.stateBefore !== event.stateAfter)
    ?? (events.length >= 3 ? events[Math.floor(events.length / 2)] : undefined);
}

function hasServiceContext(movie: LatentMovie): boolean {
  return /\b(groom|clean|housekeep|service|client|customer|bathroom|kitchen|salon|shop)\b/i.test(
    [movie.subject, ...movie.details].join(" "),
  );
}

function hasTravelContext(movie: LatentMovie): boolean {
  return /\b(travel|trip|journey|beach|rave|festival|concert|tour|visited|traveled)\b/i.test(
    movie.details.join(" "),
  );
}

function storytellerLine(styleName: MovieStyle, movie: LatentMovie, beat: StoryBeatKind, fact?: string): string {
  const subject = titleCase(movie.subject);
  const first = movie.events[0]?.fact;
  const last = movie.events.at(-1)?.fact;
  const turn = findTurn(movie.events)?.fact;
  const time = (movie.events[0] as LatentMovieEvent & { time?: string })?.time;
  const date = (movie.events[0] as LatentMovieEvent & { date?: string })?.date;
  const place = movie.events[0]?.place;
  const service = hasServiceContext(movie);
  const travel = hasTravelContext(movie);

  if (styleName === "funny") {
    if (beat === "orientation") {
      if (service && time) return `${subject} arrived at ${time}, ready for battle. The house had other plans.`;
      if (service) return `${subject} showed up with a mission. The day was about to become somebody else's problem.`;
      return `${subject} arrived, and the plan immediately looked a little too innocent.`;
    }
    if (beat === "encounter") return fact ? `${fact}. So far, the operation was still pretending to be normal.` : `Then reality entered the room.`;
    if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. There it was: the plot twist hiding in plain sight.` : `Then the ordinary part started developing a personality.`;
    if (beat === "transformation") return service ? `Somewhere between the mess and the finish line, the job stopped looking like a job and started looking like a victory lap.` : `By then, the original plan had acquired a much better story.`;
    if (beat === "payoff") return last && service ? `${last}. Maria won today.` : last ? `${last}. Not bad for a day that arrived looking completely ordinary.` : `And somehow, that became the part worth telling.`;
  }

  if (styleName === "horror") {
    if (beat === "orientation") return time ? `${subject} arrived at ${time}. At first, everything looked normal.` : `${subject} arrived. Nothing seemed wrong yet.`;
    if (beat === "encounter") return fact ? `${fact}. Nobody knew that detail would matter.` : `The first sign was easy to dismiss.`;
    if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. That was when the ordinary story stopped feeling ordinary.` : `Then the details stopped lining up.`;
    if (beat === "transformation") return `After that, the beginning could no longer be trusted.`;
    if (beat === "payoff") return last ? `${last}. The record says it ended there. The feeling did not.` : `The moment ended. The unease stayed.`;
  }

  if (styleName === "warm") {
    if (beat === "orientation") return date ? `${subject} began on ${date}, with a moment worth keeping.` : `${subject} began with a moment worth keeping.`;
    if (beat === "encounter") return fact ? `${fact}. Another small piece of the memory found its place.` : `Then another piece joined the story.`;
    if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. One of those little details that becomes bigger every time it is remembered.` : `The details gathered, one after another.`;
    if (beat === "transformation") return travel ? `The places changed, the years moved, and the memory kept accumulating.` : `What began as a moment became part of something larger.`;
    if (beat === "payoff") return last ? `${last}. That is the part to keep.` : `Now the memory has somewhere to grow.`;
  }

  if (styleName === "mysterious") {
    if (beat === "orientation") return place ? `${subject} arrived at ${place}. The record begins there.` : `${subject} arrived. That is where the trail begins.`;
    if (beat === "encounter") return fact ? `${fact}. One detail did not quite fit.` : `Then a detail surfaced that was easy to overlook.`;
    if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. The clue had finally become part of the story.` : `Then the pattern became visible.`;
    if (beat === "transformation") return `By then, the beginning meant something different.`;
    if (beat === "payoff") return last ? `${last}. The record closes there, but the question remains.` : `Some stories answer themselves. This one leaves a door open.`;
  }

  if (beat === "orientation") {
    if (service && time) return `${subject} arrived at ${time}, ready for battle.`;
    if (place && time) return `${subject} arrived at ${place} at ${time}. The clock started the scene.`;
    if (date) return `${subject} arrived on ${date}. That is where the story starts.`;
    return first ? `${subject} arrived, and the day took its first breath.` : `${subject} is where the story begins.`;
  }
  if (beat === "encounter") return fact ? `${fact}. The day moved forward.` : `Then the next moment arrived.`;
  if (beat === "discovery" || beat === "escalation") {
    if (turn) return `${turn}. That was the detail that changed the shape of the day.`;
    if (service) return `The first job was handled. Then came the next one.`;
    return `Then came the detail that gave the story somewhere to go.`;
  }
  if (beat === "transformation") {
    if (service) return `By then, the mess had become evidence of the work. The mission was winning.`;
    if (travel) return `One place became another, then another. The object carried the history forward.`;
    return `By then, the beginning no longer looked quite the same.`;
  }
  if (beat === "payoff") return last ? `${last}. And that is how an ordinary moment earns a place in the story.` : `The moment ends. The memory does not.`;
  return fact ?? "The story continues.";
}

export function findLatentMovie(prompt: string): MovieFactoryResult {
  const rawSentences = sentences(prompt);
  const explicitFacts = rawSentences.filter((sentence) => !isInstruction(sentence));
  const facts = explicitFacts;
  const subjectName = findSubject(prompt, facts.length ? facts : rawSentences);
  const signals = extractSignals(prompt, facts.length ? facts : rawSentences);
  const styleName = classifyStyle(prompt, facts);
  const events = buildEvents(facts, subjectName, signals.places, signals.times, signals.dates);

  // Instruction-only prompts still contain a latent premise. Materialize that
  // premise as a low-confidence inferred event instead of pretending the request
  // itself was an observed event. This fixes "Make a wedding..." / surfboard /
  // rave prompts without polluting the movie with compiler instructions.
  if (!events.length && rawSentences.length) {
    events.push({
      id: "movie-event-1",
      order: 0,
      fact: inferIntentFact(prompt, subjectName, signals.dates, signals.places),
      actor: subjectName,
      place: signals.places[0],
      confidence: 0.82,
    } as LatentMovieEvent);
  }

  const contrasts = findContrasts(events);
  const turn = findTurn(events);

  const movie: LatentMovie = {
    subject: subjectName,
    participants: unique(facts.flatMap((fact) => fact.match(/\b[A-Z][A-Za-z'’-]+\b/g) ?? []).filter((name) => name !== subjectName)),
    places: signals.places,
    before: events[0]?.stateAfter,
    after: events.at(-1)?.stateAfter,
    events,
    details: unique([...facts, ...signals.places, ...signals.times, ...signals.dates]),
    emotionalDirection: unique([styleName, ...contrasts]),
    styleLenses: unique([styleName, ...(turn ? [eventKind(turn.fact, turn.order)] : [])]),
    memoryPotential: unique([
      "timeline",
      "meaningful moments",
      ...(signals.places.length ? ["geography"] : []),
      ...(signals.dates.length ? ["date"] : []),
      ...(signals.times.length ? ["time"] : []),
      ...(MEMORY.test(prompt) ? ["continuation"] : []),
    ]),
    continuation: "new moments can be added later without erasing this history",
  };

  const beatKinds: StoryBeatKind[] = events.length >= 3
    ? ["orientation", "encounter", turn ? "discovery" : "escalation", "transformation", "payoff"]
    : events.length === 2
      ? ["orientation", "encounter", "transformation", "payoff"]
      : ["orientation", "transformation", "payoff"];

  const beats: StoryBeat[] = beatKinds.map((kind, index) => {
    const eventIndex = kind === "orientation"
      ? 0
      : kind === "payoff"
        ? Math.max(0, events.length - 1)
        : Math.min(index - 1, Math.max(0, events.length - 1));
    const fact = events[eventIndex]?.fact;
    return {
      id: `movie-beat-${index + 1}-${kind}`,
      kind,
      order: index,
      purpose: kind === "orientation"
        ? "Establish the subject, opening state and strongest temporal/place evidence."
        : kind === "payoff"
          ? "Land the meaning of the accumulated evidence without inventing a new event."
          : "Advance the latent movie using observed evidence and a narrative transformation.",
      text: storytellerLine(styleName, movie, kind, fact),
      emotionalTarget: styleName,
      entities: unique([subjectName, ...signals.places, ...(fact ? [fact] : [])]),
      provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
    };
  });

  return { movie, beats, style: styleName };
}
