/**
 * =====================================================
 * QRE INDUSTRY TEMPLATE CONTRACT
 * =====================================================
 *
 * Industry intelligence definition.
 *
 * Industry
 *    ↓
 * Template
 *    ↓
 * Blueprint
 *    ↓
 * Runtime
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceIndustry,
  ExperienceGoal,
  ExperienceMomentType,
  ExperienceTone,
} from "@qre/contracts";



export type IndustryTemplate = {


  /**
   * Industry identity
   */
  industry:
    ExperienceIndustry;



  /**
   * Default business objective
   */
  defaultGoal:
    ExperienceGoal;



  /**
   * Emotional / creative DNA
   */
  preferredDNA:
    readonly ExperienceTone[];



  /**
   * Moments this industry naturally creates
   */
  recommendedMoments:
    readonly ExperienceMomentType[];



  /**
   * Words used by compiler detection
   */
  keywords?:
    readonly string[];



  /**
   * Named experience concepts
   *
   * Example:
   * wedding_archive
   * product_passport
   * creator_drop
   */
  experiences?:
    readonly string[];



  /**
   * Product capabilities
   *
   * Example:
   * social sharing
   * authentication
   * rewards
   */
  recommendedFeatures?:
    readonly string[];



  /**
   * Supported experience categories
   *
   * Example:
   * jewelry
   * handmade products
   * collectibles
   */
  supportedExperiences?:
    readonly string[];



  /**
   * Analytics signals
   *
   * Example:
   * product_scans
   * shares
   */
  analytics?:
    readonly string[];



};