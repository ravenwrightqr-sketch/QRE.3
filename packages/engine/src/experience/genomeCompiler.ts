import type { ExperienceIntent, ExperienceWorld } from "@qre/contracts";
import {
  compileCognitiveExperience,
  type CognitiveCompiledExperience,
} from "./cognitiveExperienceCompiler.js";
import type { StoryCompilerContext } from "./universalStoryCompiler.js";

/**
 * ============================================================
 * QRE GENOME COMPILER — COMPATIBILITY BOUNDARY
 * ============================================================
 *
 * PURPOSE:
 *   Preserve the historical genome/world-shaped API while routing all
 *   prompt intelligence through the canonical cognitive compiler.
 *
 * CANONICAL PIPELINE:
 *   PROMPT → COGNITION → PLAN → UNIVERSAL COMPILATION → GENOME / WORLD
 *
 * ARCHITECTURE RULE:
 *   THE COMPILER BECOMES SMARTER.
 *   IT DOES NOT INVENT ANOTHER ARCHITECTURE.
 *
 * CONTRACT RULE:
 *   ExperienceIntent comes only from @qre/contracts. This compatibility
 *   boundary must not create a second intent type.
 *
 * CONTINUITY RULE:
 *   This file is an adapter for old callers, not a competing compiler brain.
 *
 * ============================================================
 */

export type CompiledGenomeExperience = CognitiveCompiledExperience & {
  world: ExperienceWorld;
};

function inferIntent(result: CognitiveCompiledExperience): ExperienceIntent[] {
  const selected = result.cognition.selectedHypothesis.kind;
  const affordances = new Set(result.cognition.affordances);
  const intents = new Set<ExperienceIntent>();

  if (selected === "memory" || affordances.has("continuity")) intents.add("remember");
  if (selected === "ritual") intents.add("celebrate");
  if (selected === "commerce" || affordances.has("commerce")) intents.add("sell");
  if (selected === "utility") intents.add("protect");
  if (selected === "discovery" || affordances.has("reveal")) intents.add("discover");
  if (selected === "social" || affordances.has("participation")) intents.add("connect");
  if (selected === "game") intents.add("reward");

  if (!intents.size) intents.add("discover");
  return [...intents];
}

function resolveAudience(result: CognitiveCompiledExperience): string[] {
  return [...new Set([
    ...result.observation.audience,
    ...result.cognition.participants.value,
    ...result.cognition.plan.audience,
  ])];
}

function compatibilityWorld(result: CognitiveCompiledExperience): ExperienceWorld {
  const { observation, story } = result;

  return {
    domain: "experience_world",
    archetype: "adaptive_story",
    atmosphere: story.tone,
    journey: story.beats.map((beat) => beat.kind),
    atoms: [...new Set([
      observation.subject,
      observation.activity,
      ...observation.affordances,
      ...result.cognition.plan.dynamicBehavior,
    ])],
    themes: [...new Set([
      ...observation.context,
      ...result.cognition.plan.emotionalIntent,
      ...result.cognition.plan.futureEvolution,
    ])],
  };
}

export function compileExperienceGenome(
  prompt: string,
  context: StoryCompilerContext = {},
): CompiledGenomeExperience {
  const result = compileCognitiveExperience(prompt, context);
  const intent = inferIntent(result);
  const audience = resolveAudience(result);
  const directionConcept = result.cognition.plan.direction
    ? [result.cognition.plan.direction]
    : [];

  return {
    ...result,
    genome: {
      ...result.genome,
      intent,
      interpretation: {
        ...result.genome.interpretation,
        intent,
        concepts: [...new Set([
          ...result.genome.interpretation.concepts,
          ...result.observation.context,
          ...result.observation.affordances,
          ...directionConcept,
        ])],
        confidence: result.genome.interpretation.confidence,
      },
      audience,
      dna: [...new Set([
        ...result.genome.dna,
        "canonical-cognitive-compiler",
        "universal-compiler-substrate",
        ...result.cognition.plan.dynamicBehavior.map((value) => `dynamic:${value}`),
        ...audience.map((value) => `audience:${value}`),
      ])],
    },
    model: {
      ...result.model,
      metadata: {
        ...result.model.metadata,
        tags: [
          ...((result.model.metadata?.tags ?? []) as string[]),
          "canonical-cognitive-compiler",
          "universal-compiler-substrate",
        ],
      },
    },
    world: compatibilityWorld(result),
  };
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
