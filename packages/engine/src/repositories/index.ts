/**
 * =====================================================
 * QRE ENGINE REPOSITORY CONTRACTS
 * =====================================================
 *
 * The engine NEVER imports Prisma.
 *
 * Database adapters translate:
 *
 * Prisma Models
 *        ↓
 * Repository Contracts
 *        ↓
 * Engine Runtime
 *
 * AssetFlow relationships are resolved
 * before entering the engine.
 *
 * =====================================================
 */


/**
 * =====================================================
 * FLOW RUNTIME CONTRACT
 * =====================================================
 */


export type FlowStepRecord = {

  id:string;

  order:number;

  type:string;

  payload:unknown;

};



export type FlowRecord = {

  id:string;

  steps:FlowStepRecord[];

};





/**
 * =====================================================
 * ASSET RUNTIME CONTRACT
 * =====================================================
 */


export type AssetRecord = {

  id:string;

  slug:string;


/**
 * Runtime account identity.
 *
 * Database adapters expose:
 *
 * Asset.accountId
 *        ↓
 * accountId
 *
 * Engine does not know Prisma.
 * Engine does not query Account relations.
 */


  accountId:string | null;


  paid:boolean;


  category:string | null;


  flow:FlowRecord | null;

};





export interface AssetRepository {


  findBySlug(

    slug:string

  ):Promise<AssetRecord | null>;


}





/**
 * =====================================================
 * SESSION CONTRACT
 * =====================================================
 *
 * A Session represents one QRE runtime experience.
 *
 * Every scan may create a session.
 *
 * Sessions capture:
 *
 * - access decision
 * - generated moments
 * - cinematic scenes
 * - completion state
 * - memory references
 * - receipts
 *
 *
 * Sessions are NOT permanent memories.
 *
 * MemorySnapshot represents the
 * persistent memory artifact.
 *
 * AnalyticsEvent represents raw behavior:
 *
 * - scans
 * - views
 * - drop-offs
 * - conversions
 *
 * =====================================================
 */


export interface SessionRepository {


  create(

    input:{

      assetId:string;

      flowId?:string | null;

    }

  ):Promise<{

    id:string;

  }>;




  update(

    sessionId:string,

    data:Record<string,unknown>

  ):Promise<void>;


}





/**
 * =====================================================
 * ACCESS CONTRACT
 * =====================================================
 *
 * Provides runtime access truth.
 *
 * Engine does not query:
 *
 * - Prisma
 * - User table
 * - Asset table
 *
 *
 * Repository resolves:
 *
 * Asset
 *    +
 * Ownership
 *    +
 * Subscription context
 *
 * before engine execution.
 *
 * =====================================================
 */


export interface AccessRepository {


  findAssetAccessState(

    assetId:string

  ):Promise<{

    id:string;

    slug:string;

    paid:boolean;


    /**
     * Ownership identity.
     *
     * Repository resolves this.
     * Engine does not know ownership tables.
     */


    accountId:string | null;



    /**
     * Asset lifecycle state.
     */


    ownershipStatus:string | null;



    /**
     * Account subscription tier.
     *
     * Controls:
     *
     * - dashboard
     * - creation
     * - analytics
     * - editing
     *
     * NOT asset ownership.
     */


    ownerTier:string;


  } | null>;



}





/**
 * =====================================================
 * USER CONTRACT
 * =====================================================
 */


export interface UserRepository {


  findUserContext(

    userId:string

  ):Promise<{

    id:string;

    tier:string;


  } | null>;



}

/**
 * =====================================================
 * STORY DELIVERY CONTRACT
 * =====================================================
 */

export interface StoryDeliveryRepository {

  findAsset(
    assetId:string
  ):Promise<{

    id:string;

    accountId:string | null;

  } | null>;



  findExistingStory(
    input:{
      assetId:string;
      sessionId:string;
    }
  ):Promise<{

    id:string;

  } | null>;



  createStorySnapshot(
    input:{
      assetId:string;

      sessionId:string;

      moments:unknown;

      geoStory:unknown;

      cinematicScenes:unknown;

    }
  ):Promise<{

    id:string;

  }>;

}




/**
 * =====================================================
 * ANALYTICS CONTRACT
 * =====================================================
 *
 * Engine analytics abstraction.
 *
 * Engine does not know:
 * - Prisma
 * - analyticsEvent table
 * - database implementation
 *
 * Adapter handles persistence.
 *
 * =====================================================
 */
export interface AnalyticsRepository {


  trackEvent(
    input:{
      assetId:string;
      sessionId?:string|null;
      flowId?:string|null;
      stepIndex?:number|null;
      type:string;
      meta?:unknown;
    }
  ):Promise<void>;



  findEvents(
    input:{
      assetId:string;
      limit:number;
    }
  ):Promise<unknown[]>;



  countByType(
    assetId:string
  ):Promise<Record<string,number>>;



  getDashboardMetrics(
    assetId:string
  ):Promise<unknown>;


}

/**
 * =====================================================
 * GEO MEMORY CONTRACT
 * =====================================================
 *
 * Engine does not know Prisma.
 *
 * Adapter provides geo history.
 *
 * Adapter provides snapshot persistence.
 *
 * =====================================================
 */


export type GeoProofRecord = {

  assetId:string;

  sessionId:string | null;

  userId:string | null;

  lat:number;

  lng:number;

  accuracy:number | null;

  source:string;

  label:string | null;

  city:string | null;

  region:string | null;

  country:string | null;

  createdAt:Date;

};



export interface GeoMemoryRepository {


  findGeoProof(

    assetId:string

  ):Promise<GeoProofRecord[]>;



  createMemorySnapshot(

    input:{

      assetId:string;

      sessionId?:string|null;

      scanWeight:number;

      rewardScore:number;

      confidence:number;

      dominantLayer:string;

      data:unknown;

    }

  ):Promise<{

    id:string;

  }>;


}

/**
 * =====================================================
 * PRESENCE CONTRACT
 * =====================================================
 */

export interface PresenceRepository {


  upsertSession(
    input:{
      id:string;

      assetId:string;

      userId?:string|null;

      status:string;

      enteredAt?:Date;

      geoLat?:number|null;

      geoLng?:number|null;

      accuracy?:number|null;
    }
  ):Promise<unknown>;



  createGeoProof(
    input:{
      assetId:string;

      sessionId:string;

      userId?:string|null;

      lat:number;

      lng:number;

      accuracy?:number|null;

      source:string;

      label?:string|null;

      city?:string|null;

      region?:string|null;

      country?:string|null;
    }
  ):Promise<void>;



  checkOut(
    input:{
      sessionId:string;

      exitedAt?:Date;
    }
  ):Promise<unknown>;



  getPresenceMap(
    assetId:string
  ):Promise<unknown[]>;



  getPresenceReplay(
    assetId:string,

    sessionId?:string

  ):Promise<unknown[]>;



  getPresenceTimeline(
    assetId:string
  ):Promise<unknown[]>;


}