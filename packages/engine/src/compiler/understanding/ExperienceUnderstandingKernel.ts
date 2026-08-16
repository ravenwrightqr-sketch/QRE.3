import { analyzeIntent } from "../analyzers/intentAnalyzer.js";
import { analyzeEntities } from "../analyzers/entityAnalyzer.js";
import { analyzeRelationships } from "../analyzers/relationshipAnalyzer.js";
import { analyzeEmotion } from "../analyzers/emotionAnalyzer.js";
import { analyzeMemory } from "../analyzers/memoryAnalyzer.js";
import { analyzeAudience } from "../analyzers/audienceAnalyzer.js";
import { analyzeWorld } from "../analyzers/worldAnalyzer.js";
import { analyzeDNA } from "../analyzers/dnaAnalyzer.js";
import { calculateConfidence } from "../analyzers/confidenceAnalyzer.js";
import type { ExperienceUnderstanding } from "../models/understandingTypes.js";
import type { ExperienceIntent } from "@qre/contracts";

/**
 * Canonical semantic boundary.
 *
 * Primitive analyzers extract evidence. This kernel is the only layer allowed
 * to reconcile that evidence into a coherent human interpretation.
 * Downstream compilers consume this object and must not reinterpret the prompt.
 */
function reconcileIntent(
  prompt: string,
  lexical: ExperienceIntent[],
): ExperienceIntent[] {
  const text = prompt.toLowerCase();
  const intents = new Set<ExperienceIntent>(lexical);

  const semanticPhrases: Array<[ExperienceIntent, string[]]> = [
    ["discover", ["treasure hunt", "scavenger hunt", "quest", "adventure", "mystery", "explore"]],
    ["reward", ["treasure hunt", "scavenger hunt", "prize", "unlock", "surprise"]],
    ["teach", ["make knowledge interactive", "interactive lesson", "teach someone", "help someone learn", "how to"]],
    ["remember", ["preserve", "preserve forever", "time capsule", "keep forever", "capture the moment"]],
    ["protect", ["missing", "lost", "find my", "keep safe", "rescue"]],
    ["sell", ["brand experience", "luxury brand", "customer experience", "product experience"]],
    ["connect", ["bring people together", "shared experience", "for my family", "with friends"]],
    ["celebrate", ["wedding", "birthday", "anniversary", "milestone", "celebration"]],
  ];

  for (const [intent, phrases] of semanticPhrases) {
    if (phrases.some((phrase) => text.includes(phrase))) intents.add(intent);
  }

  return [...intents];
}

function reconcileDNA(
  prompt: string,
  intents: ExperienceIntent[],
  emotions: string[],
  base: ReturnType<typeof analyzeDNA>,
): ReturnType<typeof analyzeDNA> {
  const text = prompt.toLowerCase();
  const traits = new Set(base.traits);

  if (/treasure hunt|scavenger hunt|quest|game|play|kids|children/.test(text)) {
    traits.add("playful");
    traits.add("interactive");
    traits.add("adventurous");
  }
  if (/myster|secret|unknown|luxury|elegant|dark|gothic|cyber/.test(text)) traits.add("atmospheric");
  if (/cinematic|film|movie|visual|scene/.test(text)) traits.add("cinematic");
  if (/interactive|choose|choice|challenge|clue|hunt|game/.test(text)) traits.add("interactive");
  if (emotions.includes("excitement")) traits.add("energetic");
  if (intents.includes("teach")) traits.add("educational");
  if (intents.includes("protect")) traits.add("actionable");
  if (intents.includes("sell")) traits.add("persuasive");

  return {
    ...base,
    traits: [...traits],
    style: {
      atmosphere: emotions,
      visual: [...traits].filter((value) => ["cinematic", "atmospheric", "mysterious", "premium"].includes(value)),
      interaction: [...traits].filter((value) => ["interactive", "playful", "actionable"].includes(value)),
    },
  };
}

export function understandExperience(prompt: string): ExperienceUnderstanding {
  const normalized = prompt.trim();
  if (!normalized) throw new Error("Cannot understand empty experience");

  const lexicalIntent = analyzeIntent(normalized);
  const entities = analyzeEntities(normalized);
  const relationships = analyzeRelationships(normalized, entities);
  const emotions = analyzeEmotion(normalized);
  const memory = analyzeMemory(normalized);
  const audience = analyzeAudience(normalized);
  const intent = reconcileIntent(normalized, lexicalIntent);
  const world = analyzeWorld({ intent, entities, emotions, memory });
  const dna = reconcileDNA(
    normalized,
    intent,
    emotions.emotions,
    analyzeDNA({ prompt: normalized, intent, emotions, world }),
  );

  const semantic = Math.min(
    1,
    0.25 +
      (intent.length ? 0.2 : 0) +
      (entities.keywords.length ? 0.15 : 0) +
      (relationships.length ? 0.15 : 0) +
      (emotions.emotions.length ? 0.15 : 0) +
      (world.domains.length ? 0.1 : 0),
  );

  const scores = {
    semantic,
    entity: entities.keywords.length || entities.events.length || entities.products.length ? 0.8 : 0.35,
    relationship: relationships.length ? 0.8 : 0.3,
    emotional: emotions.emotions.length ? Math.min(1, 0.35 + emotions.intensity) : 0.25,
    memory: memory.past || memory.future || memory.legacy || memory.replay || memory.timeCapsule ? 0.9 : 0.3,
    world: world.confidence,
    dna: dna.traits.length > 1 ? 0.8 : 0.4,
    overall: semantic,
  };

  const confidence = calculateConfidence({
    intent,
    entities,
    relationships,
    emotions,
    memory,
    audience,
    world,
    dna,
  });

  return {
    prompt: normalized,
    intent,
    entities,
    relationships,
    emotions,
    memory,
    audience,
    world,
    dna,
    scores,
    confidence,
  };
}
