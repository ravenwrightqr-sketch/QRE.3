/**
 * =====================================================
 * QRE MEDIA CONTRACT
 * =====================================================
 *
 * Shared media representation.
 *
 * Used by:
 * 
 * - geo stories
 * - galleries
 * - memory snapshots
 * - uploads
 * - player runtime
 *
 * NO DATABASE
 * NO STORAGE PROVIDER
 *
 * =====================================================
 */

export type MediaType =
  | "image"
  | "video"
  | "audio";


export type MediaAsset = {

  id:string;
  type:MediaType;
  /**
   * Final playable URL
   */
  url:string;
  /**
   * Preview image
   * for video/audio cards
   */
  thumbnail?:string;

  /**
   * Optional metadata
   */
  title?:string;

  caption?:string;
  /**
   * Playback
   */
  duration?:number;
  /**
   * Future:
   * S3
   * Cloudflare
   * IPFS
   */
  provider?:string;
  metadata?:Record<string,unknown>;
};