/**
 * =====================================================
 * QRE NUVO FIELD
 * =====================================================
 *
 * Possibility Intelligence Contract.
 *
 * Genome:
 * "What exists"
 *
 * NUVO:
 * "What could become"
 *
 * Responsibility:
 *
 * Convert existence into possibility space.
 *
 * =====================================================
 */


export interface NuvoFuture {

  id:string;

  name:string;

  description:string;

  transformation:string;

  confidence:number;


  /**
   * Evidence that created this possibility.
   */
  originSignals:string[];


  /**
   * Conditions needed for emergence.
   */
  emergenceConditions:string[];


  /**
   * Human meaning transition.
   */
  meaningShift:string;


  /**
   * Emotional direction.
   */
  emotionalDirection:string;

}



export interface NuvoMutation {


  source:string;


  evolution:string;


  potential:string;


  /**
   * Strength of mutation pressure.
   */
  force:number;


  /**
   * Actual transformation.
   */
  transformation:string;

}



export interface NuvoField {


  /**
   * Existing reality signals.
   */
  originPatterns:string[];


  /**
   * Emerging structures.
   */
  emergencePatterns:string[];


  /**
   * Forces causing evolution.
   */
  hiddenForces:string[];


  /**
   * Directions reality can move.
   */
  transformationPaths:string[];



  /**
   * Possible future states.
   */
  futureRealities:NuvoFuture[];



  /**
   * Discovered possibility opportunities.
   */
  creativeOpportunities:string[];



  /**
   * Creative mutations.
   */
  mutations:NuvoMutation[];



  /**
   * Potential worlds.
   */
  latentWorlds:string[];



  /**
   * Semantic possibility space.
   */
  semanticPotential:string[];


  graphInsights:string[];


  hiddenRelationships:string[];



  /**
   * Movement vectors.
   */
  possibilityVectors:string[];



  emergentArchetypes:string[];


  futureQuestions:string[];



  /**
   * Cognitive metrics.
   */
  resonance:number;


  possibilityDensity:number;


  emergenceStrength:number;


  noveltyScore:number;


  dominantPotential:string;


  emergentSurprises:string[];


  unknownPotential:string[];


  confidence:number;

}