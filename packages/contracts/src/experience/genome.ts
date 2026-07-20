/**
 * =====================================================
 * QRE EXPERIENCE GENOME CONTRACT
 * =====================================================
 *
 * Human Prompt
 *      ↓
 * Semantic Understanding
 *      ↓
 * Experience Genome
 *
 * This is the creative DNA.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO INDUSTRY TEMPLATE LOGIC
 *
 * =====================================================
 */


import type {
  ExperienceEntities,
} from "./entityExtractor.js";


import type {
  ExperienceMeaning,
} from "./meaning.js";



export type ExperienceEnergy =
  | "calm"
  | "intense"
  | "playful"
  | "mysterious"
  | "emotional"
  | "premium";



export type ExperiencePacing =
  | "slow"
  | "medium"
  | "fast";



export type ExperienceSocial =
  | "solo"
  | "shared"
  | "community";



export type ExperienceJourney =
  | "arrival"
  | "discovery"
  | "reveal"
  | "transformation"
  | "peak"
  | "memory"
  | "share"
  | "return";



export type ExperienceRelationship = {

  subject:string;

  predicate:
    | "met_at"
    | "belongs_to"
    | "created_by"
    | "performed_at"
    | "favorite"
    | "celebrates"
    | "remembered_at"
    | "visited"
    | "shared_with"
    | "located_at";

  object:string;

  confidence:number;

};





export interface ExperienceGenome {


  /**
   * What the human wants
   */
  intent:string[];



  /**
   * Psychological archetypes
   *
   * Example:
   * discovery
   * memory
   * connection
   */
  archetypes:string[];



  /**
   * Semantic themes
   */
  themes:string[];



  /**
   * Emotional signals
   */
  emotions:string[];



  /**
   * Deep meaning
   */
  meaning:ExperienceMeaning;



  /**
   * Extracted relationships
   */
  relationships:
    ExperienceRelationship[];



  /**
   * Experience personality
   */
  energy:
    ExperienceEnergy;



  pacing:
    ExperiencePacing;



  social:
    ExperienceSocial;



  journey:
    ExperienceJourney[];



  /**
   * Creative dimensions
   */
  discovery:number;

  memory:number;

  commerce:number;

  immersion:number;

  interaction:number;

  replay:number;



  /**
   * Extracted reality
   */
  entities:
    ExperienceEntities;



  environments:
    string[];



  audience:
    string[];



  /**
   * Creative DNA
   *
   * NOT industry.
   *
   * Example:
   * cinematic
   * premium
   * mysterious
   * adaptive
   */
  dna:
    string[];


}