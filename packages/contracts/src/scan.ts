/**
 * =====================================================
 * QRE SCAN CONTRACT
 *
 * Runtime migration layer.
 *
 * The canonical runtime contract is:
 *
 * RuntimeExperience
 *
 * Scan no longer owns:
 *
 * - preview
 * - teaser rendering
 * - checkout decisions
 * - cinematic state
 *
 * Those belong to runtime/player layers.
 *
 * =====================================================
 */


export type AccessState =
  | "DEMO"
  | "UNLOCKED";



/**
 * =====================================================
 * LEGACY TEASER COMPATIBILITY
 *
 * Temporary bridge for old consumers.
 *
 * =====================================================
 */

export type TeaserBlock = {

  type:
    | "text"
    | "action";

  text:string;

  url?:string;

};



/**
 * =====================================================
 * LEGACY SCAN RUNTIME RESPONSE
 *
 * Deprecated.
 *
 * Use RuntimeExperience.
 *
 * =====================================================
 */

export type ScanRuntimeResponse = {

  /**
   * Compatibility access field.
   *
   * Replace with:
   *
   * RuntimeExperience.accessState
   */
  access:AccessState;



  /**
   * Compatibility identity.
   */
  sessionId:string;



  /**
   * Compatibility asset.
   */
  asset:{

    id:string;

    slug:string;

    status:string;

    priceCents:number;

    flowId:string | null;

    accountId:string | null;

    paid:boolean;

  };



  /**
   * Deprecated.
   *
   * RuntimeExperience.moments
   * replaces this.
   */
  teaser:TeaserBlock[];



  /**
   * Deprecated state machine.
   */
  state:
    | "initial"
    | "scanning"
    | "completed";



  /**
   * Deprecated.
   *
   * DEMO is represented by:
   *
   * accessState:"DEMO"
   */
  preview:boolean;



  /**
   * Deprecated.
   *
   * Player decides this.
   */
  nextAction?:
    | "CHECKOUT"
    | "RUN_FLOW";



  actionUrl?:string | null;



  timestamp:string;

};