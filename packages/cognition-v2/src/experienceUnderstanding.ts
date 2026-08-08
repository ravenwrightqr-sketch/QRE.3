import type { ExperienceUnderstanding, ExperienceEntities, ExperienceIntent, WorldDomain } from "@qre/contracts";
import type { CognitiveUnderstanding } from "./types.js";

const supportedIntents = new Set<ExperienceIntent>([
  "remember", "celebrate", "serve", "teach", "sell", "discover", "reward", "protect", "connect",
]);

function domainFor(value: string): WorldDomain | null {
  const domains: Record<string, WorldDomain> = {
    memory: "memory_world",
    wedding: "relationship_world",
    relationship: "relationship_world",
    commerce: "commerce_world",
    discovery: "discovery_world",
    community: "community_world",
    service: "service_world",
    culture: "culture_world",
  };
  return domains[value] ?? null;
}

function entitiesFrom(input: CognitiveUnderstanding): ExperienceEntities {
  const resolved = [
    ...input.people.map(name => ({ name, type: "person" as const, attributes: [], significance: 0.8, meaning: [] })),
    ...input.places.map(name => ({ name, type: "place" as const, attributes: [], significance: 0.7, meaning: [] })),
    ...input.objects.map(name => ({ name, type: "object" as const, attributes: [], significance: 0.7, meaning: [] })),
  ];

  return {
    resolved,
    relationships: [],
    people: input.people,
    places: input.places,
    organizations: [],
    dates: input.dates,
    times: input.times,
    events: input.events,
    products: [],
    urls: [],
    emails: [],
    phones: [],
    media: [],
    keywords: [...new Set([...input.intent, ...input.emotions, ...input.objects])],
    objects: input.objects,
    creatures: input.objects.filter(value => /dog|cat|pet|horse|bird/i.test(value)),
    concepts: [],
    symbols: [],
    worlds: [],
    archetypes: [],
  };
}

export function buildExperienceUnderstanding(input: CognitiveUnderstanding): ExperienceUnderstanding {
  const worldDomains = input.world.domains.map(domainFor).filter((value): value is WorldDomain => value !== null);
  const canonicalIntent = input.intent.filter((value): value is ExperienceIntent => supportedIntents.has(value as ExperienceIntent));
  const evidence = [...input.people, ...input.places, ...input.objects, ...input.dates, ...input.times, ...input.events];
  const semanticScore = evidence.length || canonicalIntent.length ? 0.8 : 0.4;
  const worldConfidence = worldDomains.length ? 0.8 : 0;

  return {
    prompt: input.prompt,
    intent: canonicalIntent,
    humanIntent: {
      expression: input.prompt,
      motivations: [],
      desiredOutcome: [],
      evidence,
      unresolved: canonicalIntent.length ? [] : [input.prompt],
    },
    entities: entitiesFrom(input),
    relationships: [],
    emotions: {
      emotions: input.emotions,
      atmosphere: input.emotions,
      intensity: input.emotions.length ? 0.7 : 0,
      primary: input.emotions[0],
    },
    memory: {
      ...input.memory,
      replay: input.memory.past,
      timeCapsule: input.memory.legacy,
      mode: input.memory.legacy ? "legacy" : input.memory.past ? "timeline" : "none",
    },
    audience: {
      types: input.audience.types,
      social: input.audience.social,
      roles: [],
      relationship: [],
      behaviors: [],
      expectations: [],
      primary: input.audience.types[0],
    },
    world: {
      domains: worldDomains,
      primary: worldDomains[0] ?? "journey_world",
      confidence: worldConfidence,
    },
    dna: {
      traits: [],
      style: { atmosphere: input.emotions, visual: input.objects, interaction: [] },
    },
    desire: { desires: [], motivations: [], goals: [], fears: [], aspirations: [] },
    sensory: { visual: input.objects, audio: [], physical: [], environmental: input.places },
    potential: { possibilities: [], constraints: [], opportunities: [] },
    scores: {
      semantic: semanticScore,
      entity: evidence.length ? 0.8 : 0,
      relationship: input.people.length > 1 ? 0.8 : 0,
      emotional: input.emotions.length ? 0.8 : 0,
      memory: input.memory.past || input.memory.legacy ? 0.9 : 0,
      world: worldConfidence,
      dna: 0,
      overall: semanticScore,
    },
    confidence: semanticScore,
  };
}
