/**
 * =====================================================
 * QRE COGNITIVE SYNTHESIS PIPELINE
 * =====================================================
 *
 * Internal cognitive assembly layer.
 *
 * This module composes cognitive outputs.
 *
 * It does NOT define intelligence truth.
 *
 * Canonical intelligence contract:
 *
 * ExperienceCompilerIntelligence
 *
 * Location:
 *
 * packages/contracts/src/experience/compiled.ts
 *
 *
 * RESPONSIBILITY:
 *
 * CompilerMind
 *      ↓
 * Cognitive synthesis
 *      ↓
 * ExperienceCompilerIntelligence
 *      ↓
 * Experience Compiler
 *
 * =====================================================
 */
import {
  buildCognitiveTrace,
} from "./cognitiveTrace/index.js";


import {
  buildSemanticIR,
} from "./semantic/index.js";

import {
  awakenNuvo,
} from "./nuvo/index.js";

import {
  awakenRevik,
} from "./revik/index.js";

import {
  buildMoverArc,
  buildMoverTopology,
} from "./moverArc/index.js";

import {
  awakenKaivo,
} from "./kaivo/index.js";

import {
  awakenOrion,
} from "./orion/index.js";

import type {
  CompilerMind,
  ExperienceCognitiveTrace,
  ExperienceCompilerIntelligence,
} from "@qre/contracts";

export type CognitiveSynthesisOutput =
  ExperienceCompilerIntelligence & {
    cognitiveTrace:
      ExperienceCognitiveTrace;
  };
export function synthesizeCognitiveExperience(
initialMind: CompilerMind
): CognitiveSynthesisOutput {

  const mind: CompilerMind = structuredClone(initialMind);
  const semanticIR =
    buildSemanticIR(
      mind
    );

  mind.semanticIR = semanticIR;

const nuvo =
awakenNuvo(
  mind
);

  mind.nuvo = nuvo;

 const revik =
awakenRevik(
  mind
);
  mind.revik = revik;

  const moverArc =
    buildMoverArc({
      semanticIR,
      genome: mind.genome,
      revik,
    });

  const moverTopology =
    buildMoverTopology(
      moverArc
    );

  mind.moverArc = moverArc;
  mind.moverTopology = moverTopology;

  const kaivo =
    awakenKaivo(
      mind
    );

  mind.kaivo = kaivo;

  const orion =
    awakenOrion(
      mind
    );

  mind.orion = orion;

  const cognitiveTrace =
    buildCognitiveTrace({
      understanding:
        mind.understanding,
      genome:
        mind.genome,
      semanticIR,
      nuvo,
      revik,
      moverArc,
      moverTopology,
      kaivo,
      orion,
    });

 return {
  understanding: mind.understanding,

  meaningContext: mind.meaningContext,

  meaning: mind.genome.meaning,

  genome: mind.genome,

  semanticIR,

  nuvo,

  revik,

  moverArc,

  moverTopology,

  kaivo,

  orion,

  cognitiveTrace,

  memoryReveal: mind.memoryReveal,

  experienceArc: mind.experienceArc,

  worldObservations: mind.worldObservations,

  cognitionLoop: mind.cognitionLoop,
};
}