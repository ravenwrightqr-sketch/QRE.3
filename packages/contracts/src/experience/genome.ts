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
 * Genome understands:
 *
 * - intent
 * - meaning
 * - emotion
 * - world
 * - audience
 * - relationships
 * - identity
 * - transformation
 * - sensory direction
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
  ExperienceLifecycle,
} from "./lifecycle.js";

import type {
  ObjectGenome,
} from "./objectGenome.js";

import type {
  ExperienceMeaning,
} from "./meaning.js";

import type {
  WorldDomain
} from "./world.js";

import type {
  SemanticInterpretation,
} from "./semantic.js";


/**
 * =====================================================
 * EXPERIENCE ENERGY
 * =====================================================
 */

export type ExperienceEnergy =

  | "calm"
  | "intense"
  | "playful"
  | "mysterious"
  | "emotional"
  | "premium"
  | "cinematic"
  | "transformative";




/**
 * =====================================================
 * EXPERIENCE PACING
 * =====================================================
 */

export type ExperiencePacing =

  | "slow"
  | "medium"
  | "fast";




/**
 * =====================================================
 * EXPERIENCE SOCIAL MODE
 * =====================================================
 */

export type ExperienceSocial =

  | "solo"
  | "shared"
  | "community";




/**
 * =====================================================
 * EXPERIENCE JOURNEY
 * =====================================================
 */

export type ExperienceJourney =

  | "arrival"
  | "discovery"
  | "reveal"
  | "transformation"
  | "peak"
  | "memory"
  | "share"
  | "return";




/**
 * =====================================================
 * EXPERIENCE RELATIONSHIP
 * =====================================================
 */

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



/**
 * =====================================================
 * EXPERIENCE GENOME
 *
 * Creative DNA
 *
 * =====================================================
 */

export interface ExperienceGenome {


  /**
   * Human desire / request
   */
  intent:

    string[];


  interpretation:

    SemanticInterpretation;



  archetypes:

    string[];



  themes:

    string[];



  emotions:

    string[];



  meaning:

    ExperienceMeaning;



  /**
   * Semantic graph
   */
  relationships:

    ExperienceRelationship[];




  /**
   * =====================================================
   * WORLD INTELLIGENCE
   *
   * Universe/domain this experience belongs to.
   *
   * NOT industry.
   * NOT template.
   *
   * Example:
   * memory_world
   * commerce_world
   * service_world
   * journey_world
   *
   * =====================================================
   */

  worlds:

    WorldDomain[];




  /**
   * Experience personality
   */
  energy:

    ExperienceEnergy;



  pacing:

    ExperiencePacing;



  social:

    ExperienceSocial;



  /**
   * Human journey
   */
  journey:

    ExperienceJourney[];



  /**
   * Experience physics
   */
  discovery:

    number;


  memory:

    number;


  commerce:

    number;


  immersion:

    number;


  interaction:

    number;


  replay:

    number;





  /**
   * Reality extraction
   */
  entities:

    ExperienceEntities;


  /**
   * =====================================================
   * OBJECT IDENTITY LAYER
   *
   * Everything is an object.
   *
   * =====================================================
   */

  object:

    ObjectGenome;

   /**
 * =====================================================
 * LIFE CYCLE INTELLIGENCE
 *
 * How this entity changes through time.
 *
 * =====================================================
 */

lifecycle:
ExperienceLifecycle;
  /**
   * World/environment possibilities
   */
  environments:

    string[];





  /**
   * Audience categories
   */
  audience:

    string[];





  /**
   * Creative fingerprint
   *
   * Example:
   * cinematic
   * mysterious
   * adaptive
   */
  dna:

    string[];





  /**
   * =====================================================
   * ADVANCED CREATIVE DIMENSIONS
   * =====================================================
   */


  /**
   * Emotional voice
   *
   * Example:
   * dark
   * hopeful
   * nostalgic
   */
  tone:

    string[];





  /**
   * Sensory identity
   *
   * Example:
   * visual
   * sound
   * atmosphere
   */
  sensory:

    string[];





  /**
   * Symbolic language
   *
   * Example:
   * raven
   * ocean
   * fire
   * rebirth
   */
  symbols:

    string[];





  /**
   * Human change produced
   *
   * Example:
   * inspire
   * heal
   * connect
   */
  transformation:

    string[];

}