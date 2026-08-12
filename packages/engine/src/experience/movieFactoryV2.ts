import type { LatentMovie, LatentMovieEvent, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * QRE LATENT MOVIE FACTORY V2
 *
 * This is deliberately upstream of prose realization.
 * It does not try to "write nicely" from raw tokens. It first discovers
 * what happened: subject, events, state changes, contrast, escalation,
 * transformation and payoff opportunities.
 *
 * No industry templates live here. A dog, wedding, service visit, object,
 * journey or event is reduced to the same narrative evidence substrate.
 */

export type MovieStyle = "cinematic" | "funny" | "dark" | "horror" | "warm" | "mysterious";

export type MovieFactoryResult = {
  movie: LatentMovie;
  beats: StoryBeat[];
  style: MovieStyle;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "for", "with", "this", "that",
  "my", "our", "your", "their", "his", "her", "its", "i", "me", "we",
  "you", "they", "to", "of", "in", "on", "at", "from", "is", "was", "were",
  "are", "be", "been", "being", "make", "made", "create", "build", "tell",
  "story", "memory", "experience", "qr", "nfc", "tag", "please", "want", "need",
]);

const AUDIENCE = new Set([
  "everyone", "people", "customers", "guests", "visitors", "friends", "family",
  "attendees", "fans", "clients", "homeowner", "homeowners", "users", "viewers",
]);

const EVENT_WORDS = /\b(wedding|rave|concert|festival|party|birthday|anniversary|trip|journey|visit|grooming|bath|cleaned|cleaning|service|launch|show|performance|memorial|ceremony|beach|travel(?:ed|ing)?)\b/i;
const OBJECT_WORDS = /\b(dog|cat|horse|pet|surfboard|board|watch|necklace|ring|car|truck|house|home|product|art|jewelry|guitar|instrument|tag|book|camera)\b/i;
const PLACE_WORDS = /\b(beach|lake|mountain|city|town|hotel|restaurant|bar|club|venue|pier|park|home|house|studio|salon|groomer|grooming|kitchen|bathroom)\b/i;

const POSITIVE = /\b(loved|love|liked|enjoyed|happy|excited|laughed|laugh|fun|great|beautiful|peaceful|relaxed|amazing|good|proud|won|finished|spotless|clean|safe|better|smiled|smile)\b/i;
const NEGATIVE = /\b(scared|afraid|hated|hate|angry|sad|lost|missed|broken|mess|dirty|bad|terrified|creepy|dark|danger|failed|worried|nervous|late|stuck)\b/i;
const ABSURD = /\b(stole|stole|chewed|ate|lawyer|owned|guilty|crime|chaos|disaster|ridiculous|insane|wild|weird|strange|secret|mysterious)\b/i;
const HORROR = /\b(horror|horrifying|terrifying|terrifying|haunted|ghost|blood|dead|death|murder|creepy|dark|demented|nightmare|evil|disturbing)\b/i;
const FUNNY = /\b(funny|fun|humor|comedy|ridiculous|silly|absurd|chaotic|wild)\b/i;
const MYSTERY = /\b(mystery|mysterious|secret|hidden|unknown|strange|discover|discovery|uncover)\b/i;

function sentences(prompt: string): string[] {
  return prompt
    .replace(/[\r\n]+/g, " ")
    .split(/(?<=[.!?])\s+|\s*;\s*|\s*→\s*/)
    .map(clean)
    .filter((value) => value.length > 2);
}

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function subject(prompt: string, facts: string[]): string {
  const explicit = prompt.match(/\b(?:this is|meet|about|for)\s+(?:my|our|the|a|an)?\s*([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/i)?.[1];
  if (explicit && !AUDIENCE.has(explicit.toLowerCase())) return clean(explicit);

  const proper = prompt.match(/\b([A-Z][A-Za-z'’-]+)(?:\s+[A-Z][A-Za-z'’-]+)?\b/);
  if (proper && !/^(Make|Build|Create|Turn|Tell|What|My|This|I|The|And|Her|His|She|He)$/.test(proper[1])) {
    return clean(proper[0]);
  }

  const object = words(prompt).find((word) => OBJECT_WORDS.test(word));
  if (object) return object;

  const event = words(prompt).find((word) => EVENT_WORDS.test(word));
  if (event) return event;

  const meaningful = words(facts[0] ?? prompt).filter((word) => !AUDIENCE.has(word));
  return meaningful.slice(0, 2).join(" ") || "the experience";
}

function places(prompt: string, facts: string[]): string[] {
  const result: string[] = [];
  for (const match of prompt.matchAll(/\b(?:at|in|near|around|through|on)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/g)) {
    if (match[1]) result.push(clean(match[1]));
  }
  for (const fact of facts) {
    const place = fact.match(/\b(?:at|in|near|around|through|on)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/)?.[1];
    if (place) result.push(clean(place));
  }
  return unique(result);
}

function style(prompt: string): MovieStyle {
  if (HORROR.test(prompt)) return "horror";
  if (FUNNY.test(prompt) || ABSURD.test(prompt)) return "funny";
  if (MYSTERY.test(prompt)) return "mysterious";
  if (NEGATIVE.test(prompt) && !POSITIVE.test(prompt)) return "dark";
  if (/\b(wedding|memorial|grandmother|grandfather|family|memory|legacy|romantic|love)\b/i.test(prompt)) return "warm";
  return "cinematic";
}

function stateOf(fact: string): "positive" | "negative" | "neutral" {
  if (POSITIVE.test(fact)) return "positive";
  if (NEGATIVE.test(fact)) return "negative";
  return "neutral";
}

function eventKind(fact: string, index: number): string {
  if (index === 0) return "arrival";
  if (/\b(finished|complete|completed|done|left|walked out|arrived home|returned)\b/i.test(fact)) return "completion";
  if (/\b(stole|chewed|ate|missed|found|discovered|revealed|secret|strange|weird)\b/i.test(fact)) return "turn";
  if (POSITIVE.test(fact) || NEGATIVE.test(fact)) return "state-change";
  return "event";
}

function buildEvents(prompt: string, facts: string[], subjectName: string, placeList: string[]): LatentMovieEvent[] {
  return facts.map((fact, index) => {
    const before = index > 0 ? stateOf(facts[index - 1]) : undefined;
    const after = stateOf(fact);
    const place = placeList.find((candidate) => fact.toLowerCase().includes(candidate.toLowerCase())) ?? placeList[0];
    return {
      id: `movie-event-${index + 1}`,
      order: index,
      fact,
      actor: subjectName,
      place,
      stateBefore: before && before !== "neutral" ? before : undefined,
      stateAfter: after !== "neutral" ? after : undefined,
      confidence: 0.98,
    };
  });
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

function pickTurn(events: LatentMovieEvent[]): LatentMovieEvent | undefined {
  return events.find((event) => /\b(stole|chewed|ate|missed|found|discovered|secret|strange|weird|chaos|unexpected)\b/i.test(event.fact))
    ?? events.find((event) => event.stateBefore && event.stateAfter && event.stateBefore !== event.stateAfter)
    ?? events[Math.max(0, events.length - 2)];
}

function prose(styleName: MovieStyle, movie: LatentMovie, beat: StoryBeatKind, fact?: string): string {
  const subjectName = movie.subject;
  const first = movie.events[0]?.fact;
  const last = movie.events.at(-1)?.fact;
  const turn = movie.events.find((event) => event.id === movie.events.find((candidate) => /\b(stole|chewed|ate|missed|found|discovered|secret|strange|weird)\b/i.test(candidate.fact))?.id)?.fact;

  if (styleName === "funny") {
    if (beat === "orientation") return `${subjectName} had arrived, and the day was about to become more interesting than the itinerary suggested.`;
    if (beat === "encounter") return fact ? `${fact}. So far, everything was going according to plan. More or less.` : `Then the plan met reality.`;
    if (beat === "escalation" || beat === "discovery") return turn ? `${turn}. That was the moment the story acquired evidence.` : `Then something happened that made the ordinary part much less ordinary.`;
    if (beat === "transformation") return `Somewhere in the middle of it, ${subjectName} stopped being the same ${subjectName} who arrived.`;
    if (beat === "payoff") return last ? `${last}. Not a bad ending for a day that started out looking completely normal.` : `And somehow, that became the part worth remembering.`;
  }

  if (styleName === "horror") {
    if (beat === "orientation") return `${subjectName} arrived. At first, nothing seemed wrong.`;
    if (beat === "encounter") return fact ? `${fact}. Nobody thought much of it then.` : `The first sign was easy to ignore.`;
    if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. That was when the ordinary story stopped feeling ordinary.` : `Then the details began to stop making sense.`;
    if (beat === "transformation") return `Whatever had begun here had changed the meaning of everything that came before it.`;
    if (beat === "payoff") return last ? `${last}. And that is the version of the story people tell after the lights come back on.` : `The story ends. The unease does not.`;
  }

  if (styleName === "warm") {
    if (beat === "orientation") return `${subjectName} began with a moment worth keeping.`;
    if (beat === "encounter") return fact ? `${fact}. It became another piece of the memory.` : `Then the people and places around it began to matter.`;
    if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. One of those small moments that becomes bigger after you remember it.` : `The details gathered, one after another.`;
    if (beat === "transformation") return `What began as a moment became part of a larger story.`;
    if (beat === "payoff") return last ? `${last}. That is the part to keep.` : `And now the memory has somewhere to live.`;
  }

  if (beat === "orientation") return first ? `${subjectName} arrived, and the story had its beginning.` : `${subjectName} is where the story begins.`;
  if (beat === "encounter") return fact ? `${fact}. The day moved forward.` : `Then the next moment arrived.`;
  if (beat === "discovery" || beat === "escalation") return turn ? `${turn}. That changed the shape of the story.` : `Then came the detail that gave the story somewhere to go.`;
  if (beat === "transformation") return `By then, the beginning no longer looked quite the same.`;
  if (beat === "payoff") return last ? `${last}. And that is how this moment becomes a memory.` : `The moment ends, but the story has somewhere to continue.`;
  return fact ?? "The story continues.";
}

export function findLatentMovie(prompt: string): MovieFactoryResult {
  const facts = sentences(prompt);
  const subjectName = subject(prompt, facts);
  const placeList = places(prompt, facts);
  const styleName = style(prompt);
  const events = buildEvents(prompt, facts, subjectName, placeList);
  const contrasts = findContrasts(events);
  const turn = pickTurn(events);

  const movie: LatentMovie = {
    subject: subjectName,
    participants: unique(facts.flatMap((fact) => fact.match(/\b[A-Z][A-Za-z'’-]+\b/g) ?? []).filter((name) => name !== subjectName)),
    places: placeList,
    before: events[0]?.stateAfter,
    after: events.at(-1)?.stateAfter,
    events,
    details: unique([...facts, ...placeList]),
    emotionalDirection: unique([styleName, ...contrasts]),
    styleLenses: [styleName, ...(turn ? [eventKind(turn.fact, turn.order)] : [])],
    memoryPotential: unique(["timeline", "meaningful moments", ...(placeList.length ? ["geography"] : [])]),
    continuation: "new moments can be added later without erasing this history",
  };

  const beatKinds: StoryBeatKind[] = events.length >= 3
    ? ["orientation", "encounter", turn ? "discovery" : "escalation", "transformation", "payoff"]
    : ["orientation", "encounter", "transformation", "payoff"];

  const beats: StoryBeat[] = beatKinds.map((kind, index) => {
    const fact = events[Math.min(index, Math.max(0, events.length - 1))]?.fact;
    const text = prose(styleName, movie, kind, fact);
    return {
      id: `movie-beat-${index + 1}-${kind}`,
      kind,
      order: index,
      purpose: kind === "orientation" ? "Establish the subject and opening state."
        : kind === "payoff" ? "Land the meaning of the accumulated facts."
        : "Advance the latent movie using observed evidence.",
      text,
      emotionalTarget: styleName,
      entities: unique([subjectName, ...placeList, ...(fact ? [fact] : [])]),
      provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
    };
  });

  return { movie, beats, style: styleName };
}
