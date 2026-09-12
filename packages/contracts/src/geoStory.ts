/**
 * =====================================================
 * QRE GEO STORY CONTRACT
 * =====================================================
 *
 * Geographic memory layer.
 *
 * Converts presence signals into a cinematic journey.
 *
 * Flow:
 *
 * Geo Proof
 *     ↓
 * GeoStory
 *     ↓
 * GeoStoryScene
 *     ↓
 * Cinematic Runtime
 *     ↓
 * Player
 *
 * NO DATABASE
 * NO PRISMA
 * NO STORAGE PROVIDER
 *
 * =====================================================
 */

import type {
  MediaAsset,
} from "./media.js";



/**
 * =====================================================
 * GEO LOCATION
 * =====================================================
 */

export type GeoLocation = {

  lat:number;

  lng:number;


  label?:string;

  city?:string;

  region?:string;

  country?:string;

};



/**
 * =====================================================
 * GEO SCENE TYPES
 * =====================================================
 */

export type GeoStorySceneType =

  | "intro"

  | "arrival"

  | "presence"

  | "return"

  | "exit";




/**
 * =====================================================
 * GEO STORY SCENE
 * =====================================================
 *
 * A single moment in a geographic journey.
 *
 * Example:
 *
 * "Arrived at Apocalypse"
 *
 * "Returned to favorite location"
 *
 * =====================================================
 */

export type GeoStoryScene = {


  id:string;



  type:
    GeoStorySceneType;



  title:string;



  description:string;



  /**
   * Physical location
   */
  location?:GeoLocation;



  /**
   * When this happened
   */
  timestamp:string;



  /**
   * Importance of this location.
   *
   * 0 = insignificant
   *
   * 1 = major memory point
   */
  intensity:number;



  /**
   * Media attached to location.
   *
   * Photos
   * Videos
   * Audio
   */
  media?:MediaAsset[];



  /**
   * Future expansion:
   *
   * weather
   * AI summaries
   * emotions
   * people
   * events
   */
  meta?:Record<string,unknown>;

};





/**
 * =====================================================
 * GEO STORY
 * =====================================================
 *
 * Complete geographic memory journey.
 *
 * Example:
 *
 * Relationship:
 *   first meeting
 *   favorite places
 *   anniversary replay
 *
 * Event:
 *   arrival
 *   venue
 *   friends
 *   highlights
 *
 * =====================================================
 */

export type GeoStory = {


  /**
   * Experience owner asset
   */
  assetId:string;



  /**
   * Runtime session.
   *
   * Optional because stories
   * can exist after session ends.
   */
  sessionId?:string;



  /**
   * Generated title.
   *
   * Example:
   * "Our Night Under The Desert Sky"
   */
  title?:string;



  /**
   * Human readable summary.
   */
  summary:string;



  /**
   * Ordered geographic scenes.
   */
  scenes:GeoStoryScene[];



  /**
   * Journey boundaries.
   */
  startedAt?:string;

  endedAt?:string;



  /**
   * Future AI layers:
   *
   * emotional analysis
   * memories detected
   * participants
   * themes
   */
  meta?:Record<string,unknown>;

};