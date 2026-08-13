import type { LatentMovieV5, MovieFactV5, MovieMemoryThreadV5 } from "./latentMovieExtractorV5.js";

/**
 * Memory is deliberately separate from persistence.
 *
 * The API/DB layer can store the returned thread and facts. The engine can
 * then feed the stored thread back into this function on the next event.
 * No Prisma, Redis, or database knowledge belongs here.
 */
export type MovieMemorySnapshotV5 = {
  thread: MovieMemoryThreadV5;
  facts: MovieFactV5[];
  eventIds: string[];
};

export function appendLatentMovieEventV5(
  previous: MovieMemorySnapshotV5 | undefined,
  movie: LatentMovieV5,
): MovieMemorySnapshotV5 {
  const previousFacts = previous?.facts ?? [];
  const seen = new Set(previousFacts.map((fact) => fact.text.toLowerCase().replace(/[.!?]+$/, "").trim()));
  const newFacts = movie.facts.filter((fact) => {
    const key = fact.text.toLowerCase().replace(/[.!?]+$/, "").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const thread: MovieMemoryThreadV5 = {
    key: previous?.thread.key ?? movie.memoryThread.key,
    subject: previous?.thread.subject ?? movie.subject,
    identitySignals: [...new Set([
      ...(previous?.thread.identitySignals ?? []),
      ...movie.memoryThread.identitySignals,
    ])],
    continuationSignals: [...new Set([
      ...(previous?.thread.continuationSignals ?? []),
      ...movie.memoryThread.continuationSignals,
      ...newFacts.map((fact) => fact.text),
    ])],
    eventCount: (previous?.thread.eventCount ?? 0) + (newFacts.length ? 1 : 0),
  };

  return {
    thread,
    facts: [...previousFacts, ...newFacts],
    eventIds: [...(previous?.eventIds ?? []), movie.memoryThread.key],
  };
}

export function isSameLatentMovieThreadV5(
  a: MovieMemoryThreadV5,
  b: MovieMemoryThreadV5,
): boolean {
  if (a.key === b.key) return true;
  const left = new Set(a.identitySignals.map((x) => x.toLowerCase()));
  return b.identitySignals.some((x) => left.has(x.toLowerCase()));
}
