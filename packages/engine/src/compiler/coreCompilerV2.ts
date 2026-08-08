/**
 * QRE CANONICAL EXPERIENCE COMPILER
 *
 * Cognition interprets the prompt; the compiler projects only what cognition
 * actually discovered into the runtime-facing experience artifacts.
 */

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
import { buildSemanticIR } from "./semantic/index.js";
import { composeWorld } from "../world/worldComposer.js";
import { composeBlueprint } from "../experience/blueprintComposer.js";
import { directExperience } from "../experience/director.js";
import { blueprintToFlow } from "../experience/blueprintToFlow.js";
import { compileExperienceNarrative } from "./narrative/narrativeCompiler.js";
import { compileCinematicScenes } from "../cinematic/cinematicCompiler.js";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `experience-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function unique(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0))];
}

function deriveMeaningContext(understanding: ExperienceUnderstanding): ExperienceMeaningContext {
  const humanIntent = understanding.humanIntent ?? { motivations: [], desiredOutcome: [] };
  const emotions = understanding.emotions?.emotions ?? [];
  const memory = understanding.memory ?? {};

  return {
    themes: unique(understanding.world?.domains),
    meanings: unique(humanIntent.motivations),
    creativeDirection: [],
    emotionalGravity: unique(emotions),
    humanDesires: unique(humanIntent.desiredOutcome),
    symbolicForces: unique(understanding.entities?.concepts),
    narrativePotential: unique([
      ...(memory.memories ?? []),
    ]),
  };
}

function createModel(blueprint: ExperienceBlueprint, prompt: string): ExperienceModel {
  return {
    title: blueprint.title,
    description: prompt,
    industry: "generic",
    goal: "storytelling",
    tone: blueprint.tone,
    moments: blueprint.moments,
    metadata: {
      category: blueprint.type,
      tags: ["cognition-first"],
    },
  };
}

export function compileExperienceV2(prompt: string, context?: ExperienceCompileContext): CompiledExperience {
  const expression = prompt.trim();
  if (!expression) throw new Error("Experience prompt required.");

  const cognitive = understandPrompt(expression);
  const understanding: ExperienceUnderstanding = context?.metadata?.understanding ?? buildExperienceUnderstanding(cognitive);
  const meaningContext: ExperienceMeaningContext = context?.metadata?.meaningContext ?? deriveMeaningContext(understanding);
  const genome: ExperienceGenome = context?.metadata?.genome ?? buildExperienceGenome(expression, understanding, meaningContext);

  const mind: CompilerMind = {
    prompt: expression,
    understanding,
    meaningContext,
    genome,
    semanticIR: context?.metadata?.semanticIR,
  };
  const semanticIR = mind.semanticIR ?? buildSemanticIR(mind);

  const world: ExperienceWorld = composeWorld(genome);
  const blueprint: ExperienceBlueprint = composeBlueprint(genome, world);
  const direction = directExperience(blueprint);
  const narrative = compileExperienceNarrative(genome, world, blueprint);
  const flowSteps: FlowStep[] = blueprintToFlow(blueprint);
  const experienceMoments: ExperienceMoment[] = blueprint.moments;
  const cinematicScenes = compileCinematicScenes(blueprint, direction, world);

  return {
    id: createId(),
    intelligence: { understanding, meaningContext, meaning: genome.meaning, genome, semanticIR },
    genome,
    world,
    blueprint,
    narrative,
    direction,
    flowSteps,
    experienceMoments,
    cinematicScenes,
    model: createModel(blueprint, expression),
    context,
    title: blueprint.title,
    estimatedDuration: experienceMoments.length * 5,
    momentCount: experienceMoments.length,
    metadata: {
      compilerVersion: "10.0-cognition-first",
      generatedAt: new Date().toISOString(),
      source: "qre-experience-compiler",
      tags: ["cognition-first"],
    },
  };
}

export const compileExperience = compileExperienceV2;
export const compileExperienceGenomeV2 = compileExperienceV2;
