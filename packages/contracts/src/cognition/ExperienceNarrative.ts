/**
 * =====================================================
 * QRE EXPERIENCE NARRATIVE CONTRACT
 * =====================================================
 *
 * Human-facing story layer.
 *
 * Experience Cognition
 *        ↓
 * Narrative Intelligence
 *        ↓
 * Runtime Delivery
 *
 * =====================================================
 */



export interface NarrativeIntelligence {


  /**
   * Why this narrative exists.
   */
  intent:unknown;



  /**
   * Score of selected narrative reality.
   */
  selectedScore:number;



  /**
   * Confidence in selection.
   */
  confidence:number;



  /**
   * Cognitive explanation.
   */
  reasoning:string[];



  /**
   * Origin world.
   */
  world:string;



  /**
   * Emotional journey states.
   */
  journey:string[];



}







export interface ExperienceNarrative {


  /**
   * Human readable title
   */
  title:string;



  /**
   * Emotional transformation.
   */
  emotionalArc:string;



  /**
   * Human story moments.
   */
  story:string[];



  /**
   * Voice personality.
   */
  voice:string;



  /**
   * Sensory direction.
   */
  sensory?:string[];



  /**
   * Internal narrative cognition.
   *
   * Used by:
   *
   * - cinematic runtime
   * - memory engine
   * - adaptive evolution
   * - replay intelligence
   */
  narrativeIntelligence:NarrativeIntelligence;



}