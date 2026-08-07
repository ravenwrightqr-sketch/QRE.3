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
  flowToMoment,
} from "../moments/flowToMoments.js";

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

/**
 * =====================================================
 * EXPERIENCE MODEL
 * =====================================================
 *
 * Final model representation derived from the blueprint.
 *
 * This is an output representation.
 * It does not perform cognition.
 * =====================================================
 */

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

/**
 * =====================================================
 * COMPILER ID
 * =====================================================
 */

function createCompilerId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `experience-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );
}

/**
 * =====================================================
 * MAIN EXPERIENCE COMPILER
 * =====================================================
 *
 * Canonical pipeline:
 *
 * Prompt
 *   ↓
 * Understanding
 *   ↓
 * Meaning Context
 *   ↓
 * Experience Genome
 *   ↓
 * Compiler Mind
 *   ↓
 * Cognitive Synthesis
 *   ↓
 * World
 *   ↓
 * Blueprint
 *   ↓
 * Direction
 *   ↓
 * Narrative
 *   ↓
 * Flow
 *   ↓
 * Moments
 *   ↓
 * Cinematic Scenes
 *   ↓
 * CompiledExperience
 *
 * IMPORTANT:
 *
 * Cognitive synthesis is authoritative.
 *
 * This compiler does not recreate cognition downstream.
 * It passes the resulting cognitive artifacts forward.
 * =====================================================
 */

export function compileExperienceGenome(
  prompt: string,
  context?: ExperienceCompileContext,
): CompiledExperience {
  if (!prompt.trim()) {
    throw new Error("Experience prompt required.");
  }

  /**
   * ===================================================
   * 1. FOUNDATION UNDERSTANDING
   * ===================================================
   *
   * Human prompt
   *      ↓
   * ExperienceUnderstanding
   *
   * Understanding establishes the raw interpreted
   * signals used by the rest of the compiler.
   */

  const understanding: ExperienceUnderstanding =
    (context?.metadata?.understanding as
      | ExperienceUnderstanding
      | undefined) ??
    understandExperience(prompt);

  /**
   * ===================================================
   * 2. MEANING CONTEXT
   * ===================================================
   *
   * Understanding
   *      ↓
   * ExperienceMeaningContext
   *
   * Meaning context establishes higher-order semantic
   * signals before creative synthesis begins.
   */

  const meaningContext: ExperienceMeaningContext =
    (context?.metadata?.meaningContext as
      | ExperienceMeaningContext
      | undefined) ??
    buildMeaningContext(understanding);

  /**
   * ===================================================
   * 3. EXPERIENCE GENOME
   * ===================================================
   *
   * Understanding
   * +
   * Meaning Context
   *      ↓
   * ExperienceGenome
   *
   * Genome is the creative identity substrate.
   */

  const genome: ExperienceGenome =
    (context?.metadata?.genome as
      | ExperienceGenome
      | undefined) ??
    buildExperienceGenome(
      prompt,
      understanding,
      meaningContext,
    );

  /**
   * ===================================================
   * 4. COMPILER MIND
   * ===================================================
   *
   * The CompilerMind is the canonical cognitive input
   * state.
   *
   * No database.
   * No runtime.
   * No persistence.
   */

  const mind: CompilerMind = {
    prompt,
    understanding,
    meaningContext,
    genome,
  };

  /**
   * ===================================================
   * 5. COGNITIVE SYNTHESIS
   * ===================================================
   *
   * This is the actual intelligence assembly stage.
   *
   * CompilerMind
   *      ↓
   * Semantic IR
   *      ↓
   * NUVO
   *      ↓
   * REVIK
   *      ↓
   * MOVER
   *      ↓
   * KAIVO
   *      ↓
   * ORION
   *      ↓
   * Cognitive Trace
   *
   * IMPORTANT:
   *
   * The returned synthesis is authoritative.
   *
   * We do NOT copy the results back into mind.
   * We do NOT reconstruct them later.
   */

  const cognitiveSynthesis =
    synthesizeCognitiveExperience(mind);

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

  /**
   * ===================================================
   * 6. WORLD SYNTHESIS
   * ===================================================
   *
   * Cognitive intelligence
   *      ↓
   * Experience World
   *
   * NOTE:
   *
   * The current worldComposer contract still accepts
   * genome only.
   *
   * We intentionally do NOT invent a new API here.
   *
   * The next architectural wiring step is worldComposer.
   */

  const world: ExperienceWorld =
  composeWorld(
    genome,
    cognitiveSynthesis,
  );
  /**
   * ===================================================
   * 7. BLUEPRINT
   * ===================================================
   *
   * World
   *      ↓
   * Experience Blueprint
   */

  const blueprint: ExperienceBlueprint =
    composeBlueprint(
      genome,
      world,
    );

  /**
   * ===================================================
   * 8. EXPERIENCE DIRECTION
   * ===================================================
   *
   * Blueprint
   *      ↓
   * Experience Direction
   */

  const direction =
    experienceDirector(blueprint);

  /**
   * ===================================================
   * 9. NARRATIVE INTELLIGENCE
   * ===================================================
   *
   * Genome
   * +
   * World
   * +
   * Blueprint
   *      ↓
   * Narrative
   */

  const narrative =
    compileExperienceNarrative(
      genome,
      world,
      blueprint,
    );

  /**
   * ===================================================
   * 10. FLOW
   * ===================================================
   *
   * Blueprint
   *      ↓
   * Executable Flow
   */
    const flowSteps: FlowStep[] =
  blueprintToFlow(
    blueprint
  );

  /**
   * ===================================================
   * 11. EXPERIENCE MOMENTS
   * ===================================================
   *
   * Flow
   *      ↓
   * Experience Moments
   */
   const experienceMoments: ExperienceMoment[] =
  flowToMoment(
    flowSteps
  );

  /**
   * ===================================================
   * 12. CINEMATIC RUNTIME COMPILATION
   * ===================================================
   *
   * Blueprint
   * +
   * Direction
   * +
   * World
   *      ↓
   * Cinematic Scenes
   */

  const cinematicScenes =
    compileCinematicScenes(
      blueprint,
      direction,
      world,
    );

  /**
   * ===================================================
   * 13. EXPERIENCE MODEL
   * ===================================================
   */

  const model =
    createExperienceModel(
      blueprint,
      prompt,
    );

  /**
   * ===================================================
   * 14. FINAL COMPILED EXPERIENCE
   * ===================================================
   *
   * This is the complete compiler artifact.
   *
   * Intelligence remains available as a first-class
   * substrate rather than being discarded after
   * synthesis.
   */

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

    title:
      blueprint.title,

    estimatedDuration:
      experienceMoments.length * 5,

    momentCount:
      experienceMoments.length,

    metadata: {
      compilerVersion:
        "5.0-cognitive-synthesis",

      generatedAt:
        new Date().toISOString(),

      source:
        "qre-cognitive-experience-compiler",

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

export const genomeCompiler =
  compileExperienceGenome;