/**
 * =====================================================
 * QRE EXPERIENCE UNDERSTANDING TYPES
 * =====================================================
 *
 * The unified human understanding object.
 *
 * Prompt
 *   ↓
 * Understanding Kernel
 *   ↓
 * Genome / World / Blueprint
 *
 * This is the semantic brain output.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */


import type {

  ExperienceIntent,

  ExperienceEntities,

  ExperienceRelationship,

  WorldDomain,

} from "@qre/contracts";







/**
 * =====================================================
 * EMOTION UNDERSTANDING
 *
 * What should the human feel?
 *
 * =====================================================
 */


export type EmotionUnderstanding = {


  emotions:

    string[];




  atmosphere:

    string[];




  intensity:

    number;




  /**
   * Emotional direction
   *
   * Example:
   *
   * nostalgia
   * excitement
   * wonder
   *
   */

  primary?:

    string;



};










/**
 * =====================================================
 * MEMORY UNDERSTANDING
 *
 * Time dimension of experience.
 *
 * =====================================================
 */


export type MemoryUnderstanding = {


  /**
   * Past events
   */

  past:

    boolean;




  /**
   * Current experience
   */

  present:

    boolean;




  /**
   * Future preservation
   */

  future:

    boolean;




  /**
   * Legacy / inheritance
   */

  legacy:

    boolean;




  /**
   * Replay behavior
   */

  replay:

    boolean;




  /**
   * Time capsule behavior
   */

  timeCapsule:

    boolean;




  /**
   * Memory category
   */

  mode?:

    | "archive"

    | "replay"

    | "timeline"

    | "legacy"

    | "time_capsule"

    | "none";



};










/**
 * =====================================================
 * AUDIENCE UNDERSTANDING
 *
 * Who is this experience for?
 *
 * =====================================================
 */


export type AudienceUnderstanding = {


  types:

    string[];




  social:

    | "solo"

    | "shared"

    | "community";




  /**
   * More specific audience identity.
   *
   * Examples:
   *
   * creator
   * fan
   * family
   * collector
   *
   */

  primary?:

    string;



};










/**
 * =====================================================
 * DNA UNDERSTANDING
 *
 * Creative fingerprint.
 *
 * Not templates.
 *
 * =====================================================
 */


export type DNAUnderstanding = {


  traits:

    string[];




  /**
   * Visual / emotional style
   */

  style?: {


    atmosphere:

      string[];


    visual:

      string[];


    interaction:

      string[];


  };



};










/**
 * =====================================================
 * WORLD UNDERSTANDING
 *
 * Possible emotional universes.
 *
 * =====================================================
 */


export type WorldScore = {


  domain:

    WorldDomain;




  confidence:

    number;



};



export type WorldUnderstanding = {

 domains:
    WorldDomain[];

 primary:
    WorldDomain;

 confidence:
    number;

};










/**
 * =====================================================
 * UNDERSTANDING SCORES
 *
 * Confidence by intelligence layer.
 *
 * =====================================================
 */


export type UnderstandingScore = {


  semantic:

    number;




  entity:

    number;




  relationship:

    number;




  emotional:

    number;




  memory:

    number;




  world:

    number;




  dna:

    number;




  overall:

    number;



};










/**
 * =====================================================
 * EXPERIENCE UNDERSTANDING
 *
 * The complete semantic brain output.
 *
 * =====================================================
 */


export type ExperienceUnderstanding = {


  /**
   * Original human input
   */

  prompt:

    string;





  /**
   * Intent layer
   */

  intent:

    ExperienceIntent[];





  /**
   * Reality extraction
   */

  entities:

    ExperienceEntities;





  /**
   * Semantic graph
   */

  relationships:

    ExperienceRelationship[];





  /**
   * Emotional intelligence
   */

  emotions:

    EmotionUnderstanding;





  /**
   * Time / memory intelligence
   */

  memory:

    MemoryUnderstanding;





  /**
   * Audience intelligence
   */

  audience:

    AudienceUnderstanding;





  /**
   * World intelligence
   */

  world:

    WorldUnderstanding;





  /**
   * Creative fingerprint
   */

  dna:

    DNAUnderstanding;





  /**
   * Confidence breakdown
   */

  scores:

    UnderstandingScore;





  /**
   * Global confidence
   */

  confidence:

    number;



};