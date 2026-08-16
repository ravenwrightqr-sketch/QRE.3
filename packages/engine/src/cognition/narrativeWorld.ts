import type { WorldEvent, WorldModel } from "./worldModel.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];

function sourceSentences(prompt: string): string[] {
  return unique(clean(prompt).split(/(?<=[.!?])\s+|\n+/).filter(Boolean).filter((value) => !/^\s*(?:make|write|tell|show)\s+(?:it|this|that|something)\b/i.test(value)));
}

function tokenSet(value: string): Set<string> {
  return new Set(sentence(value).toLowerCase().split(/[^a-z0-9’'-]+/).filter((token) => token.length >= 3));
}

function overlapScore(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function sourceGroup(event: WorldEvent, sources: string[], index: number): number {
  const raw = sentence(event.raw);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < sources.length; i += 1) {
    const score = overlapScore(raw, sources[i] ?? "") - Math.abs(i - index / Math.max(1, event.order + 1)) * 0.02;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function mergeEvents(events: WorldEvent[], raw: string, order: number): WorldEvent {
  const participants = unique(events.flatMap((event) => event.participants));
  const objects = unique(events.flatMap((event) => [event.object ?? ""]));
  const places = unique(events.flatMap((event) => [event.place ?? ""]));
  const times = unique(events.flatMap((event) => [event.time ?? ""]));
  const details = unique(events.flatMap((event) => event.details));
  const evidence = events.flatMap((event) => event.evidence);
  const action = events.map((event) => event.action).find(Boolean);
  const state = events.map((event) => event.state).find(Boolean);
  return {
    id: `narrative-${order + 1}`,
    raw: sentence(raw),
    participants,
    action,
    state,
    object: objects[0],
    place: places[0],
    time: times[0],
    details,
    order,
    evidence,
    resolvedFromMemory: events.some((event) => event.resolvedFromMemory),
  };
}

function rebuildRelations(world: WorldModel, events: WorldEvent[]) {
  const relations = [...world.relations] as WorldModel["relations"];
  for (const event of events) {
    for (const participant of event.participants) {
      if (event.place) relations.push({ from: participant, relation: "experienced_at", to: event.place, evidenceId: `${event.id}-place` });
      if (event.object) relations.push({ from: participant, relation: "acted_on", to: event.object, evidenceId: `${event.id}-object` });
    }
    for (let i = 0; i < event.participants.length; i += 1) {
      for (let j = i + 1; j < event.participants.length; j += 1) {
        const left = event.participants[i]!;
        const right = event.participants[j]!;
        relations.push({ from: left, relation: "shared_event", to: right, evidenceId: `${event.id}-raw` });
        relations.push({ from: right, relation: "shared_event", to: left, evidenceId: `${event.id}-raw` });
      }
    }
  }
  return relations;
}

export function collapseToNarrativeWorld(world: WorldModel): WorldModel {
  const sources = sourceSentences(world.prompt);
  if (!sources.length) return world;

  const buckets = sources.map(() => [] as WorldEvent[]);
  for (const event of world.events) {
    const target = sourceGroup(event, sources, event.order);
    buckets[Math.min(buckets.length - 1, Math.max(0, target))]!.push(event);
  }

  const events = sources
    .map((raw, index) => mergeEvents(buckets[index] ?? [], raw, index))
    .filter((event) => event.raw.length >= 5);

  const participants = unique([...world.participants, ...events.flatMap((event) => event.participants)]);
  const places = unique([...world.places, ...events.flatMap((event) => [event.place ?? ""])]);
  const times = unique([...world.times, ...events.flatMap((event) => [event.time ?? ""])]);
  const objects = unique([...world.entitiesByKind.objects, ...events.flatMap((event) => [event.object ?? "", ...event.details])]);
  const entities = unique([...world.entities, ...participants, ...places, ...objects]);
  const evidence = [...world.evidence, ...events.flatMap((event) => event.evidence)].filter((item, index, all) => index === all.findIndex((other) => other.id === item.id));

  return {
    ...world,
    events,
    participants,
    places,
    times,
    entities,
    evidence,
    relations: rebuildRelations(world, events),
    entitiesByKind: {
      ...world.entitiesByKind,
      people: participants,
      places,
      times,
      events: events.map((event) => event.raw),
      objects,
    },
  };
}
