import type {
  ExperienceUnderstanding,
  ExperienceIntent,
  ExperienceEntities,
  WorldDomain,
} from "@qre/contracts";
import type { CognitiveUnderstanding } from "./types.js";
import { buildCognitiveExperiencePlan } from "./experiencePlan.js";

const intents: ExperienceIntent[] = [
  "remember",
  "celebrate",
  "serve",
  "teach",
  "sell",
  "discover",
  "reward",
  "protect",
  "connect",
];

function domainFor(value: string): WorldDomain | null {
  const map: Record<string, WorldDomain> = {
    memory: "memory_world",
    wedding: "relationship_world",
    relationship: "relationship_world",
    commerce: "commerce_world",
    discovery: "discovery_world",
    community: "community_world",
  };
  return map[value] ?? null;
}

function entitiesFrom(input: CognitiveUnderstanding): ExperienceEntities {
  return {
    resolved: [
      ...input.people.map(name => ({ name, type: "person" as const, attributes: [], significance: 0.8, meaning: [] })),
      ...input.places.map(name => ({ name, type: "place" as const, attributes: [], significance: 0.7, meaning: [] })),
      ...input.objects.map(name => ({ name, type: "object" as const, attributes: [], significance: 0.8, meaning: [] })),
    ],
    relationships: [],
    people: input.people,
    places: input.places,
    organizations: [],
    dates: input.dates,
    times: input.times,
    events: input.events,
    products: input.objects.filter(value => /product|tag|qr|jewelry|clothing|surfboard/i.test(value)),
    urls: [],
    emails: [],
    phones: [],
    media: input.objects.filter(value => /photo|photograph|video|album/i.test(value)),
    keywords: [...input.intent, ...input.emotions, ...input.world.domains],
    objects: input.objects,
    creatures: input.objects.filter(value => /dog|cat|pet/i.test(value)),
    concepts: input.emotions,
    symbols: [],
    worlds: [],
    archetypes: input.experiencePlan?.storyStructure ?? [],
  };
}

export function buildExperienceUnderstanding(
  input: CognitiveUnderstanding,
): ExperienceUnderstanding {
  const plan = input.experiencePlan ?? buildCognitiveExperiencePlan(input);
  const worldDomains = input.world.domains
    .map(domainFor)
    .filter((value): value is WorldDomain => value !== null);
  const canonicalIntent = input.intent.filter(
    (value): value is ExperienceIntent => intents.includes(value as ExperienceIntent),
  );

  const evidence = [
    ...input.people,
    ...input.places,
    ...input.objects,
    ...input.dates,
    ...input.times,
  ];

  const overall = evidence.length || canonicalIntent.length ? 0.8 : 0.4;

  return {
    prompt: input.prompt,
    intent: canonicalIntent,
    humanIntent: {
      expression: input.prompt,
      motivations: plan.purpose,
      desiredOutcome: plan.contentOpportunities,
      evidence,
      unresolved: plan.assumptions,
    },
    entities: entitiesFrom(input),
    relationships: [],
    emotions: {
      emotions: input.emotions,
      atmosphere: input.emotions,
      intensity: input.emotions.length ? 0.7 : 0.3,
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
      behaviors: plan.socialOpportunities,
      expectations: plan.purpose,
      primary: input.audience.types[0],
    },
    world: {
      domains: worldDomains.length ? worldDomains : ["discovery_world"],
      primary: worldDomains[0] ?? "discovery_world",
      confidence: overall,
    },
    dna: {
      traits: ["human-centered", "adaptive", "subject-native"],
      style: {
        atmosphere: input.emotions,
        visual: plan.contentOpportunities,
        interaction: plan.interactionModel,
      },
    },
    desire: {
      desires: plan.purpose,
      motivations: plan.purpose,
      goals: plan.contentOpportunities,
      fears: [],
      aspirations: plan.futureEvolution,
    },
    sensory: {
      visual: plan.contentOpportunities,
      audio: [],
      physical: [],
      environmental: plan.geographicOpportunities,
    },
    potential: {
      possibilities: plan.storyStructure,
      constraints: plan.assumptions,
      opportunities: [
        ...plan.discoveryOpportunities,
        ...plan.commerceOpportunities,
        ...plan.rewardOpportunities,
      ],
    },
    scores: {
      semantic: overall,
      entity: evidence.length ? 0.8 : 0.4,
      relationship: input.people.length > 1 ? 0.8 : 0.4,
      emotional: input.emotions.length ? 0.8 : 0.4,
      memory: input.memory.past || input.memory.legacy ? 0.9 : 0.4,
      world: worldDomains.length ? 0.8 : 0.4,
      dna: 0.8,
      overall,
    },
    confidence: overall,
  };
}
