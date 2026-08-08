/**
 * =====================================================
 * QRE EXPERIENCE COMPILER
 * =====================================================
 *
 * ONE compiler path.
 *
 * Prompt
 *   ↓
 * Understanding
 *   ↓
 * Meaning Context
 *   ↓
 * Genome
 *   ↓
 * Cognitive Synthesis
 *   ↓
 * World
 *   ↓
 * Blueprint
 *   ↓
 * Narrative / Flow / Moments
 *   ↓
 * Cinematic Scenes
 *   ↓
 * CompiledExperience
 *
 * The compiler creates semantic artifacts.
 * It does not execute them, persist them, or own runtime state.
 *
 * ExperienceMoment is canonical at the Blueprint boundary.
 * FlowSteps are an executable projection of the Blueprint.
 * CinematicScene is a presentation projection of the same Moments.
 *
 * =====================================================
 */

import {
  understandExperience,
  buildMeaningContext,
} from "@qre/cognition";

import type {
  CompiledExperience,
  ExperienceBlueprint,
  ExperienceCompileContext,
  ExperienceGenome,
  ExperienceMeaningContext,
  ExperienceModel,
  ExperienceUnderstanding,
  ExperienceWorld,
  FlowStep,
  ExperienceMoment,
  CompilerMind,
} from "@qre/contracts";

import { buildExperienceGenome } from "../compiler/semantic/genome/genomeBuilder.js";
import { synthesizeCognitiveExperience } from "../compiler/cognitiveSynthesis.js";
import { composeWorld } from "../world/worldComposer.js";
import { composeBlueprint } from "./blueprintComposer.js";
import { directExperience } from "./director.js";
import { blueprintToFlow } from "./blueprintToFlow.js";
import { compileExperienceNarrative } from "../compiler/narrative/narrativeCompiler.js";
import { compileCinematicScenes } from "../cinematic/cinematicCompiler.js";

function createId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `experience-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function createModel(
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
        "qre-experience-compiler",
        "experience-moment-canonical",
        "cinematic-runtime",
      ],
    },
  };
}

function compile(
  prompt: string,
  context?: ExperienceCompileContext,
): CompiledExperience {
  if (!prompt.trim()) {
    throw new Error("Experience prompt required.");
  }

  // -----------------------------------------------------
  // 1. Understand the current prompt.
  // -----------------------------------------------------
  const understanding: ExperienceUnderstanding =
    (context?.metadata?.understanding as ExperienceUnderstanding | undefined) ??
    understandExperience(prompt);

  const meaningContext: ExperienceMeaningContext =
    (context?.metadata?.meaningContext as ExperienceMeaningContext | undefined) ??
    buildMeaningContext(understanding);

  // -----------------------------------------------------
  // 2. Build one canonical genome.
  // -----------------------------------------------------
  const genome: ExperienceGenome =
    (context?.metadata?.genome as ExperienceGenome | undefined) ??
    buildExperienceGenome(prompt, understanding, meaningContext);

  // -----------------------------------------------------
  // 3. Cognitive synthesis is the intelligence substrate.
  // -----------------------------------------------------
  const mind: CompilerMind = {
    prompt,
    understanding,
    meaningContext,
    genome,
  };

  const synthesis = synthesizeCognitiveExperience(mind);

  // -----------------------------------------------------
  // 4. Compose the semantic world and blueprint.
  // -----------------------------------------------------
  const world: ExperienceWorld = composeWorld(genome, synthesis);
  const blueprint: ExperienceBlueprint = composeBlueprint(genome, world);

  // -----------------------------------------------------
  // 5. Create the three projections from the same Moments.
  // -----------------------------------------------------
  const direction = directExperience(blueprint);
  const narrative = compileExperienceNarrative(
    genome,
    world,
    blueprint,
  );
  const flowSteps: FlowStep[] = blueprintToFlow(blueprint);
  const experienceMoments: ExperienceMoment[] = blueprint.moments;
  const cinematicScenes = compileCinematicScenes(
    blueprint,
    direction,
    world,
  );
  const model = createModel(blueprint, prompt);

  return {
    id: createId(),

    intelligence: {
      understanding,
      meaningContext,
      meaning: genome.meaning,
      semanticIR: synthesis.semanticIR,
      nuvo: synthesis.nuvo,
      revik: synthesis.revik,
      moverArc: synthesis.moverArc,
      moverTopology: synthesis.moverTopology,
      kaivo: synthesis.kaivo,
      orion: synthesis.orion,
      genome,
      cognitiveTrace: synthesis.cognitiveTrace,
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
      compilerVersion: "6.0-experience-core",
      generatedAt: new Date().toISOString(),
      source: "qre-experience-compiler",
      tags: [
        "semantic",
        "world-aware",
        "experience-moment",
        "flow-projection",
        "cinematic-projection",
      ],
    },
  };
}

export function compileExperienceGenome(
  prompt: string,
  context?: ExperienceCompileContext,
): CompiledExperience {
  return compile(prompt, context);
}

export const genomeCompiler = compileExperienceGenome;
