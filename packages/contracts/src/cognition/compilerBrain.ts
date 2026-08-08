/**
 * =====================================================
 * QRE COMPILER BRAIN CONTRACT
 * =====================================================
 *
 * Public creator interface.
 *
 * The Compiler Brain is NOT the intelligence.
 *
 * The Compiler Brain orchestrates the cognitive pipeline
 * and exposes the finished result.
 *
 * Intelligence has exactly ONE canonical definition:
 *
 * ExperienceCompilerIntelligence
 *
 * defined in:
 *
 * contracts/experience/compiled.ts
 *
 * =====================================================
 */

import type {
  CompiledExperience,
  ExperienceCompilerIntelligence,
} from "../experience/compiled.js";



/**
 * =====================================================
 * COMPILER BRAIN RESULT
 * =====================================================
 *
 * Final public artifact returned by the
 * Compiler Brain.
 *
 * =====================================================
 */

export interface CompilerBrainResult {

  /**
   * Complete created experience.
   */
  compiled: CompiledExperience;

  /**
   * Complete cognitive substrate that produced
   * the experience.
   */
  intelligence: ExperienceCompilerIntelligence;

}