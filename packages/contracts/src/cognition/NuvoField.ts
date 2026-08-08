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


  /**
   * Confidence this future can emerge.
   */
  confidence:number;


  /**
   * Evidence creating this possibility.
   */
  originSignals:string[];


  /**
   * Conditions required for emergence.
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
   * Mutation pressure.
   */
  force:number;


  /**
   * Transformation produced.
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



  /**
   * Graph-derived intelligence.
   */
  graphInsights:string[];



  /**
   * Hidden relational structures.
   */
  hiddenRelationships:string[];



  /**
   * Movement vectors.
   */
  possibilityVectors:string[];



  /**
   * Emerging archetypes.
   */
  emergentArchetypes:string[];



  /**
   * Questions not yet resolved.
   */
  futureQuestions:string[];



  /**
   * Cognitive metrics.
   */
  resonance:number;

  possibilityDensity:number;

  emergenceStrength:number;

  noveltyScore:number;


  /**
   * Dominant possibility direction.
   */
  dominantPotential:string;


  /**
   * Unexpected discoveries.
   */
  emergentSurprises:string[];


  /**
   * Unknown possibility space.
   */
  unknownPotential:string[];


  /**
   * Overall confidence.
   */
  confidence:number;

}