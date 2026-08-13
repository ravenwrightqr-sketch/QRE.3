import type {
  MemoryContext,
  MemoryEvent,
  MemoryFact,
  MemoryIntelligenceV14,
  MemoryPreferenceV14,
  MemoryRecurrenceV14,
  MemoryAssociationV14,
  MemoryStateV14,
  MemoryLocalInterestV14,
} from "@qre/contracts";
import { compileUniversalMemoryV13, type UniversalMemoryV13 } from "./universalMemoryV13.js";
import type { MemoryScopeV12 } from "./universalMemoryV12.js";
import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const key = (value: string) => normalize(value).replace(/\s+/g, "-");
const unique = <T>(values: T[]) => [...new Set(values)];

const STOP = new Set([
  "the", "and", "that", "this", "with", "from", "into", "when", "then", "was", "were", "been",
  "have", "had", "they", "them", "their", "there", "here", "very", "really", "just", "made", "make",
  "got", "get", "for", "came", "come", "left", "arrived", "back", "again", "another", "apparently",
]);

function tokens(value: string): string[] {
  return unique(normalize(value).split(" ").filter((token) => token.length >= 4 && !STOP.has(token) && !/^\d+$/.test(token)));
}

function eventTokens(event: MemoryEvent): string[] {
  return tokens(event.summary);
}

function explicitPreference(fact: MemoryFact): MemoryPreferenceV14 | undefined {
  const predicate = normalize(fact.predicate);
  const value = fact.value.trim();
  if (!value) return undefined;

  let polarity: MemoryPreferenceV14["polarity"] | undefined;
  if (/\b(like|likes|love|loves|enjoy|enjoys|favorite|favourite|prefer|prefers)\b/.test(predicate)) polarity = predicate.includes("prefer") ? "prefers" : "likes";
  if (/\b(dislike|dislikes|hate|hates|avoid|avoids)\b/.test(predicate)) polarity = predicate.includes("avoid") ? "avoids" : "dislikes";
  if (!polarity || !fact.entityId) return undefined;

  return {
    id: `memory-preference-v14-${fact.id}`,
    entityId: fact.entityId,
    value,
    polarity,
    confidence: fact.confidence,
    evidenceEventIds: fact.sourceRef ? [fact.sourceRef] : [],
    firstObservedAt: fact.observedAt,
    lastObservedAt: fact.observedAt,
    visibility: fact.visibility,
  };
}

function buildRecurrences(memory: UniversalMemoryV13): MemoryRecurrenceV14[] {
  const groups = new Map<string, MemoryEvent[]>();
  for (const event of memory.events) {
    for (const token of eventTokens(event)) {
      const bucket = groups.get(token) ?? [];
      bucket.push(event);
      groups.set(token, bucket);
    }
  }

  return [...groups.entries()]
    .filter(([, events]) => events.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 16)
    .map(([token, events]) => {
      const timestamps = events.map((event) => Date.parse(event.occurredAt)).filter(Number.isFinite).sort((a, b) => a - b);
      const gaps = timestamps.slice(1).map((time, index) => (time - timestamps[index]) / 86_400_000).filter((days) => days > 0);
      const intervalDays = gaps.length ? Math.round(gaps.reduce((sum, days) => sum + days, 0) / gaps.length) : undefined;
      return {
        id: `memory-recurrence-v14-${key(token)}`,
        entityIds: unique(events.flatMap((event) => event.entityIds)),
        key: `recurring:${token}`,
        label: `Recurring ${token}`,
        occurrences: events.length,
        ...(intervalDays ? { intervalDays } : {}),
        confidence: Math.min(0.99, 0.58 + events.length * 0.09),
        evidenceEventIds: events.map((event) => event.id),
        lastObservedAt: events[events.length - 1].occurredAt,
        visibility: "private",
      };
    });
}

function buildAssociations(memory: UniversalMemoryV13): MemoryAssociationV14[] {
  const groups = new Map<string, { left: string; right: string; events: MemoryEvent[] }>();
  for (const event of memory.events) {
    const words = eventTokens(event).slice(0, 8);
    for (let i = 0; i < words.length; i += 1) {
      for (let j = i + 1; j < words.length; j += 1) {
        const left = words[i];
        const right = words[j];
        const pair = [left, right].sort();
        const id = `${pair[0]}::${pair[1]}`;
        const existing = groups.get(id) ?? { left: pair[0], right: pair[1], events: [] };
        existing.events.push(event);
        groups.set(id, existing);
      }
    }
  }

  return [...groups.entries()]
    .filter(([, value]) => value.events.length >= 2)
    .sort((a, b) => b[1].events.length - a[1].events.length)
    .slice(0, 20)
    .map(([pair, value]) => ({
      id: `memory-association-v14-${key(pair)}`,
      entityIds: unique(value.events.flatMap((event) => event.entityIds)),
      left: value.left,
      right: value.right,
      occurrences: value.events.length,
      confidence: Math.min(0.96, 0.52 + value.events.length * 0.08),
      evidenceEventIds: unique(value.events.map((event) => event.id)),
      visibility: "private",
    }));
}

function buildStates(memory: UniversalMemoryV13): MemoryStateV14[] {
  const stateWords = new Set([
    "happy", "sad", "excited", "scared", "calm", "ready", "tired", "curious", "playful", "clean",
    "spotless", "messy", "busy", "quiet", "loud", "new", "old", "open", "closed", "stolen", "chewed",
  ]);

  const states: MemoryStateV14[] = [];
  for (const event of memory.events) {
    for (const token of eventTokens(event)) {
      if (!stateWords.has(token)) continue;
      for (const entityId of event.entityIds) {
        states.push({
          id: `memory-state-v14-${event.id}-${key(entityId)}-${token}`,
          entityId,
          state: token,
          confidence: Math.min(0.95, event.confidence),
          evidenceEventIds: [event.id],
          observedAt: event.occurredAt,
          visibility: "private",
        });
      }
    }
  }
  return states.slice(-32);
}

function buildLocalInterests(memory: UniversalMemoryV13): MemoryLocalInterestV14[] {
  if (!memory.world.locations.length) return [];
  const results: MemoryLocalInterestV14[] = [];
  for (const location of memory.world.locations) {
    const locationWords = new Set(tokens(location.name));
    const nearby = memory.events.filter((event) => eventTokens(event).some((token) => locationWords.has(token)));
    const interestCounts = new Map<string, MemoryEvent[]>();
    for (const event of nearby) {
      for (const token of eventTokens(event)) {
        if (locationWords.has(token)) continue;
        const bucket = interestCounts.get(token) ?? [];
        bucket.push(event);
        interestCounts.set(token, bucket);
      }
    }
    for (const [interest, events] of [...interestCounts.entries()].filter(([, events]) => events.length >= 2).slice(0, 8)) {
      results.push({
        id: `memory-local-interest-v14-${key(location.name)}-${key(interest)}`,
        locationId: location.id,
        subjectEntityIds: unique(events.flatMap((event) => event.entityIds)),
        interest,
        evidenceEventIds: unique(events.map((event) => event.id)),
        occurrences: events.length,
        confidence: Math.min(0.94, 0.5 + events.length * 0.1),
        visibility: location.visibility,
      });
    }
  }
  return results;
}

export type UniversalMemoryV14 = UniversalMemoryV13 & {
  intelligence: MemoryIntelligenceV14;
};

export function compileUniversalMemoryV14(
  scope: MemoryScopeV12,
  prompt: string,
  movie: LatentMovieV5,
  previous?: MemoryContext,
): UniversalMemoryV14 {
  const memory = compileUniversalMemoryV13(scope, prompt, movie, previous);
  const explicit = memory.facts.flatMap((fact) => {
    const preference = explicitPreference(fact);
    return preference ? [preference] : [];
  });

  return {
    ...memory,
    intelligence: {
      preferences: unique(explicit.map((preference) => preference.id)).map((id) => explicit.find((preference) => preference.id === id)!),
      recurrences: buildRecurrences(memory),
      associations: buildAssociations(memory),
      states: buildStates(memory),
      localInterests: buildLocalInterests(memory),
    },
  };
}

export function memoryIntelligenceSignalsV14(memory: UniversalMemoryV14, subjectId: string): string[] {
  return unique([
    ...memory.intelligence.preferences.filter((item) => item.entityId === subjectId).map((item) => `${item.polarity}:${item.value}`),
    ...memory.intelligence.recurrences.filter((item) => item.entityIds.includes(subjectId)).map((item) => item.key),
    ...memory.intelligence.associations.filter((item) => item.entityIds.includes(subjectId)).map((item) => `${item.left}+${item.right}`),
    ...memory.intelligence.states.filter((item) => item.entityId === subjectId).map((item) => `state:${item.state}`),
    ...memory.intelligence.localInterests.filter((item) => item.subjectEntityIds.includes(subjectId)).map((item) => `local:${item.interest}`),
  ]).slice(-48);
}
