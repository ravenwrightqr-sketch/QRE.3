import type { ExperienceIntent, ExperienceWorld } from "@qre/contracts";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type StoryCompilerContext,
} from "./universalStoryCompiler.js";

/**
 * Canonical prompt compiler boundary.
 *
 * Prompt interpretation belongs to universalStoryCompiler. This file is only
 * the compatibility/export boundary for callers that still request a genome
 * and world-shaped result.
 */
export type CompiledGenomeExperience = CompiledStoryExperience & { world: ExperienceWorld };

function inferIntent(result: CompiledStoryExperience): ExperienceIntent[] {
  const text = result.observation.prompt.toLowerCase();
  const affordances = new Set(result.observation.affordances);
  const intents = new Set<ExperienceIntent>();

  if (affordances.has("play") || affordances.has("challenge")) intents.add("play" as ExperienceIntent);
  if (affordances.has("reveal") || result.observation.activity === "discovery") intents.add("discover" as ExperienceIntent);
  if (affordances.has("preservation") || result.observation.context.includes("memory")) intents.add("remember" as ExperienceIntent);
  if (result.observation.activity === "learning") intents.add("teach" as ExperienceIntent);
  if (result.observation.activity === "commerce") intents.add("sell" as ExperienceIntent);
  if (result.observation.activity === "celebration" || /\b(wedding|birthday|anniversary|celebration)\b/.test(text)) {
    intents.add("celebrate" as ExperienceIntent);
  }
  if (affordances.has("connection") || result.observation.context.includes("relationship")) {
    intents.add("connect" as ExperienceIntent);
  }
  if (affordances.has("replay")) intents.add("replay" as ExperienceIntent);

  if (!intents.size) intents.add("experience_creation" as ExperienceIntent);
  return [...intents];
}

function resolveAudience(result: CompiledStoryExperience): string[] {
  const text = result.observation.prompt.toLowerCase();
  const audience = new Set(result.observation.audience);

  if (/\b(kids?|children|child|toddlers?|students?|classroom)\b/.test(text)) {
    audience.add("children");
  }
  if (/\b(customers?|shoppers?|buyers?|clients?)\b/.test(text)) {
    audience.add("customers");
  }
  if (/\b(couples?|partners?|bride|groom|newlyweds?)\b/.test(text)) {
    audience.add("couples");
  }

  return [...audience];
}

function compatibilityWorld(result: CompiledStoryExperience): ExperienceWorld {
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
    ])],
    themes: observation.context,
  };
}

export function compileExperienceGenome(
  prompt: string,
  context: StoryCompilerContext = {},
): CompiledGenomeExperience {
  const result = compileStoryExperience(prompt, context);
  const intent = inferIntent(result);
  const audience = resolveAudience(result);

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
        ])],
        confidence: result.genome.interpretation.confidence,
      },
      audience,
      dna: [...new Set([
        ...result.genome.dna,
        ...result.observation.affordances,
        ...audience.map((value) => `audience:${value}`),
      ])],
    },
    model: {
      ...result.model,
      metadata: {
        ...result.model.metadata,
        tags: [
          ...((result.model.metadata?.tags ?? []) as string[]),
          "canonical-prompt-brain",
          "universal-story-compiler",
        ],
      },
    },
    world: compatibilityWorld(result),
  };
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
