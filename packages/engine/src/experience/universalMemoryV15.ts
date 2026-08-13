import type {
  MemoryContext,
  MemoryEvent,
  MemoryForesightV15,
  MemoryCueV15,
  MemoryTemporalPatternV15,
} from "@qre/contracts";
import { compileUniversalMemoryV14, type UniversalMemoryV14 } from "./universalMemoryV14.js";
import type { MemoryScopeV12 } from "./universalMemoryV12.js";
import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const key = (value: string) => normalize(value).replace(/\s+/g, "-");
const unique = <T>(values: T[]) => [...new Set(values)];

function temporalKey(timestamp: string): string[] {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return [];
  const hour = date.getUTCHours();
  const part = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const day = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase();
  const month = date.getUTCMonth();
  const season = month < 2 || month === 11 ? "winter" : month < 5 ? "spring" : month < 8 ? "summer" : "autumn";
  return [`time:${part}`, `day:${day}`, `season:${season}`, `month:${month + 1}`];
}

function buildTemporalPatterns(memory: UniversalMemoryV14): MemoryTemporalPatternV15[] {
  const groups = new Map<string, MemoryEvent[]>();
  for (const event of memory.events) {
    for (const token of temporalKey(event.occurredAt)) {
      const bucket = groups.get(token) ?? [];
      bucket.push(event);
      groups.set(token, bucket);
    }
  }

  return [...groups.entries()]
    .filter(([, events]) => events.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .map(([token, events]) => ({
      id: `memory-temporal-v15-${key(token)}`,
      entityIds: unique(events.flatMap((event) => event.entityIds)),
      key: token,
      label: token.replace(/:/g, " "),
      occurrences: events.length,
      confidence: Math.min(0.97, 0.55 + events.length * 0.08),
      evidenceEventIds: unique(events.map((event) => event.id)),
      lastObservedAt: events.at(-1)?.occurredAt ?? memory.generatedAt,
      visibility: "private",
    }));
}

function buildCues(memory: UniversalMemoryV14): MemoryCueV15[] {
  const cues: MemoryCueV15[] = [];
  const events = memory.events;
  const last = events.at(-1);
  if (!last) return cues;

  if (events.length > 1) {
    cues.push({
      id: "memory-cue-v15-returning",
      entityIds: unique(last.entityIds),
      cue: "returning",
      kind: "returning",
      confidence: Math.min(0.98, 0.65 + events.length * 0.07),
      evidenceEventIds: events.slice(-3).map((event) => event.id),
      visibility: "private",
    });
  }

  for (const preference of memory.intelligence.preferences.slice(-12)) {
    cues.push({
      id: `memory-cue-v15-preference-${preference.id}`,
      entityIds: [preference.entityId],
      cue: `${preference.polarity}:${preference.value}`,
      kind: "preference",
      confidence: preference.confidence,
      evidenceEventIds: preference.evidenceEventIds,
      visibility: preference.visibility,
    });
  }

  for (const location of memory.world.locations.slice(-8)) {
    const entityIds = unique(memory.events.filter((event) => event.occurredAt === location.observedAt || event.summary.toLowerCase().includes(location.name.toLowerCase())).flatMap((event) => event.entityIds));
    cues.push({
      id: `memory-cue-v15-place-${location.id}`,
      entityIds: entityIds.length ? entityIds : unique(last.entityIds),
      cue: `place:${location.name}`,
      kind: "place",
      confidence: location.confidence,
      evidenceEventIds: events.filter((event) => event.summary.toLowerCase().includes(location.name.toLowerCase())).slice(-3).map((event) => event.id),
      visibility: location.visibility,
    });
  }

  for (const temporal of buildTemporalPatterns(memory)) {
    cues.push({
      id: `memory-cue-v15-time-${temporal.id}`,
      entityIds: temporal.entityIds,
      cue: temporal.key,
      kind: temporal.key.startsWith("season:") ? "seasonal" : "time",
      confidence: temporal.confidence,
      evidenceEventIds: temporal.evidenceEventIds,
      visibility: temporal.visibility,
    });
  }

  for (const milestone of memory.world.milestones.slice(-8)) {
    cues.push({
      id: `memory-cue-v15-milestone-${milestone.id}`,
      entityIds: milestone.entityIds,
      cue: milestone.title,
      kind: "milestone",
      confidence: milestone.confidence,
      evidenceEventIds: [milestone.eventId],
      visibility: milestone.visibility,
    });
  }

  for (const state of memory.intelligence.states.slice(-8)) {
    cues.push({
      id: `memory-cue-v15-state-${state.id}`,
      entityIds: [state.entityId],
      cue: `state:${state.state}`,
      kind: "state",
      confidence: state.confidence,
      evidenceEventIds: state.evidenceEventIds,
      visibility: state.visibility,
    });
  }

  return unique(cues.map((cue) => JSON.stringify(cue))).map((value) => JSON.parse(value) as MemoryCueV15).slice(-64);
}

export type UniversalMemoryV15 = UniversalMemoryV14 & {
  foresight: MemoryForesightV15;
};

export function compileUniversalMemoryV15(
  scope: MemoryScopeV12,
  prompt: string,
  movie: LatentMovieV5,
  previous?: MemoryContext,
): UniversalMemoryV15 {
  const memory = compileUniversalMemoryV14(scope, prompt, movie, previous);
  return {
    ...memory,
    foresight: {
      temporalPatterns: buildTemporalPatterns(memory),
      cues: buildCues(memory),
    },
  };
}

export function memoryForesightSignalsV15(memory: UniversalMemoryV15, subjectId: string): string[] {
  return unique([
    ...memory.foresight.temporalPatterns.filter((item) => item.entityIds.includes(subjectId)).map((item) => item.key),
    ...memory.foresight.cues.filter((item) => item.entityIds.includes(subjectId)).map((item) => `${item.kind}:${item.cue}`),
  ]).slice(-64);
}
