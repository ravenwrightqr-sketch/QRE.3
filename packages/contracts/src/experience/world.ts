/**
 * =====================================================
 * QRE EXPERIENCE WORLD CONTRACT
 * =====================================================
 *
 * Genome
 *   ↓
 * World Intelligence
 *   ↓
 * Experience World
 *
 * THE EMOTIONAL UNIVERSE
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceMoment,
} from "./moment.js";


import type {
  ExperienceArchetype,
  ExperienceContext
} from "./index.js";





/**
 * =====================================================
 *
 * WORLD DOMAIN
 *
 * The universe category.
 *
 * =====================================================
 */


export type WorldDomain =

  | "memory_world"
  | "relationship_world"
  | "commerce_world"
  | "culture_world"
  | "discovery_world"
  | "journey_world"
  | "identity_world"
  | "community_world"
  | "service_world"
  | "transformation_world";






/**
 * =====================================================
 *
 * WORLD ROLE
 *
 * What this universe does.
 *
 * =====================================================
 */


export type WorldRole =

  | "remember"
  | "connect"
  | "transform"
  | "discover"
  | "sell"
  | "teach"
  | "celebrate"
  | "guide"
  | "preserve";






/**
 * =====================================================
 *
 * WORLD IDENTITY
 *
 * Personality of the universe.
 *
 * =====================================================
 */


export type WorldIdentity = {


  name:string;


  description:string;


  philosophy:string;


  origin:string;


  promise:string;


  emotionalCore:string;


  symbol:string;


};







/**
 * =====================================================
 *
 * WORLD LAWS
 *
 * Physics of meaning.
 *
 * =====================================================
 */


export type WorldLaw = {


  principle:string;


  reason:string;


  effect:string;


};








/**
 * =====================================================
 *
 * WORLD SIGNATURE
 *
 * DNA fingerprint.
 *
 * Used for:
 *
 * - similarity matching
 * - adaptive compilation
 * - future world memory
 * - recommendation engine
 *
 * =====================================================
 */


export type WorldSignature = {


 semantic:string[];


 emotional:string[];


 visual:string[];


 sensory:string[];


};








/**
 * =====================================================
 *
 * WORLD TRANSFORMATION
 *
 * Human change.
 *
 * =====================================================
 */


export type WorldTransformation = {


 before:string;


 journey:string;


 after:string;


};









/**
 * =====================================================
 *
 * WORLD ARTIFACT
 *
 * Things living inside universes.
 *
 * =====================================================
 */


export type WorldArtifact = {


 world:WorldDomain;


 moments:ExperienceMoment[];


 metadata?:
 Record<string,unknown>;


};









/**
 * =====================================================
 *
 * EXPERIENCE WORLD
 *
 * THE WORLD DOM
 *
 * =====================================================
 */


export type ExperienceWorld = {


/**
 * Universe category
 */
domain:

WorldDomain;

/**
 * Creative archetype
 */
archetype:

ExperienceArchetype;

/**
 * Universe function
 */
role:

WorldRole;

/**
 * Human reason
 */
purpose:

string;


/**
 * Personality layer
 */
worldIdentity:

WorldIdentity;

/**
 * Universe physics
 */
worldLaws:

WorldLaw[];

/**
 * DNA fingerprint
 */
signature:

WorldSignature;


/**
 * Emotional rules
 */
emotionalPhysics:

string[];

/**
 * Sensory instructions
 */
sensoryLanguage:

string[];

/**
 * Human transformation
 */
transformation?:

WorldTransformation;

/**
 * Narrative progression
 */
journey:

string[];


/**
 * Experience ingredients
 */
atoms:

string[];


/**
 * Themes discovered
 */
themes:

string[];


/**
 * Related universes
 */
connectedWorlds:

WorldDomain[];


/**
 * Generation source
 */
context?:

ExperienceContext;


/**
 * Future evolution memory
 *
 * Allows replay intelligence.
 */
memory?:

{


  moments:number;


  emotionalWeight:number;


  replayCount:number;


};

/**
 * Adaptive intelligence
 *
 * Allows world mutation.
 */
evolution?:

{


  learnedPatterns:string[];


  nextPossibleStates:string[];


};

/**
 * Things inside universe
 */
artifacts:

WorldArtifact[];


};