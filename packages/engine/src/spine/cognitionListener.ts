/**
 * =====================================================
 * QRE COGNITION SPINE LISTENER
 * =====================================================
 *
 * Connects runtime signals to cognition.
 *
 * Spine = signal transport
 * Cognition = interpretation
 *
 * =====================================================
 */


import {
  subscribeSpine,
} from "./eventSpine.js";


import {
  processCognition,
} from "../cognition/cognitionKernel.js";


import type {
  SpineEvent,
} from "./eventSpine.js";





export function startCognitionListener(){


  return subscribeSpine(

    async (event:SpineEvent)=>{


      processCognition({


        type:
          "experience",



        summary:
          `Engine event ${event.type}`,



        confidence:
          0.7,



        context:{

          event:
            event.type,


          assetId:
            event.assetId,


          sessionId:
            event.sessionId,


          flowId:
            event.flowId,


          stepIndex:
            event.stepIndex,


          userId:
            event.userId,


          meta:
            event.meta,


        },


      });


    }

  );


}