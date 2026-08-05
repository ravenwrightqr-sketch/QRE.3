/**
 * =====================================================
 *
 * ORIGIN COGNITIVE STATE CONTRACT
 *
 * Internal reflective workspace.
 *
 * =====================================================
 *
 * IMPORTANT:
 *
 * This is NOT the global intelligence contract.
 *
 * Canonical intelligence remains:
 *
 * ExperienceCompilerIntelligence
 *
 * This represents Origin module cognition state.
 *
 * =====================================================
 */

import type {
  Inquiry
} from "./inquiry.js";


export interface OriginCognitiveState {

  id:string;

  input:string;

  focus:string[];

  observations:string[];

  thoughts:string[];

  questions:Inquiry[];

  hypotheses:string[];

  simulations:string[];

  beliefs:string[];

  memories:string[];

  discoveries:string[];

  goals:string[];

  history:string[];

  confidence:number;

  curiosity:number;

  energy:number;

  timestamp:number;

}