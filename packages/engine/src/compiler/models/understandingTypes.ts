/**
 * =====================================================
 * QRE EXPERIENCE UNDERSTANDING TYPES
 * =====================================================
 *
 * Semantic brain output.
 *
 * Prompt
 *   ↓
 * Understanding Kernel
 *   ↓
 * Genome / World / Blueprint
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

  emotions:string[];

  atmosphere:string[];

  intensity:number;

  primary?:string;

};





/**
 * =====================================================
 * MEMORY UNDERSTANDING
 *
 * Time dimension.
 *
 * =====================================================
 */

export type MemoryUnderstanding = {

  past:boolean;

  present:boolean;

  future:boolean;

  legacy:boolean;

  replay:boolean;

  timeCapsule:boolean;

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
 * Who experiences this?
 *
 * =====================================================
 */

export type AudienceUnderstanding = {

  types:string[];

  social:
    | "solo"
    | "shared"
    | "community";


  roles:string[];

  relationship:string[];

  behaviors:string[];

  expectations:string[];

  primary?:string;

};





/**
 * =====================================================
 * DNA UNDERSTANDING
 *
 * Creative fingerprint.
 *
 * =====================================================
 */

export type DNAUnderstanding = {

  traits:string[];


  style?:{

    atmosphere:string[];

    visual:string[];

    interaction:string[];

  };

};





/**
 * =====================================================
 * WORLD UNDERSTANDING
 * =====================================================
 */

export type WorldScore = {

  domain:WorldDomain;

  confidence:number;

};



export type WorldUnderstanding = {

  domains:WorldDomain[];

  primary:WorldDomain;

  confidence:number;

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

  semantic:number;

  entity:number;

  relationship:number;

  emotional:number;

  memory:number;

  world:number;

  dna:number;

  overall:number;

};





/**
 * =====================================================
 * HUMAN DESIRE UNDERSTANDING
 *
 * What does the human actually want?
 *
 * =====================================================
 */

export type HumanDesireUnderstanding = {

  desires:string[];

  motivations:string[];

  goals:string[];

  fears:string[];

  aspirations:string[];

};





/**
 * =====================================================
 * SENSORY UNDERSTANDING
 *
 * How should the experience be perceived?
 *
 * =====================================================
 */

export type SensoryUnderstanding = {

  visual:string[];

  audio:string[];

  physical:string[];

  environmental:string[];

};





/**
 * =====================================================
 * CREATION POTENTIAL UNDERSTANDING
 *
 * Possibility space before creation.
 *
 * =====================================================
 */

export type CreationPotentialUnderstanding = {

  possibilities:string[];

  constraints:string[];

  opportunities:string[];

};





/**
 * =====================================================
 * EXPERIENCE UNDERSTANDING
 *
 * Complete semantic output.
 *
 * =====================================================
 */

export type ExperienceUnderstanding = {


  /**
   * Original human input
   */
  prompt:string;



  /**
   * Intent intelligence
   */
  intent:

    ExperienceIntent[];



  /**
   * Reality extraction
   */
  entities:

    ExperienceEntities;



  /**
   * Semantic relationships
   */
  relationships:

    ExperienceRelationship[];



  /**
   * Emotional intelligence
   */
  emotions:

    EmotionUnderstanding;



  /**
   * Memory intelligence
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
   * Human desire intelligence
   */
  desire:

    HumanDesireUnderstanding;



  /**
   * Sensory intelligence
   */
  sensory:

    SensoryUnderstanding;



  /**
   * Creation possibility space
   */
  potential:

    CreationPotentialUnderstanding;



  /**
   * Confidence scoring
   */
  scores:

    UnderstandingScore;



  /**
   * Global confidence
   */
  confidence:number;


};