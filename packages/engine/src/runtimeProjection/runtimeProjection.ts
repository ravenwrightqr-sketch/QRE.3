/**
 * =====================================================
 * QRE RUNTIME PROJECTION ENGINE
 * =====================================================
 *
 * Runtime artifact synthesis layer.
 *
 * Compiler World
 *        ↓
 * Runtime Projection
 *        ↓
 * Human Experience
 *
 * Responsibilities:
 *
 * - Convert runtime signals into experience artifacts
 * - Generate geographic narrative
 * - Generate memory artifacts when permitted
 *
 * DOES NOT OWN:
 *
 * - Database
 * - Access logic
 * - Persistence
 * - API responses
 *
 * Access decisions are provided by caller.
 *
 * =====================================================
 */

import {
  buildGeoStory,
  type GeoPoint,
} from "../geo/geoStoryCompiler.js";


import {
  buildMemorySnapshot,
} from "../geo/buildMemorySnapshot.js";


import type {
  ExperienceMoment,
  CinematicScene,
  GeoStory,
  MemorySnapshot,
} from "@qre/contracts";



/**
 * =====================================================
 * INPUT CONTRACT
 *
 * Runtime state entering projection layer.
 *
 * =====================================================
 */

export type RuntimeProjectionInput = {


  /**
   * Runtime asset identity
   */
  assetId:string;



  /**
   * Geographic evidence.
   */
  geoPoints:GeoPoint[];



  /**
   * Semantic experience units.
   */
  moments:ExperienceMoment[];



  /**
   * Presentation runtime.
   */
  cinematicScenes:CinematicScene[];



  /**
   * Memory creation permission.
   *
   * DEMO:
   * false
   *
   * UNLOCKED:
   * true
   */
  createMemory:boolean;


};




/**
 * =====================================================
 * OUTPUT CONTRACT
 *
 * Runtime artifacts.
 *
 * =====================================================
 */

export type RuntimeProjection = {


  /**
   * Geographic narrative.
   *
   * Available for demo.
   */
  geoStory:GeoStory;



  /**
   * Persistent memory artifact.
   *
   * Only generated after unlock.
   */
  memorySnapshot:MemorySnapshot | null;


};





/**
 * =====================================================
 * RUNTIME PROJECTION PIPELINE
 *
 * Geo
 * ↓
 * Memory
 * ↓
 * Runtime Artifact
 *
 * =====================================================
 */

export function projectRuntime(

  input:RuntimeProjectionInput

):RuntimeProjection {



  /**
   * =====================================================
   * GEO STORY PROJECTION
   *
   * Always available.
   *
   * Demo experiences can show location narrative.
   *
   * =====================================================
   */

  const geoStory =

    buildGeoStory(

      input.assetId,

      input.geoPoints

    );




  /**
   * =====================================================
   * MEMORY SNAPSHOT PROJECTION
   *
   * Only unlocked experiences
   * create permanent memory artifacts.
   *
   * =====================================================
   */

  const memorySnapshot =

    input.createMemory

    ?

    buildMemorySnapshot({

      assetId:
        input.assetId,


      moments:
        input.moments,


      geoStory,


      cinematicScenes:
        input.cinematicScenes,

    })


    :

    null;





  /**
   * =====================================================
   * FINAL RUNTIME PROJECTION
   * =====================================================
   */

  return {


    geoStory,


    memorySnapshot,


  };


}