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
   * Runtime ownership identity.
   *
   * Database adapters translate:
   *
   * Asset.accountId
   *        ↓
   * ownerId
   *
   * Engine never knows:
   *
   * - Account tables
   * - Ownership tables
   * - Prisma relations
   */


  ownerId:string | null;


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
 *
 * StoryDeliveryEngine uses this contract.
 *
 * It does NOT know:
 *
 * - Prisma
 * - database models
 * - storage implementation
 *
 * Adapters handle persistence.
 *
 * =====================================================
 */


export interface StoryDeliveryRepository {


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