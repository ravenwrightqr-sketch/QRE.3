import type {
  MemoryContext,
  MemoryEntity,
  MemoryEvent,
  MemoryFact,
  MemoryRelation,
  MemoryVisibility,
  MemoryWorldV13,
  MemoryLocationV13,
  MemoryMilestoneV13,
  MemoryPatternV13,
  MemoryPreferenceV13,
  MemoryTimeContextV13,
} from "@qre/contracts";
import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { MemoryScopeV12 } from "./universalMemoryV12.js";
import { compileUniversalMemoryV12 } from "./universalMemoryV12.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const key = (value: string) => normalize(value).replace(/\s+/g, "-");
const unique = <T>(values: T[]) => [...new Set(values)];

const STOP = new Set(["the", "and", "that", "this", "with", "from", "into", "when", "then", "was", "were", "been", "have", "had", "they", "them", "their", "there", "here", "very", "really", "just", "made", "make", "got", "get", "for"]);

function tokens(value: string): string[] {
  return unique(normalize(value).split(" ").filter((token) => token.length >= 4 && !STOP.has(token) && !/^\d+$/.test(token)));
}

function parseLocations(movie: LatentMovieV5, visibility: MemoryVisibility): MemoryLocationV13[] {
  const now = new Date().toISOString();
  return unique(movie.facts.flatMap((fact) => fact.places.map(clean)).filter(Boolean)).map((name) => ({
    id: `memory-location-${key(name)}`,
    name,
    canonicalKey: key(name),
    confidence: 0.82,
    visibility,
    observedAt: now,
  }));
}

function parseTimeContexts(movie: LatentMovieV5): MemoryTimeContextV13[] {
  const now = new Date().toISOString();
  return movie.facts.map((fact, index) => {
    const raw = fact.times[0] ?? fact.dates[0];
    const date = fact.dates[0];
    const time = fact.times[0];
    return {
      observedAt: now,
      date,
      time,
      recurrenceKey: date ? date.slice(5) : undefined,
      sequence: index + 1,
      ...(raw ? { metadata: raw } : {}),
    } as MemoryTimeContextV13 & { metadata?: string };
  });
}

function entityKind(memory: MemoryContext, subjectId: string) {
  return memory.entities.find((entity) => entity.id === subjectId)?.kind ?? "other";
}

function buildPatterns(memory: MemoryContext, subjectId: string): MemoryPatternV13[] {
  const events = memory.events.filter((event) => event.entityIds.includes(subjectId));
  const groups = new Map<string, MemoryEvent[]>();
  for (const event of events) {
    for (const token of tokens(event.summary)) {
      const bucket = groups.get(token) ?? [];
      bucket.push(event);
      groups.set(token, bucket);
    }
  }
  return [...groups.entries()]
    .filter(([, evidence]) => evidence.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 16)
    .map(([pattern, evidence]) => ({
      id: `memory-pattern-${key(subjectId)}-${pattern}`,
      subjectEntityIds: unique(evidence.flatMap((event) => event.entityIds)),
      pattern: `recurring:${pattern}`,
      evidenceEventIds: evidence.map((event) => event.id),
      occurrences: evidence.length,
      confidence: Math.min(0.98, 0.55 + evidence.length * 0.1),
      firstObservedAt: evidence[0].occurredAt,
      lastObservedAt: evidence[evidence.length - 1].occurredAt,
      visibility: "private",
    }));
}

function buildPreferences(memory: MemoryContext, subjectId: string, patterns: MemoryPatternV13[]): MemoryPreferenceV13[] {
  return patterns
    .filter((pattern) => pattern.subjectEntityIds.includes(subjectId))
    .slice(0, 12)
    .map((pattern) => ({
      id: `memory-preference-${pattern.id}`,
      entityId: subjectId,
      preference: pattern.pattern.replace(/^recurring:/, ""),
      polarity: "unknown",
      confidence: Math.max(0.4, pattern.confidence - 0.15),
      evidenceEventIds: pattern.evidenceEventIds,
      firstObservedAt: pattern.firstObservedAt,
      lastObservedAt: pattern.lastObservedAt,
      visibility: "private",
    }));
}

function buildMilestones(memory: MemoryContext, subjectId: string, previous?: MemoryContext): MemoryMilestoneV13[] {
  const events = memory.events.filter((event) => event.entityIds.includes(subjectId));
  const previousCount = previous?.events.filter((event) => event.entityIds.includes(subjectId)).length ?? 0;
  return events.slice(-8).flatMap((event, index) => {
    const type: MemoryMilestoneV13["type"] = previousCount === 0 && index === 0 ? "first" : previousCount > 0 && index === 0 ? "return" : "custom";
    return [{
      id: `memory-milestone-${event.id}`,
      entityIds: event.entityIds,
      type,
      title: type === "return" ? "A return" : type === "first" ? "The first time" : "A remembered moment",
      eventId: event.id,
      occurredAt: event.occurredAt,
      confidence: event.confidence,
      visibility: "private",
    }];
  });
}

export type UniversalMemoryV13 = MemoryContext & {
  world: MemoryWorldV13;
};

export function compileUniversalMemoryV13(
  scope: MemoryScopeV12,
  prompt: string,
  movie: LatentMovieV5,
  previous?: MemoryContext,
): UniversalMemoryV13 {
  const base = compileUniversalMemoryV12(scope, prompt, movie, previous);
  const visibility = scope.visibility ?? "private";
  const subjectId = key(movie.subject || base.entities[0]?.name || "subject");
  const locations = parseLocations(movie, visibility);
  const timeContexts = parseTimeContexts(movie);
  const patterns = buildPatterns(base, subjectId);
  const preferences = buildPreferences(base, subjectId, patterns);
  const milestones = buildMilestones(base, subjectId, previous);

  return {
    ...base,
    world: {
      subjectKind: entityKind(base, subjectId),
      locations,
      timeContexts,
      patterns,
      preferences,
      milestones,
    },
  };
}

export function memoryWorldSignalsV13(memory: UniversalMemoryV13, subjectId: string): string[] {
  return unique([
    ...memory.world.locations.map((location) => `place:${location.name}`),
    ...memory.world.patterns.filter((pattern) => pattern.subjectEntityIds.includes(subjectId)).map((pattern) => pattern.pattern),
    ...memory.world.preferences.filter((preference) => preference.entityId === subjectId).map((preference) => `${preference.polarity}:${preference.preference}`),
    ...memory.world.milestones.filter((milestone) => milestone.entityIds.includes(subjectId)).map((milestone) => milestone.title),
  ]).slice(-32);
}
