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
   * Confidence that this future can emerge.
   */
  confidence:number;


  /**
   * Why this possibility exists.
   */
  originSignals:string[];


  /**
   * Conditions required for emergence.
   */
  emergenceConditions:string[];


  /**
   * Human meaning produced.
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
   * What changes.
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
   * Forces causing change.
   */
  hiddenForces:string[];



  /**
   * Possible movement directions.
   */
  transformationPaths:string[];



  /**
   * Discovered future realities.
   */
  futureRealities:NuvoFuture[];



  /**
   * Potential expansions.
   */
  creativeOpportunities:string[];



  /**
   * Creative mutations.
   */
  mutations:NuvoMutation[];



  /**
   * Possible worlds.
   */
  latentWorlds:string[];



  /**
   * Semantic possibility signals.
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
   * Directional possibility vectors.
   */
  possibilityVectors:string[];



  /**
   * Emerging archetypes.
   */
  emergentArchetypes:string[];



  /**
   * Unresolved future questions.
   */
  futureQuestions:string[];



  /**
   * Intelligence metrics.
   */
  resonance:number;


  /**
   * Density of possible futures.
   */
  possibilityDensity:number;


  /**
   * Strength of emergence.
   */
  emergenceStrength:number;


  /**
   * Novelty discovered.
   */
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