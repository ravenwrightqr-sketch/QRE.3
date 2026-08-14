import { extractLatentMovieV5, type LatentMovieV5 } from "./latentMovieExtractorV5.js";

/**
 * V6 turns the latent movie into a learning loop without coupling the engine
 * to Prisma, Redis, or any persistence implementation.
 *
 * Memory is scoped by owner + entity.
 *
 * The important distinction is:
 *
 *   OWNER
 *     ↓
 *   ENTITY
 *     ↓
 *   EXPERIENCES
 *     ↓
 *   LEARNED PATTERNS
 *
 * "Coco" is therefore never a global memory key.
 *
 * Bettie's Coco:
 *   memory:bettie-groomer:coco
 *
 * Another groomer's Coco:
 *   memory:other-groomer:coco
 *
 * Bettie's Patty:
 *   memory:bettie-groomer:patty
 *
 * They can all exist independently.
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

  /**
   * Number of experience events associated with this entity.
   */
  eventCount: number;

  /**
   * Raw facts retained as memory.
   */
  facts: string[];

  /**
   * Structured temporal/geographic memory.
   */
  places: string[];
  times: string[];
  dates: string[];

  /**
   * Learned lexical/contextual signals.
   */
  recurringSignals: LearnedSignalV6[];

  /**
   * Signals useful for identifying this entity.
   */
  identitySignals: string[];

  /**
   * Signals useful for continuing the entity's story.
   */
  continuationSignals: string[];
};

export type LearnedMovieV6 = {
  movie: LatentMovieV5;
  memory: EntityMemoryV6;

  /**
   * Facts that did not previously exist in the entity memory.
   */
  novelFacts: string[];

  /**
   * Facts that appear to continue something previously learned.
   */
  recurringFacts: string[];

  /**
   * Learned signals with enough evidence to be considered recurring.
   */
  recurringSignals: string[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const clean = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const unique = <T>(values: T[]) =>
  [...new Set(values)];

function scopedSegment(value: string, fallback: string): string {
  return normalize(value).replace(/\s+/g, "-") || fallback;
}

function scopedKey(scope: MemoryScopeV6): string {
  const owner = scopedSegment(scope.ownerKey, "anonymous");
  const entity = scopedSegment(scope.entityKey, "entity");

  return `memory:${owner}:${entity}`;
}

/**
 * Merge incoming observations into learned signals.
 *
 * This deliberately counts observations across EVENTS rather than merely
 * counting repeated words inside one event.
 *
 * Example:
 *
 * Visit 1:
 *   Coco loved the bath.
 *
 * Visit 2:
 *   Coco loved the bath again.
 *
 * Result:
 *
 *   bath → count 2
 *
 * That is the beginning of actual longitudinal memory.
 */
function mergeSignals(
  previous: LearnedSignalV6[],
  incoming: string[],
  eventNumber: number,
): LearnedSignalV6[] {
  const byValue = new Map(
    previous.map((signal) => [
      normalize(signal.value),
      { ...signal },
    ]),
  );

  for (const raw of incoming) {
    const value = clean(raw);
    const key = normalize(value);

    if (!key) continue;

    const current = byValue.get(key);

    if (current) {
      current.count += 1;
      current.lastSeen = eventNumber;
    } else {
      byValue.set(key, {
        value,
        count: 1,
        firstSeen: eventNumber,
        lastSeen: eventNumber,
      });
    }
  }

  return [...byValue.values()].sort(
    (a, b) =>
      b.count - a.count ||
      a.firstSeen - b.firstSeen,
  );
}

/**
 * Words that are useful as candidate learning signals.
 *
 * This is intentionally conservative.
 *
 * The movie writer should not blindly turn every noun into "personality."
 * These are observations first. Repetition gives them weight.
 */
function lexicalLearningSignals(
  movie: LatentMovieV5,
): string[] {
  const stop = new Set([
    "the",
    "and",
    "was",
    "were",
    "with",
    "that",
    "this",
    "then",
    "from",
    "into",
    "when",
    "she",
    "he",
    "they",
    "her",
    "his",
    "their",
    "came",
    "went",
    "arrived",
    "left",
    "today",
    "there",
    "here",
    "just",
    "very",
    "really",
    "made",
    "make",
    "got",
    "get",
    "for",
    "again",
  ]);

  const candidates: string[] = [];

  for (const fact of movie.facts) {
    for (const token of normalize(fact.text).split(" ")) {
      if (
        token.length < 4 ||
        stop.has(token) ||
        /^\d+$/.test(token)
      ) {
        continue;
      }

      candidates.push(token);
    }
  }

  return unique(candidates);
}

/**
 * Build/update the entity memory.
 *
 * IMPORTANT:
 * This function only learns.
 *
 * It does NOT write prose.
 * It does NOT inject mechanics.
 * It does NOT tell the movie how to sound.
 *
 * That separation is critical.
 */
function buildMemory(
  scope: MemoryScopeV6,
  movie: LatentMovieV5,
  previous?: EntityMemoryV6,
): EntityMemoryV6 {
  const eventCount =
    (previous?.eventCount ?? 0) + 1;

  const facts = unique([
    ...(previous?.facts ?? []),
    ...movie.facts.map((fact) => fact.text),
  ]);

  const places = unique([
    ...(previous?.places ?? []),
    ...movie.facts.flatMap((fact) => fact.places),
  ]);

  const times = unique([
    ...(previous?.times ?? []),
    ...movie.facts.flatMap((fact) => fact.times),
  ]);

  const dates = unique([
    ...(previous?.dates ?? []),
    ...movie.facts.flatMap((fact) => fact.dates),
  ]);

  const signals = unique([
    ...movie.memoryThread.identitySignals,
    ...movie.memoryThread.continuationSignals,
    ...movie.facts.flatMap((fact) => fact.places),
    ...lexicalLearningSignals(movie),
  ]);

  return {
    key: scopedKey(scope),
    ownerKey: scope.ownerKey,
    entityKey: scope.entityKey,

    subject:
      previous?.subject ??
      movie.subject,

    eventCount,

    facts,
    places,
    times,
    dates,

    recurringSignals: mergeSignals(
      previous?.recurringSignals ?? [],
      signals,
      eventCount,
    ),

    identitySignals: unique([
      ...(previous?.identitySignals ?? []),
      ...movie.memoryThread.identitySignals,
    ]),

    continuationSignals: unique([
      ...(previous?.continuationSignals ?? []),
      ...movie.memoryThread.continuationSignals,
    ]),
  };
}

/**
 * Determine whether a new fact contains a signal that the entity has
 * previously demonstrated.
 *
 * This is intentionally different from exact fact matching.
 *
 * Example:
 *
 * Previous:
 *   "Coco loved the bath."
 *
 * Current:
 *   "She enjoyed another bath."
 *
 * These are different facts but represent the same learned behavior.
 */
function factHasRecurringSignal(
  factText: string,
  previous: EntityMemoryV6 | undefined,
): boolean {
  if (!previous) return false;

  const factTokens = new Set(
    normalize(factText)
      .split(" ")
      .filter((token) => token.length >= 4),
  );

  return previous.recurringSignals.some((signal) => {
    const signalToken = normalize(signal.value);

    return (
      signalToken.length >= 4 &&
      factTokens.has(signalToken)
    );
  });
}

/**
 * Return the strongest learned signals.
 *
 * This is useful later when the movie realization layer needs to know:
 *
 *   "What does this entity seem to do repeatedly?"
 *
 * We keep this separate from the movie prose itself.
 */
function recurringSignalValues(
  memory: EntityMemoryV6,
): string[] {
  return memory.recurringSignals
    .filter((signal) => signal.count >= 2)
    .map((signal) => signal.value);
}

/**
 * Learn one new experience against an existing entity memory.
 *
 * This is the main V6 learning boundary.
 *
 * The sequence is:
 *
 *   PROMPT
 *     ↓
 *   LATENT MOVIE EXTRACTION
 *     ↓
 *   ENTITY MEMORY MERGE
 *     ↓
 *   NOVEL / RECURRING CLASSIFICATION
 *     ↓
 *   LEARNED SIGNALS
 *
 * The resulting object can then be persisted by the API layer.
 */
export function learnLatentMovieV6(
  scope: MemoryScopeV6,
  prompt: string,
  previous?: EntityMemoryV6,
): LearnedMovieV6 {
  const movie = extractLatentMovieV5(prompt);

  const memory = buildMemory(
    scope,
    movie,
    previous,
  );

  const previousFactKeys = new Set(
    (previous?.facts ?? []).map(normalize),
  );

  /**
   * Completely new observations.
   */
  const novelFacts = movie.facts
    .map((fact) => fact.text)
    .filter(
      (text) =>
        !previousFactKeys.has(normalize(text)),
    );

  /**
   * Recurring observations.
   *
   * A fact qualifies either because it is literally repeated,
   * or because it contains a previously learned signal.
   */
  const recurringFacts = movie.facts
    .map((fact) => fact.text)
    .filter((text) => {
      if (previousFactKeys.has(normalize(text))) {
        return true;
      }

      return factHasRecurringSignal(
        text,
        previous,
      );
    });

  const recurringSignals =
    recurringSignalValues(memory);

  return {
    movie,
    memory,
    novelFacts,
    recurringFacts,
    recurringSignals,
  };
}

/**
 * Entity identity comparison.
 *
 * Memory scope is authoritative.
 *
 * Never compare entities using the word "Coco" alone.
 */
export function sameEntityMemoryV6(
  a: EntityMemoryV6,
  b: EntityMemoryV6,
): boolean {
  return a.key === b.key;
}

/**
 * Return a learned continuation signal.
 *
 * This is deliberately only a signal.
 *
 * It is NOT prose.
 *
 * The realization layer decides whether and how that signal becomes
 * visible in the movie.
 */
export function memoryContinuationV6(
  memory: EntityMemoryV6,
): string | undefined {
  const signal =
    memory.recurringSignals.find(
      (candidate) =>
        candidate.count >= 2 &&
        candidate.value.length >= 4,
    );

  return signal?.value;
}