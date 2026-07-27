/**
 * =====================================================
 * QRE STORY DELIVERY CONTRACT
 * =====================================================
 *
 * Delivery layer contract.
 *
 * Purpose:
 *
 * Receives a compiled experience and hands it
 * to delivery systems.
 *
 * Pipeline:
 *
 * ExperienceMoment[]
 *        ↓
 * StoryDelivery
 *        ↓
 * Cinematic Player
 *        ↓
 * Customer
 *
 *
 * Rules:
 *
 * NO DATABASE
 * NO PRISMA
 * NO ENGINE LOGIC
 * NO LEGACY MOMENT TYPES
 *
 * =====================================================
 */


import type {
  GeoStory,
} from "./geoStory.js";


import type {
  CinematicScene,
} from "./cinematic.js";

import type {
  ExperienceMoment,
} from "./index.js";




/**
 * =====================================================
 * STORY DELIVERY INPUT
 *
 * Created by engine.
 *
 * Consumed by delivery services.
 *
 * =====================================================
 */


export type StoryDeliveryInput = {


  /**
   * Asset identity
   */

  assetId:string;



  /**
   * Scan session identity
   */

  sessionId:string;



  /**
   * Optional recipient/user boundary
   */

  userId?:string|null;



  /**
   * Compiled experience meaning layer.
   *
   * This is NOT legacy Moment.
   *
   * ExperienceMoment is the canonical
   * experience construction unit.
   */

  moments:ExperienceMoment[];



  /**
   * Geographic narrative layer.
   */

  geoStory:GeoStory|null;



  /**
   * Final player scenes.
   */

  cinematicScenes:CinematicScene[];


};





/**
 * =====================================================
 * STORY DELIVERY RESULT
 *
 * Output after successful delivery.
 *
 * =====================================================
 */


export type StoryDeliveryResult = {


  /**
   * Delivery identity
   */

  storyId:string;



  /**
   * Public share location
   */

  shareUrl:string;



  /**
   * Delivery completion state
   */

  delivered:boolean;


};