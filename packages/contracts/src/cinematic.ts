/**
 * =====================================================
 * QRE CINEMATIC SCENE CONTRACT
 * =====================================================
 *
 * Runtime presentation layer.
 *
 * Pipeline:
 *
 * Flow
 *   ↓
 * Moment
 *   ↓
 * CinematicScene
 *   ↓
 * Cinematic Player
 *
 *
 * Moment:
 *   semantic meaning
 *
 * CinematicScene:
 *   visual execution instructions
 *
 *
 * NO DATABASE
 * NO STORAGE
 * NO PRISMA
 *
 * =====================================================
 */


import type {
  Moment,
} from "./moment.js";



/**
 * =====================================================
 * SCENE TYPES
 * =====================================================
 */

export type CinematicSceneType =

  | "intro"

  | "system"

  | "emotion"

  | "action"

  | "memory"

  | "cta";




/**
 * =====================================================
 * TRANSITIONS
 * =====================================================
 */

export type SceneTransition =

  | "fade"

  | "slide"

  | "zoom"

  | "cinematic"

  | "flash"

  | "none";





/**
 * =====================================================
 * AUDIO LAYER
 * =====================================================
 */

export type SceneAudio = {

  url:string;


  type:
    | "music"
    | "voice"
    | "ambient";


  volume?:number;


  autoplay?:boolean;

};





/**
 * =====================================================
 * VISUAL EFFECTS
 * =====================================================
 */

export type SceneVisual = {


  background?:
    | string;


  animation?:
    | "none"
    | "slow_zoom"
    | "parallax"
    | "particles"
    | "glitch";


  theme?:
    | "dark"
    | "light"
    | "cinematic"
    | "glass";

};





/**
 * =====================================================
 * CINEMATIC SCENE
 * =====================================================
 */

export type CinematicScene = {


  /**
   * Unique runtime scene id
   */
  id:string;



  /**
   * Presentation category.
   *
   * NOT business meaning.
   */
  type:CinematicSceneType;



  /**
   * Playback duration ms
   */
  duration:number;



  /**
   * Source semantic moment.
   *
   * SINGLE SOURCE OF TRUTH.
   */
  moment:Moment;



  /**
   * Player ordering.
   */
  order?:number;



  /**
   * Scene transition.
   */
  transition?:SceneTransition;



  /**
   * Audio attached to scene.
   */
  audio?:SceneAudio;



  /**
   * Visual runtime instructions.
   */
  visual?:SceneVisual;



  /**
   * Player optimization.
   *
   * Example:
   *
   * preload next video
   * preload images
   */
  preload?:boolean;



  /**
   * Future AI/runtime metadata.
   */
  meta?:Record<string,unknown>;

};