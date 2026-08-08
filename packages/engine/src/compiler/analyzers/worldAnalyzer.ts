import type { WorldUnderstanding, EmotionUnderstanding, MemoryUnderstanding } from "../models/understandingTypes.js";
import type { ExperienceIntent, ExperienceEntities } from "@qre/contracts";

export function analyzeWorld(input: {
  intent: ExperienceIntent[];
  entities: ExperienceEntities;
  emotions: EmotionUnderstanding;
  memory: MemoryUnderstanding;
}): WorldUnderstanding {
  const domains = new Set<WorldUnderstanding["domains"][number]>();

  if (input.memory.past || input.memory.legacy || input.memory.replay || input.memory.timeCapsule) {
    domains.add("memory_world");
  }
  if (input.emotions.emotions.includes("love") || input.intent.includes("connect")) {
    domains.add("relationship_world");
  }
  if (input.intent.includes("sell") || input.entities.products.length) {
    domains.add("commerce_world");
  }
  if (input.intent.includes("discover") || input.intent.includes("reward") || input.emotions.emotions.includes("wonder")) {
    domains.add("discovery_world");
  }
  if (input.intent.includes("celebrate")) {
    domains.add("culture_world");
  }
  if (input.intent.includes("teach") || input.intent.includes("protect")) {
    domains.add("journey_world");
  }

  // A truly generic prompt is still a journey, but only when no stronger
  // semantic domain was discovered.
  if (!domains.size) domains.add("journey_world");

  const resolved = [...domains];
  return {
    domains: resolved,
    primary: resolved[0],
    confidence: Math.min(1, 0.45 + resolved.length * 0.15),
  };
}
