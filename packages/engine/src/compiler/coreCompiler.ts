/**
 * =====================================================
 * QRE CANONICAL EXPERIENCE COMPILER CORE
 * =====================================================
 *
 * This is the only orchestration path for authoring an experience.
 *
 * Prompt
 *   -> Understanding
 *   -> Meaning Context
 *   -> Genome
 *   -> Cognitive Synthesis
 *   -> World
 *   -> Blueprint
 *   -> ExperienceMoment[]
 *        |-> FlowStep[]
 *        |-> CinematicScene[]
 *
 * The compiler creates semantic artifacts only.
 * It does not execute flows, persist data, resolve scans, or own runtime state.
 *
 * ExperienceMoment is the canonical semantic boundary.
 * Flow and CinematicScene are projections of that boundary.
 * Geo and Memory remain optional runtime artifacts and are deliberately not
 * folded into the Moment compiler.
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

import { buildExperienceGenome } from "./semantic/genome/genomeBuilder.js";
import { synthesizeCognitiveExperience } from "./cognitiveSynthesis.js";
import { composeWorld } from "../world/worldComposer.js";
import { composeBlueprint } from "../experience/blueprintComposer.js";
import { directExperience } from "../experience/director.js";
import { blueprintToFlow } from "../experience/blueprintToFlow.js";
import { compileExperienceNarrative } from "./narrative/narrativeCompiler.js";
import { compileCinematicScenes } from "../cinematic/cinematicCompiler.js";

function createId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `experience-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

export function compileExperience(
  prompt: string,
  context?: ExperienceCompileContext,
): CompiledExperience {
  if (!prompt.trim()) {
    throw new Error("Experience prompt required.");
  }

  const understanding: ExperienceUnderstanding =
    (context?.metadata?.understanding as ExperienceUnderstanding | undefined)
    ?? understandExperience(prompt);

  const meaningContext: ExperienceMeaningContext =
    (context?.metadata?.meaningContext as ExperienceMeaningContext | undefined)
    ?? buildMeaningContext(understanding);

  const genome: ExperienceGenome =
    (context?.metadata?.genome as ExperienceGenome | undefined)
    ?? buildExperienceGenome(prompt, understanding, meaningContext);

  const mind: CompilerMind = {
    prompt,
    understanding,
    meaningContext,
    genome,
  };

  const synthesis = synthesizeCognitiveExperience(mind);
  const world: ExperienceWorld = composeWorld(genome, synthesis);
  const blueprint: ExperienceBlueprint = composeBlueprint(genome, world);

  const direction = directExperience(blueprint);
  const narrative = compileExperienceNarrative(genome, world, blueprint);
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
      compilerVersion: "7.0-canonical-core",
      generatedAt: new Date().toISOString(),
      source: "qre-experience-compiler",
      tags: [
        "canonical-core",
        "experience-moment",
        "flow-projection",
        "cinematic-projection",
      ],
    },
  };
}

export const compileExperienceGenome = compileExperience;
export const genomeCompiler = compileExperience;
