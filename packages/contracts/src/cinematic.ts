/**
 * =====================================================
 * QRE CINEMATIC SCENE CONTRACT
 * =====================================================
 *
 * Runtime presentation layer.
 *
 * Pipeline:
 *
 * Experience Flow
 *        ↓
 * Experience Moment
 *        ↓
 * Cinematic Compiler
 *        ↓
 * CinematicScene
 *        ↓
 * Cinematic Runtime
 *        ↓
 * Cinematic Player
 *
 *
 * ExperienceMoment:
 *   semantic truth
 *
 * CinematicScene:
 *   player execution instructions
 *
 *
 * CONTRACT ONLY
 *
 * NO DATABASE
 * NO PRISMA
 * NO STORAGE
 * NO URL OWNERSHIP
 * NO BUSINESS LOGIC
 *
 * =====================================================
 */

import type {
  ExperienceMoment,
} from "./experience/moment.js";



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
  | "reveal"
  | "timeline"
  | "environment"
  | "transition"
  | "cta"
  | "credits";




/**
 * =====================================================
 * NARRATIVE INTENT
 * =====================================================
 */

export type SceneIntent = {

  emotion?:string[];

  purpose?:string;

  arc?:
    | "arrival"
    | "discovery"
    | "connection"
    | "reflection"
    | "completion";

};




/**
 * =====================================================
 * CAMERA DIRECTION
 * =====================================================
 */

export type CameraInstruction = {

  movement?:
    | "static"
    | "zoom"
    | "pan"
    | "orbit"
    | "dolly"
    | "follow";


  intensity?:
    | "subtle"
    | "medium"
    | "dramatic";


  focus?:string;

};




/**
 * =====================================================
 * MEDIA REFERENCES
 *
 * Runtime never owns storage.
 *
 * Media Engine resolves:
 *
 * assetId
 *    ↓
 * CDN
 *    ↓
 * Player
 *
 * =====================================================
 */

export type SceneMediaAsset = {

  assetId:string;


  role:
    | "background"
    | "image"
    | "video"
    | "audio";

};




/**
 * =====================================================
 * AUDIO LAYER
 * =====================================================
 */

export type SceneAudio = {

  assetId?:string;

  url?:string;


  type:
    | "music"
    | "voice"
    | "ambient"
    | "sound_effect";


  mood?:string;

  volume?:number;

  autoplay?:boolean;

  loop?:boolean;

};




/**
 * =====================================================
 * VISUAL ENGINE
 * =====================================================
 */

export type SceneVisual = {

  theme:
    | "dark"
    | "light"
    | "cinematic"
    | "glass"
    | "dream"
    | "memory"
    | "immersive";


  animation:
    | "none"
    | "slow_zoom"
    | "parallax"
    | "particles"
    | "glitch"
    | "film"
    | "cinematic_camera";


  environmentId?:string;

  background?:string;

  assets?:SceneMediaAsset[];

  effects?:string[];

  camera?:CameraInstruction;

};




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
  | "dissolve"
  | "none";




/**
 * =====================================================
 * PLAYER CONTROL
 * =====================================================
 */

export type ScenePlayback = {

  duration:number;

  preload:boolean;

  skippable?:boolean;

  autoplay?:boolean;

  interactionRequired?:boolean;

};




/**
 * =====================================================
 * PLAYER INTERACTION
 * =====================================================
 */

export type SceneInteraction = {

  enabled:boolean;

  actions?:
    | "tap"
    | "swipe"
    | "scan"
    | "choose"
    | "continue";

};




/**
 * =====================================================
 * ANALYTICS
 * =====================================================
 */

export type SceneTelemetry = {

  eventName?:string;


  category?:
    | "story"
    | "memory"
    | "conversion"
    | "interaction";

};




/**
 * =====================================================
 * AI / GENERATION TRACE
 * =====================================================
 */

export type CinematicSceneMeta = {

  version:string;

  generated:boolean;


  source:
    | "experience_compiler"
    | "memory_engine"
    | "system";


  tags?:string[];

};




/**
 * =====================================================
 * CINEMATIC SCENE
 *
 * THE PLAYER CONTRACT
 *
 * =====================================================
 */

export type CinematicScene = {

  id:string;


  type:CinematicSceneType;


  moment:ExperienceMoment;


  intent?:SceneIntent;


  order:number;


  transition:SceneTransition;


  visual:SceneVisual;


  audio?:SceneAudio;


  playback:ScenePlayback;


  interaction?:SceneInteraction;


  telemetry?:SceneTelemetry;


  meta:CinematicSceneMeta;

};