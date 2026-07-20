/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT CONTRACT
 * =====================================================
 *
 * Genome
 *      ↓
 * Blueprint
 *      ↓
 * Flow
 *      ↓
 * Runtime
 *
 * Blueprint is the composed experience.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */



import type {
  ExperienceTone,
} from "./tone.js";


import type {
  ExperienceType,
} from "./experienceType.js";


import type {
  ExperienceMoment,
} from "./moment.js";


import type {
  ExperienceEntities,
} from "./entityExtractor.js";


import type {
  ExperienceMeaning,
} from "./meaning.js";





export type ExperienceBlueprint = {



  /**
   * Human-facing identity
   */
  title:string;



  /**
   * What kind of experience
   *
   * NOT industry.
   *
   * Examples:
   * story
   * journey
   * memory
   * discovery
   */
  type:
    ExperienceType;




  /**
   * Emotional direction
   */
  tone:
    readonly ExperienceTone[];




  /**
   * Preserved meaning
   */
  meaning:
    ExperienceMeaning;




  /**
   * Generated moments
   */
  moments:
    ExperienceMoment[];




  /**
   * Reality extracted
   */
  entities:
    ExperienceEntities;



  /**
   * Optional semantic metadata.
   *
   * NEVER used as compiler logic.
   */
  metadata?: {


    archetypes?:
      string[];


    themes?:
      string[];


    dna?:
      string[];


  };


};