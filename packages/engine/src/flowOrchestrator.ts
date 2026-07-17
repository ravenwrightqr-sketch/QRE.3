import { trackEvent } from "./analytics/trackEvent.js";

import {
  checkIn,
} from "./presence/checkIn.js";

import type {
  Moment,
} from "@qre/contracts";


/**
 * =====================================================
 * QRE FLOW ACTION RUNTIME
 * =====================================================
 *
 * Runtime execution layer.
 *
 * Flow
 *    ↓
 * Moments
 *    ↓
 * Runtime actions
 *    ↓
 * Analytics
 *    ↓
 * Geo Memory / Presence
 *
 *
 * Responsibilities:
 *
 * - Track flow progression
 * - Trigger runtime side effects
 * - Connect location moments to geo memory
 *
 *
 * NO PRISMA
 * NO DIRECT DATABASE ACCESS
 *
 * =====================================================
 */


export type FlowRuntimeGeo = {

  lat:
    number;

  lng:
    number;

  accuracy?:
    number;

};



export async function runFlowActions(

  moments:
    Moment[],

  sessionId:
    string,

  assetId:
    string,

  geo?:
    FlowRuntimeGeo,

  userId?:
    string

) {


  const sorted =
    [...moments]
      .sort(
        (a,b) =>
          a.order - b.order
      );



  for (
    let i = 0;
    i < sorted.length;
    i++
  ) {


    const moment =
      sorted[i];



    /**
     * FLOW ANALYTICS
     */
    await trackEvent({

      assetId,

      sessionId,

      stepIndex:
        i,

      type:
        "FLOW_STEP",

      meta: {

        momentType:
          moment.type,

      },

    });



    /**
     * =========================
     * RUNTIME SIDE EFFECTS
     * =========================
     */
    switch (
      moment.type
    ) {


      /**
       * Normal content
       */
      case "message":

        break;



      /**
       * Payment / redirect
       *
       * Frontend handles UI.
       */
      case "action":

        break;



      /**
       * GEO MEMORY CONNECTION
       *
       * Location moments created
       * by FlowBuilder carry:
       *
       * meta.geoMemory=true
       *
       * They trigger:
       *
       * checkIn()
       * geoProof
       * presence timeline
       * geo analytics
       */
      case "location": {

        const meta =
          moment.meta ?? {};



        if (

          meta.geoMemory === true &&

          geo

        ) {


          await checkIn({

            assetId,

            sessionId,

            userId,

            geo,

          });


        }


        break;

      }



      /**
       * Media events
       */
      case "media":

        break;



      /**
       * System events
       */
      case "system":

        break;


    }



    /**
     * TIMER SUPPORT
     */
    const duration =

      typeof moment.meta?.duration === "number"

        ? moment.meta.duration

        : 0;



    if (
      duration > 0
    ) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            duration
          )
      );

    }


  }



  /**
   * FLOW COMPLETE
   */
  await trackEvent({

    assetId,

    sessionId,

    type:
      "FLOW_COMPLETE",

    meta: {

      steps:
        sorted.length,

    },

  });


}