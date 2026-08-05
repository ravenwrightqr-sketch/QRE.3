/**
 * =====================================================
 * QRE COMPILER BRAIN
 * =====================================================
 *
 * ROLE:
 *
 * Cognitive Pipeline Orchestrator.
 *
 * This file coordinates the intelligence systems.
 *
 * It is NOT the intelligence itself.
 *  experienceMeaning owned by semantic genome lyaerThe engine creates cognitive artifacts.
The Compiler Brain orchestrates them.
The contract preserves them.
 *
 * RESPONSIBILITY:
 *
 * Human Prompt
 *      ↓
 * Understanding Kernel
 *      ↓
 * Experience Genome
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
 * World Synthesis
 *      ↓
 * Experience Compiler
 *      ↓
 * CompiledExperience
 *
 *
 * OWNS:
 *
 * - Pipeline ordering
 * - Cognitive module coordination
 * - Passing intelligence between systems
 * - Producing CompilerBrainResult
 *
 *
 * DOES NOT OWN:
 *
 * ❌ Intelligence definitions
 * ❌ Database access
 * ❌ Persistence
 * ❌ API logic
 * ❌ Runtime execution
 * ❌ User storage
 *
 *
 * CANONICAL INTELLIGENCE CONTRACT:
 *
 * ExperienceCompilerIntelligence
 *
 * defined in:
 *
 * packages/contracts/src/experience/compiled.ts
 *
 *
 * ARCHITECTURE RULE:
 *
 * If adding new cognition:
 *
 * Add the output to the intelligence substrate.
 *
 * Do not create another brain contract.
 *
 *
 * The Compiler Brain is the nervous system.
 *
 * ExperienceCompilerIntelligence is the mind.
 *
 * CompiledExperience is the created body.
 *
 * =====================================================
 */
import {
 compileExperienceGenome,
} from "../experience/genomeCompiler.js";

import type {
  CompilerBrainResult,
} from "@qre/contracts";
export type {
  CompilerBrainResult,
} from "@qre/contracts";

export function runCompilerBrain(

 prompt:string

):CompilerBrainResult {



if(
 !prompt.trim()
){

 throw new Error(
  "Compiler brain requires a creative prompt"
 );

}

const compiled =
  compileExperienceGenome(
    prompt
  );

return {
  compiled,
  intelligence:
    compiled.intelligence,
};
}