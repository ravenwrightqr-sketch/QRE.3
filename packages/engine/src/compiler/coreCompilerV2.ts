/**
 * QRE CANONICAL EXPERIENCE COMPILER V2
 *
 * One front door for turning an open-ended human idea into runtime-ready
 * semantic artifacts. The compiler itself remains deterministic and free of
 * persistence/runtime concerns; cognition supplies the interpretation.
 */

import { buildMeaningContext } from "@qre/cognition";
import { understandPrompt, buildExperienceUnderstanding } from "@qre/cognition-v2";

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

function createModel(blueprint: ExperienceBlueprint, prompt: string): ExperienceModel {
  return {
    title: blueprint.title,
    description: prompt,
    industry: "generic",
    goal: "discovery",
    tone: blueprint.tone,
    moments: blueprint.moments,
    metadata: {
      category: blueprint.type,
      tags: ["qre-experience-compiler", "cognition-v2", "experience-moment-canonical"],
    },
  };
}

export function compileExperienceV2(
  prompt: string,
  context?: ExperienceCompileContext,
): CompiledExperience {
  if (!prompt.trim()) throw new Error("Experience prompt required.");

  const cognitive = understandPrompt(prompt);
  const understanding: ExperienceUnderstanding =
    (context?.metadata?.understanding as ExperienceUnderstanding | undefined)
    ?? buildExperienceUnderstanding(cognitive);

  const meaningContext: ExperienceMeaningContext =
    (context?.metadata?.meaningContext as ExperienceMeaningContext | undefined)
    ?? buildMeaningContext(understanding);

  const genome: ExperienceGenome =
    (context?.metadata?.genome as ExperienceGenome | undefined)
    ?? buildExperienceGenome(prompt, understanding, meaningContext);

  const mind: CompilerMind = { prompt, understanding, meaningContext, genome };
  const synthesis = synthesizeCognitiveExperience(mind);
  const world: ExperienceWorld = composeWorld(genome, synthesis);
  const blueprint: ExperienceBlueprint = composeBlueprint(genome, world);
  const direction = directExperience(blueprint);
  const narrative = compileExperienceNarrative(genome, world, blueprint);
  const flowSteps: FlowStep[] = blueprintToFlow(blueprint);
  const experienceMoments: ExperienceMoment[] = blueprint.moments;
  const cinematicScenes = compileCinematicScenes(blueprint, direction, world);

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
    model: createModel(blueprint, prompt),
    context,
    title: blueprint.title,
    estimatedDuration: experienceMoments.length * 5,
    momentCount: experienceMoments.length,
    metadata: {
      compilerVersion: "8.0-cognition-v2",
      generatedAt: new Date().toISOString(),
      source: "qre-experience-compiler",
      tags: ["cognition-v2", "experience-moment", "flow-projection", "cinematic-projection"],
    },
  };
}

export const compileExperienceGenomeV2 = compileExperienceV2;
