import type {
  Moment,
} from "../moment.js";

import type {
  GeoStory,
} from "../geoStory.js";

import type {
  CinematicScene,
} from "../cinematic.js";

import type {
  MemorySnapshot,
} from "../memorySnapshot.js";

import type {
  ServiceReceipt,
} from "../serviceReceipt.js";


/**
 * =====================================================
 * EXPERIENCE ACCESS
 * =====================================================
 */

export type ExperienceAccess =
  | "DEMO"
  | "UNLOCKED"
 



/**
 * =====================================================
 * PUBLIC ASSET IDENTITY
 *
 * Runtime-safe.
 * No Prisma fields.
 * Ownership uses account boundary.
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
 * MEDIA MANIFEST
 *
 * Preloaded runtime assets.
 * =====================================================
 */

export type ExperienceMediaManifest = {

  images:string[];

  videos:string[];

  audio:string[];

};



/**
 * =====================================================
 * COMPLETE EXPERIENCE RUNTIME
 *
 * Engine output.
 * API payload.
 * Player input.
 *
 * =====================================================
 */

export type Experience = {


  /**
   * Runtime session
   */

  sessionId:string|null;



  /**
   * Access state
   */

  access:ExperienceAccess;



  /**
   * Preview flag
   */

  preview:boolean;



  /**
   * Asset identity
   */

  asset:AssetSummary|null;



  /**
   * Story atoms
   */

  moments:Moment[];



  /**
   * Location memory
   */

  geoStory:GeoStory|null;



  /**
   * Cinematic playback
   */

  cinematicScenes:CinematicScene[];



  /**
   * Memory preservation
   */

  memorySnapshot:MemorySnapshot|null;



  /**
   * Completion proof
   */

  receipt:ServiceReceipt|null;



  /**
   * Media optimization
   */

  media?:ExperienceMediaManifest;



  /**
   * Player behavior
   */

  player?:ExperiencePlayerConfig;



  /**
   * Analytics/context
   */

  insights:unknown[];



  /**
   * Runtime extensions
   */

  meta?:Record<string,unknown>;

    /**
   * Runtime creation timestamp
   *
   * Public API metadata.
   */

  timestamp:string;

};