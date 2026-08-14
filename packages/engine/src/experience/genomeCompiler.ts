import type { ExperienceIntent, ExperienceWorld } from "@qre/contracts";
import {
  compileCognitiveExperience,
  type CognitiveCompiledExperience,
} from "./cognitiveExperienceCompiler.js";
import type { ExperienceCompilerContext } from "./experienceCompilerContext.js";

/**
 * ============================================================
 * QRE GENOME COMPILER — COMPATIBILITY BOUNDARY
 * ============================================================
 *
 * STATUS: COMPATIBILITY ADAPTER ONLY.
 *
 * The canonical compiler is now the universal reality compiler. This file
 * exists only because older callers still request a genome-shaped result.
 * It must not maintain a second intelligence path and must not expect the
 * removed `genome` / `model` fields from CognitiveCompiledExperience.
 * ============================================================
 */

export type CompiledGenomeExperience = CognitiveCompiledExperience & {
  world: ExperienceWorld;
  intent: ExperienceIntent[];
  audience: string[];
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
    atmosphere: [...story.tone],
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
  context: ExperienceCompilerContext = {},
): CompiledGenomeExperience {
  const result = compileCognitiveExperience(prompt, context);
  const intent = inferIntent(result);
  const audience = resolveAudience(result);

  return {
    ...result,
    intent,
    audience,
    world: compatibilityWorld(result),
  };
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
