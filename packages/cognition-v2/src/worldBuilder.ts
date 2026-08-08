import type { CognitiveUnderstanding } from "./types.js";
import type {
  CognitiveEntity,
  CognitiveEvent,
  CognitiveRelationship,
  CognitivePlace,
  CognitiveTemporal,
  CognitiveNarrative,
  CognitiveWorldModel
} from "./worldModel.js";

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map(value => value.trim()))];
}

function buildEntities(
  understanding: CognitiveUnderstanding
): CognitiveEntity[] {
  const entities: CognitiveEntity[] = [];

  for (const person of understanding.people) {
    entities.push({
      text: person,
      kind: "person"
    });
  }

  for (const object of understanding.objects) {
    entities.push({
      text: object,
      kind: "object"
    });
  }

  for (const event of understanding.events) {
    entities.push({
      text: event,
      kind: "event"
    });
  }

  return entities;
}

function buildPlaces(
  understanding: CognitiveUnderstanding
): CognitivePlace[] {
  return unique(understanding.places).map(place => ({
    text: place,
    kind: "place"
  }));
}

function buildEvents(
  understanding: CognitiveUnderstanding
): CognitiveEvent[] {
  return unique(understanding.events).map((event, index) => ({
    id: `event-${index + 1}`,
    text: event,
    date: understanding.dates[index],
    time: understanding.times[index],
    significance: understanding.emotions
  }));
}

function buildRelationships(
  understanding: CognitiveUnderstanding
): CognitiveRelationship[] {
  const relationships: CognitiveRelationship[] = [];

  for (const person of understanding.people) {
    for (const other of understanding.people) {
      if (person === other) continue;

      relationships.push({
        subject: person,
        relation: "associated_with",
        object: other,
        confidence: 0.5
      });
    }
  }

  return relationships;
}

function buildTemporal(
  understanding: CognitiveUnderstanding
): CognitiveTemporal {
  return {
    past: understanding.memory.past,
    present: understanding.memory.present,
    future: understanding.memory.future,
    markers: unique([
      ...understanding.dates,
      ...understanding.times
    ])
  };
}

function buildNarrative(
  understanding: CognitiveUnderstanding
): CognitiveNarrative {
  const text = understanding.prompt.toLowerCase();

  return {
    hasBeginning:
      understanding.memory.past ||
      understanding.events.length > 0,

    hasTransformation:
      understanding.intent.includes("create") ||
      understanding.intent.includes("discover"),

    hasRelationship:
      understanding.intent.includes("connect") ||
      understanding.audience.types.includes("couple") ||
      understanding.people.length > 1,

    hasMemory:
      understanding.memory.past ||
      understanding.memory.legacy,

    hasConflict:
      [
        "conflict",
        "problem",
        "lost",
        "danger",
        "fight",
        "broken",
        "dispute"
      ].some(signal => text.includes(signal)),

    hasMilestone:
      [
        "milestone",
        "birthday",
        "anniversary",
        "launch",
        "first",
        "last"
      ].some(signal => text.includes(signal)),

    hasDiscovery:
      understanding.intent.includes("discover") ||
      understanding.world.domains.includes("discovery")
  };
}

export function buildCognitiveWorld(
  understanding: CognitiveUnderstanding
): CognitiveWorldModel {
  const entities = buildEntities(understanding);
  const places = buildPlaces(understanding);
  const events = buildEvents(understanding);
  const relationships = buildRelationships(understanding);

  const domains = unique([
    ...understanding.world.domains,
    ...understanding.intent,
    ...understanding.audience.types
  ]);

  return {
    entities,
    events,
    relationships,
    places,

    emotions: unique(understanding.emotions),
    desires: [],
    objects: unique(understanding.objects),
    themes: unique([
      ...understanding.world.domains,
      ...understanding.intent
    ]),

    temporal: buildTemporal(understanding),

    narrative: buildNarrative(understanding),

    domains,

    primaryDomain:
      understanding.world.primary ||
      domains[0] ||
      "general"
  };
}
