/**
 * =====================================================
 * QRE SCAN RESPONSE CONTRACT
 * =====================================================
 *
 * Scan Request
 *       |
 *       v
 *   Scan Engine
 *       |
 *       v
 * ScanResponse
 *       |
 *       v
 * Frontend Player
 *
 *
 * Public runtime response.
 *
 * NO DATABASE
 * NO PRISMA
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
 * ACCESS
 * =====================================================
 */

export type ScanAccess =
  | "DEMO"
  | "UNLOCKED";






/**
 * =====================================================
 * PUBLIC ASSET
 * =====================================================
 */

export type ScanAsset = {

  id:string;

  slug:string;

  title?:string;

  category?:string;

  paid:boolean;

  status?:
    | "ACTIVE"
    | "DISABLED"
    | "ARCHIVED";

};






/**
 * =====================================================
 * PLAYER BOOT
 * =====================================================
 */

export type ScanPlayerConfig = {

  autoplay?:boolean;


  theme?:
    | "dark"
    | "light"
    | "glass"
    | "cinematic";


  showControls?:boolean;

};






/**
 * =====================================================
 * MEDIA PRELOAD
 * =====================================================
 */

export type ScanMedia = {

  images:string[];

  videos:string[];

  audio:string[];

};






/**
 * =====================================================
 * SCAN RESPONSE
 * =====================================================
 */

export type ScanResponse = {


  /**
   * Session identity
   */
  sessionId:string|null;




  /**
   * Access decision
   */
  access:ScanAccess;



  /**
   * Preview flag
   */
  preview:boolean;




  /**
   * Public asset
   */
  asset:ScanAsset|null;




  /**
   * Semantic runtime
   */
  moments:Moment[];




  /**
   * Geo experience
   */
  geoStory:GeoStory|null;




  /**
   * Cinematic player scenes
   */
  cinematicScenes:CinematicScene[];




  /**
   * AI memory layer
   */
  memorySnapshot:MemorySnapshot|null;




  /**
   * Completion proof
   */
  receipt:ServiceReceipt|null;




  /**
   * Analytics summary
   */
  insights:unknown[];





  /**
   * Frontend preload
   */
  media?:ScanMedia;





  /**
   * Player settings
   */
  player?:ScanPlayerConfig;




  /**
   * Runtime metadata
   */
  timestamp:string;


};