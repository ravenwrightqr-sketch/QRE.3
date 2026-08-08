import {
  composeWorld,
} from "../world/worldComposer.js";

import {
  compileExperienceNarrative,
} from "../compiler/narrative/narrativeCompiler.js";

import {
  buildExperienceGenome,
} from "../compiler/semantic/genome/genomeBuilder.js";

import {
  composeBlueprint,
} from "./blueprintComposer.js";

import {
  experienceDirector,
} from "./director.js";

import {
  blueprintToFlow,
} from "./blueprintToFlow.js";

import {
  compileCinematicScenes,
} from "../cinematic/cinematicCompiler.js";

import {
  synthesizeCognitiveExperience,
} from "../compiler/cognitiveSynthesis.js";

import {
  understandExperience,
  buildMeaningContext,
} from "@qre/cognition";

import type {
  CompilerMind,
  CompiledExperience,
  ExperienceBlueprint,
  ExperienceGenome,
  ExperienceMeaningContext,
  ExperienceModel,
  ExperienceUnderstanding,
  ExperienceWorld,
  FlowStep,
  ExperienceMoment,
  ExperienceCompileContext,
} from "@qre/contracts";

function createExperienceModel(
  blueprint: ExperienceBlueprint,
  prompt: string,
): ExperienceModel {
  return {
    title: blueprint.title,
    description: prompt,
    industry: "generic",
    goal: "discovery",
    tone: blueprint.tone,
    moments: blueprint.moments,
    metadata: {
      category: blueprint.type,
      tags: [
        "cognitive-synthesis",
        "semantic-compiler",
        "experience-genome",
        "cinematic-runtime",
      ],
    },
  };
}

function createCompilerId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `experience-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Canonical experience compiler.
 *
 * Prompt
 * → Understanding
 * → MeaningContext
 * → ExperienceGenome
 * → CompilerMind
 * → CognitiveSynthesis
 * → ExperienceWorld
 * → ExperienceBlueprint
 * → Direction
 * → Narrative
 * → FlowSteps
 * → ExperienceMoments
 * → CinematicScenes
 * → CompiledExperience
 *
 * ExperienceMoment is a canonical contract artifact. It is created by
 * blueprint composition and is NOT reconstructed from FlowSteps.
 */
export function compileExperienceGenome(
  prompt: string,
  context?: ExperienceCompileContext,
): CompiledExperience {
  if (!prompt.trim()) {
    throw new Error("Experience prompt required.");
  }

  const understanding: ExperienceUnderstanding =
    (context?.metadata?.understanding as
      | ExperienceUnderstanding
      | undefined) ??
    understandExperience(prompt);

  const meaningContext: ExperienceMeaningContext =
    (context?.metadata?.meaningContext as
      | ExperienceMeaningContext
      | undefined) ??
    buildMeaningContext(understanding);

  const genome: ExperienceGenome =
    (context?.metadata?.genome as
      | ExperienceGenome
      | undefined) ??
    buildExperienceGenome(
      prompt,
      understanding,
      meaningContext,
    );

  const mind: CompilerMind = {
    prompt,
    understanding,
    meaningContext,
    genome,
  };

  const cognitiveSynthesis = synthesizeCognitiveExperience(mind);

  const {
    semanticIR,
    nuvo,
    revik,
    moverArc,
    moverTopology,
    kaivo,
    orion,
    cognitiveTrace,
  } = cognitiveSynthesis;

  const world: ExperienceWorld = composeWorld(
    genome,
    cognitiveSynthesis,
  );

  const blueprint: ExperienceBlueprint = composeBlueprint(
    genome,
    world,
  );

  const direction = experienceDirector(blueprint);

  const narrative = compileExperienceNarrative(
    genome,
    world,
    blueprint,
  );

  const flowSteps: FlowStep[] = blueprintToFlow(blueprint);

  // IMPORTANT:
  // ExperienceBlueprint is the canonical source of ExperienceMoment[] /
  // ExperienceMoment is no longer derived from FlowSteps. Flow is an
  // executable projection; Moments are the semantic/runtime presentation
  // contract owned by the blueprint.
  const experienceMoments: ExperienceMoment[] = blueprint.moments;

  const cinematicScenes = compileCinematicScenes(
    blueprint,
    direction,
    world,
  );

  const model = createExperienceModel(blueprint, prompt);

  return {
    id: createCompilerId(),

    intelligence: {
      understanding,
      meaningContext,
      meaning: genome.meaning,
      semanticIR,
      nuvo,
      revik,
      moverArc,
      moverTopology,
      kaivo,
      orion,
      genome,
      cognitiveTrace,
    },

    genome,
    world,
    blueprint,
    narrative,
    direction,
    flowSteps,
    experienceMoments,
    cinematicScenes,
    model,
    context,
    title: blueprint.title,
    estimatedDuration: experienceMoments.length * 5,
    momentCount: experienceMoments.length,

    metadata: {
      compilerVersion: "5.0-cognitive-synthesis",
      generatedAt: new Date().toISOString(),
      source: "qre-cognitive-experience-compiler",
      tags: [
        "semantic",
        "cognitive",
        "world-aware",
        "cinematic",
        "compiler-brain",
      ],
    },
  };
}

export const genomeCompiler = compileExperienceGenome;
