/**
 * =====================================================
 * QRE EXPERIENCE RUNTIME CONTRACT
 * =====================================================
 *
 * Enterprise Runtime Boundary.
 *
 * Compiler World
 *        ↓
 * Runtime Projection
 *        ↓
 * Human Experience
 *
 * The frontend consumes this layer.
 *
 * The frontend does NOT consume:
 *
 * - compiler cognition
 * - semantic genome
 * - intelligence systems
 * - world synthesis internals
 *
 * =====================================================
 */

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

import type {
  ExperienceMoment,
} from "./moment.js";

import type {
  AccessState,
} from "../scan.js";


/**
 * =====================================================
 * RUNTIME ASSET IDENTITY
 *
 * Physical identity projected into runtime.
 *
 * No database models.
 * No persistence concerns.
 *
 * =====================================================
 */

export type RuntimeAsset = {

  id:string;

  slug:string;

  title:string;

  category?:string;

  accountId?:string;

  paid?:boolean;

};
/**
 * =====================================================
 * EXPERIENCE ACCESS MODE
 *
 * Controls runtime delivery.
 *
 * DEMO:
 * User can experience the surface layer.
 *
 * UNLOCKED:
 * User receives complete experience.
 *
 * =====================================================
 */

export type ExperienceAccessMode =
  | "DEMO"
  | "UNLOCKED";


/**
 * =====================================================
 * PLAYER CONFIGURATION
 *
 * Presentation instructions only.
 *
 * Does not affect compilation.
 * Does not affect business logic.
 *
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
 * RUNTIME EXPERIENCE
 *
 * Canonical execution artifact.
 *
 * Produced by:
 *
 * scanEngine
 *
 * Consumed by:
 *
 * Cinematic Player
 * API layer
 * Delivery systems
 *
 * =====================================================
 */

export type RuntimeExperience = {


  /**
   * Runtime session identity
   */
  sessionId:string | null;



  /**
   * Asset identity
   */
  asset:RuntimeAsset | null;



  /**
   * Access decision.
   *
   * DEMO
   * UNLOCKED
   * etc.
   */
  accessState:ExperienceAccessMode;
   unlock?:ExperienceUnlockState;
  /**
   * Ordered human experience moments.
   */
  moments:ExperienceMoment[];



  /**
   * Cinematic execution layer.
   */
  cinematicScenes:CinematicScene[];



  /**
   * Geographic narrative layer.
   */
  geoStory?:GeoStory | null;



  /**
   * Memory artifact.
   *
   * Created after completion/unlock.
   */
  memorySnapshot?:MemorySnapshot | null;



  /**
   * Service completion proof.
   */
  receipt?:ServiceReceipt | null;



  /**
   * Player execution instructions.
   */
  player?:ExperiencePlayerConfig;



  /**
   * Runtime generated insights.
   *
   * Analytics intelligence projection.
   */
  insights?:unknown[];



  /**
   * Contract evolution version.
   */
  runtimeVersion:string;
   


  /**
   * Creation timestamp.
   */
  timestamp:string;
     /**
   * Runtime provenance.
   *
   * Tracks how this experience was produced.
   */
  source?:{
    compiler?:string;
    version?:string;
    generatedAt?:string;
  };
};
/**
 * =====================================================
 * UNLOCK INFORMATION
 *
 * Commerce → Runtime bridge
 *
 * =====================================================
 */

export type ExperienceUnlockState = {

  required:boolean;

  unlocked:boolean;

  productId?:string;

};


/**
 * =====================================================
 * RUNTIME FAILURE CONTRACT
 *
 * Used when a scan cannot produce
 * a RuntimeExperience.
 *
 * Keeps RuntimeExperience pure.
 *
 * =====================================================
 */

export type RuntimeExperienceFailure = {


  success:false;


  reason:
    | "ASSET_NOT_FOUND"
    | "ACCESS_DENIED"
    | "INVALID_SCAN"
    | "RUNTIME_ERROR";


  message:string;


  timestamp:string;

};



/**
 * =====================================================
 * RUNTIME RESULT UNION
 *
 * Enterprise API boundary.
 *
 * =====================================================
 */

export type RuntimeExperienceResult =

  | RuntimeExperience
  | RuntimeExperienceFailure;



/**
 * =====================================================
 * LEGACY COMPATIBILITY ALIAS
 *
 * Migration:
 *
 * Experience
 *       ↓
 * RuntimeExperience
 *
 * =====================================================
 */

export type Experience = RuntimeExperience;