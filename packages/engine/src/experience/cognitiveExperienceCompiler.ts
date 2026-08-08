import type {
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceGenome,
} from "@qre/contracts";

import { understandExperience } from "../cognition/cognitiveEngine.js";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type StoryCompilerContext,
} from "./universalStoryCompiler.js";

/**
 * Canonical cognitive compiler.
 *
 * Cognition discovers what the experience could become.
 * Story compilation gives that direction a concrete runtime shape.
 * Inference stays explicitly separated from observed input.
 */
export type CognitiveCompiledExperience = CompiledStoryExperience & {
  cognition: CognitiveExperienceState;
};

function mergeGenome(genome: ExperienceGenome, cognition: CognitiveExperienceState): ExperienceGenome {
  const selected = cognition.selectedHypothesis;
  return {
    ...genome,
    intent: [...new Set([...genome.intent, selected.kind, ...cognition.motivations.value])],
    archetypes: [...new Set([...genome.archetypes, selected.kind, ...cognition.hypotheses.map((item) => item.kind)])],
    themes: [...new Set([
      ...genome.themes,
      ...cognition.emotionalIntent,
      ...cognition.affordances,
      ...cognition.plan.interactionModel,
    ])],
    emotions: [...new Set([...genome.emotions, ...cognition.emotionalIntent])],
    memory: Math.max(genome.memory, selected.dimensions.memoryPotential),
    discovery: Math.max(genome.discovery, selected.dimensions.discoveryPotential),
    commerce: Math.max(genome.commerce, selected.dimensions.commercialPotential),
    interaction: Math.max(genome.interaction, selected.dimensions.interactionNaturalness),
    replay: Math.max(genome.replay, selected.dimensions.temporalPotential),
    entities: cognition.entities,
    audience: [...new Set([...genome.audience, ...cognition.participants.value, ...cognition.plan.audience])],
    dna: [...new Set([
      ...genome.dna,
      "cognitive-experience-intelligence",
      "evidence-aware",
      "hypothesis-driven",
      `hypothesis:${selected.kind}`,
      ...cognition.affordances.map((value) => `affordance:${value}`),
      ...cognition.plan.dynamicBehavior.map((value) => `dynamic:${value}`),
    ])],
  };
}

function mergeBlueprint(blueprint: ExperienceBlueprint, cognition: CognitiveExperienceState): ExperienceBlueprint {
  return {
    ...blueprint,
    cognitivePlan: cognition.plan,
    metadata: {
      ...blueprint.metadata,
      archetypes: [...new Set([
        ...(blueprint.metadata?.archetypes ?? []),
        cognition.selectedHypothesis.kind,
        ...cognition.hypotheses.slice(0, 3).map((item) => item.kind),
      ])],
      themes: [...new Set([
        ...(blueprint.metadata?.themes ?? []),
        ...cognition.emotionalIntent,
        ...cognition.affordances,
        ...cognition.plan.futureEvolution,
      ])],
      dna: [...new Set([
        ...(blueprint.metadata?.dna ?? []),
        "evidence-aware",
        "hypothesis-driven",
        "cognitive-plan",
        "adaptive-experience",
        ...cognition.assumptions.map(() => "assumption-explicit"),
      ])],
    },
  };
}

export function compileCognitiveExperience(
  prompt: string,
  context: StoryCompilerContext = {},
): CognitiveCompiledExperience {
  const cognition = understandExperience(prompt, context);
  const compiled = compileStoryExperience(prompt, context);

  return {
    ...compiled,
    cognition,
    genome: mergeGenome(compiled.genome, cognition),
    blueprint: mergeBlueprint(compiled.blueprint, cognition),
    model: {
      ...compiled.model,
      metadata: {
        ...compiled.model.metadata,
        tags: [
          ...((compiled.model.metadata?.tags ?? []) as string[]),
          "cognitive-experience-intelligence",
          `selected:${cognition.selectedHypothesis.kind}`,
          `subject:${cognition.subject.value}`,
        ],
      },
    },
  };
}
