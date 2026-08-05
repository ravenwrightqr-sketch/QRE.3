/**
 * =====================================================
 * QRE EXPERIENCE OBSERVATION LISTENER
 * =====================================================
 *
 * Spine = signal transport
 *
 * Converts runtime signals into observations.
 *
 * Does NOT think.
 * Does NOT compile.
 * Does NOT execute.
 *
 * =====================================================
 */

import {
  subscribeSpine,
} from "./eventSpine.js";


import type {
  SpineEvent,
} from "./eventSpine.js";


export function startExperienceObserver(){


  return subscribeSpine(

    async (event:SpineEvent)=>{


      const observation = {


        type:"experience_event",


        event:event.type,


        assetId:event.assetId,


        sessionId:event.sessionId,


        flowId:event.flowId,


        metadata:event.meta,


      };


      console.log(
        "Experience observation:",
        observation
      );


    }

  );


}