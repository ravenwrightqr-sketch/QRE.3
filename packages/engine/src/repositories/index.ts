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
   * Engine never knows Account/Ownership tables.
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
 * - Prisma
 * - User table
 * - Asset table
 *
 * Repository resolves:
 *
 * Asset
 *   +
 * Owner subscription
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
     * Ownership truth.
     *
     * Asset belongs to an Account.
     *
     * Engine does not know:
     * - Ownership table
     * - Account table
     * - Prisma relations
     *
     * Repository resolves it.
     */
    accountId:string | null;


    /**
     * Current ownership lifecycle state.
     */
    ownershipStatus:string | null;


    /**
     * Account subscription plan.
     *
     * Example:
     * CONSUMER
     * PRO
     * BUSINESS
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