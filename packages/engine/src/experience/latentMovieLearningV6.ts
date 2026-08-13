import { extractLatentMovieV5, type LatentMovieV5 } from "./latentMovieExtractorV5.js";

/**
 * V6 turns the latent movie into a learning loop without coupling the engine
 * to Prisma, Redis, or any persistence implementation.
 *
 * IMPORTANT: memory is scoped by owner + entity. "Coco" is never a global
 * memory key. Two different groomers can both have a Coco without sharing
 * memories, and Bettie's Coco cannot contaminate Bettie's Patty.
 */

export type MemoryScopeV6 = {
  ownerKey: string;
  entityKey: string;
};

export type LearnedSignalV6 = {
  value: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
};

export type EntityMemoryV6 = {
  key: string;
  ownerKey: string;
  entityKey: string;
  subject: string;
  eventCount: number;
  facts: string[];
  places: string[];
  times: string[];
  dates: string[];
  recurringSignals: LearnedSignalV6[];
  identitySignals: string[];
  continuationSignals: string[];
};

export type LearnedMovieV6 = {
  movie: LatentMovieV5;
  memory: EntityMemoryV6;
  novelFacts: string[];
  recurringFacts: string[];
  recurringSignals: string[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = <T>(values: T[]) => [...new Set(values)];

function scopedKey(scope: MemoryScopeV6): string {
  const owner = normalize(scope.ownerKey) || "anonymous";
  const entity = normalize(scope.entityKey) || "entity";
  return `memory:${owner}:${entity}`;
}

function mergeSignals(
  previous: LearnedSignalV6[],
  incoming: string[],
  eventNumber: number,
): LearnedSignalV6[] {
  const byValue = new Map(previous.map((signal) => [normalize(signal.value), { ...signal }]));
  for (const raw of incoming) {
    const value = clean(raw);
    const key = normalize(value);
    if (!key) continue;
    const current = byValue.get(key);
    if (current) {
      current.count += 1;
      current.lastSeen = eventNumber;
    } else {
      byValue.set(key, { value, count: 1, firstSeen: eventNumber, lastSeen: eventNumber });
    }
  }
  return [...byValue.values()].sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen);
}

function recurringLexicalSignals(movie: LatentMovieV5): string[] {
  const stop = new Set([
    "the", "and", "was", "were", "with", "that", "this", "then", "from", "into", "when",
    "she", "he", "they", "her", "his", "their", "came", "went", "arrived", "left", "today",
    "there", "here", "just", "very", "really", "made", "make", "got", "get", "for", "was",
  ]);
  const counts = new Map<string, number>();
  for (const fact of movie.facts) {
    for (const token of normalize(fact.text).split(" ")) {
      if (token.length < 4 || stop.has(token) || /^\d+$/.test(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token);
}

function buildMemory(scope: MemoryScopeV6, movie: LatentMovieV5, previous?: EntityMemoryV6): EntityMemoryV6 {
  const eventCount = (previous?.eventCount ?? 0) + 1;
  const facts = unique([...(previous?.facts ?? []), ...movie.facts.map((fact) => fact.text)]);
  const places = unique([...(previous?.places ?? []), ...movie.facts.flatMap((fact) => fact.places)]);
  const times = unique([...(previous?.times ?? []), ...movie.facts.flatMap((fact) => fact.times)]);
  const dates = unique([...(previous?.dates ?? []), ...movie.facts.flatMap((fact) => fact.dates)]);
  const signals = unique([
    ...movie.memoryThread.identitySignals,
    ...movie.memoryThread.continuationSignals,
    ...movie.facts.flatMap((fact) => fact.places),
    ...recurringLexicalSignals(movie),
  ]);

  return {
    key: scopedKey(scope),
    ownerKey: scope.ownerKey,
    entityKey: scope.entityKey,
    subject: previous?.subject ?? movie.subject,
    eventCount,
    facts,
    places,
    times,
    dates,
    recurringSignals: mergeSignals(previous?.recurringSignals ?? [], signals, eventCount),
    identitySignals: unique([...(previous?.identitySignals ?? []), ...movie.memoryThread.identitySignals]),
    continuationSignals: unique([...(previous?.continuationSignals ?? []), ...movie.memoryThread.continuationSignals]),
  };
}

export function learnLatentMovieV6(
  scope: MemoryScopeV6,
  prompt: string,
  previous?: EntityMemoryV6,
): LearnedMovieV6 {
  const movie = extractLatentMovieV5(prompt);
  const memory = buildMemory(scope, movie, previous);
  const previousFactKeys = new Set((previous?.facts ?? []).map(normalize));
  const novelFacts = movie.facts.map((fact) => fact.text).filter((text) => !previousFactKeys.has(normalize(text)));
  const recurringFacts = movie.facts.map((fact) => fact.text).filter((text) => previousFactKeys.has(normalize(text)));
  const recurringSignals = memory.recurringSignals.filter((signal) => signal.count >= 2).map((signal) => signal.value);

  return { movie, memory, novelFacts, recurringFacts, recurringSignals };
}

export function sameEntityMemoryV6(a: EntityMemoryV6, b: EntityMemoryV6): boolean {
  return a.key === b.key;
}

export function memoryContinuationV6(memory: EntityMemoryV6): string | undefined {
  const signal = memory.recurringSignals.find((candidate) => candidate.count >= 2);
  if (!signal) return undefined;
  return signal.value;
}
