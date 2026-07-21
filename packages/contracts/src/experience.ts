/**
 * =====================================================
 * QRE EXPERIENCE CONTRACT
 * =====================================================
 *
 * Complete runtime experience payload.
 *
 * API
 *   ↓
 * Experience
 *   ↓
 * Cinematic Player
 *
 *
 * This is NOT a database model.
 *
 * It is the assembled runtime world.
 *
 * =====================================================
 */


import type {
  Moment,
} from "./moment.js";


import type {
  GeoStory,
} from "./geoStory.js";


import type {
  CinematicScene,
} from "./cinematic.js";


import type {
  MemorySnapshot,
} from "./memorySnapshot.js";


import type {
  ServiceReceipt,
} from "./serviceReceipt.js";





/**
 * =====================================================
 * ASSET SUMMARY
 * =====================================================
 *
 * Public runtime identity.
 *
 * No Prisma fields.
 *
 * =====================================================
 */

export type AssetSummary = {


  id:string;


  slug:string;



  title?:string;


  category?:string;


accountId:string|null;



  paid:boolean;



  status?:

    | "ACTIVE"

    | "DISABLED"

    | "ARCHIVED";

};






/**
 * =====================================================
 * ACCESS STATE
 * =====================================================
 */

export type ExperienceAccess =

  | "PREVIEW"

  | "LOCKED"

  | "UNLOCKED";






/**
 * =====================================================
 * PLAYER CONFIGURATION
 * =====================================================
 */

export type ExperiencePlayerConfig = {


  autoplay?:boolean;


  loop?:boolean;


  showControls?:boolean;



  theme?:

    | "dark"

    | "light"

    | "glass"

    | "cinematic";



  transition?:

    | "fade"

    | "cinematic"

    | "slide";

};






/**
 * =====================================================
 * MEDIA PRELOAD
 * =====================================================
 */

export type ExperienceMediaManifest = {


  images:string[];


  videos:string[];


  audio:string[];

};






/**
 * =====================================================
 * COMPLETE EXPERIENCE
 * =====================================================
 */

export type Experience = {



  /**
   * Runtime session
   */
  sessionId:string|null;



  /**
   * Access control
   */
  access:ExperienceAccess;



  /**
   * Preview mode
   */
  preview:boolean;




  /**
   * Public asset identity
   */
  asset:AssetSummary|null;




  /**
   * Semantic runtime layer
   */
  moments:Moment[];




  /**
   * Geographic memory
   */
  geoStory:GeoStory|null;




  /**
   * Visual runtime
   */
  cinematicScenes:CinematicScene[];




  /**
   * AI memory layer
   */
  memorySnapshot:MemorySnapshot|null;




  /**
   * Service/completion proof
   */
  receipt:ServiceReceipt|null;





  /**
   * Frontend optimization
   */
  media?:ExperienceMediaManifest;



  /**
   * Player settings
   */
  player?:ExperiencePlayerConfig;





  /**
   * Analytics already resolved
   */
  insights:unknown[];




  /**
   * Runtime metadata
   */
  meta?:Record<string,unknown>;



};