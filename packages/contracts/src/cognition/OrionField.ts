/**
 * =====================================================
 * QRE ORION FIELD
 * =====================================================
 *
 * Semantic Attractor Intelligence.
 *
 * Final cognitive synthesis layer.
 *
 * =====================================================
 */

export interface OrionField {

  /**
   * Overall semantic direction.
   */
  coreVector:string;

  /**
   * Highest-weight semantic nodes.
   */
  dominantNodes:string[];

  /**
   * Emotional gravity pulling the experience.
   */
  emotionalGravity:string;

  /**
   * Fundamental human need discovered.
   */
  humanNeed:string;

  /**
   * Narrative trajectory.
   */
  narrativePurpose:string;

  /**
   * Primary experience archetype.
   */
  experienceArchetype:string;

  /**
   * Creative mission statement.
   */
  creativeMission:string;

  /**
   * Overall semantic gravity.
   */
  gravity:number;

  /**
   * Direction supplied by MOVER.
   */
  transformationDirection:string;

  /**
   * Highest-gravity transformation path.
   */
  dominantTransformationPath:string[];

  /**
   * Overall possibility strength.
   */
  possibilityFieldStrength:number;

  /**
   * Unified interpretation.
   */
  synthesis:string;

}