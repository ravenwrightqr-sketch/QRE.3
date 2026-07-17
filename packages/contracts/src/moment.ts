/**
 * =====================================================
 * QRE RUNTIME MOMENT CONTRACT
 * =====================================================
 *
 * The atomic experience unit.
 *
 * Flow
 *    ↓
 * Moment
 *    ↓
 * CinematicScene
 *    ↓
 * Player
 *
 * NO DATABASE
 * NO STORAGE
 *
 * =====================================================
 */

import type {
  MediaAsset,
} from "./media.js";

import type {
  GeoLocation,
} from "./geoStory.js";



export type MomentMeta =
  Record<string, unknown> & {

    duration?:number;

  };



export type Moment =


/**
 * SYSTEM
 */
| {

    type:"system";

    order:number;

    text:string;

    meta?:MomentMeta;

  }



/**
 * MESSAGE / STORY
 */
| {

    type:"message";

    order:number;

    text:string;


    meta?:MomentMeta & {

      author?:string;

    };

  }



/**
 * ACTION / COMMERCE
 */
| {

    type:"action";

    order:number;


    action:
      | "payment"
      | "redirect"
      | "unlock"
      | "flow"
      | "cta";


    text?:string;


    url?:string;


    label?:string;


    meta?:MomentMeta & {

      suggestedAmount?:number;

    };

  }



/**
 * GEO MEMORY
 */
| {

    type:"location";

    order:number;


    location:GeoLocation;


    meta?:MomentMeta & {

      intensity?:number;

      timestamp?:string;

    };

}



/**
 * MEDIA EXPERIENCE
 */
| {

    type:"media";

    order:number;


    media:MediaAsset[];


    meta?:MomentMeta & {

      text?:string;

    };

};