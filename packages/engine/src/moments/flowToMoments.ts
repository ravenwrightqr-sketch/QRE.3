import type {
  FlowStep,
  Moment,
} from "@qre/contracts";


/**
 * =====================================================
 * FLOW → MOMENTS
 *
 * Runtime translation layer
 *
 * FlowStep
 *    ↓
 * Moment
 *
 * SINGLE SOURCE OF TRUTH FOR SCAN DELIVERY
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */


export function flowToMoment(
  steps: FlowStep[]
): Moment[] {


  const moments: Moment[] = [];



  for (const step of steps) {


    const payload =
      (
        step.payload ?? {}
      ) as Record<string, any>;



    switch(step.type) {



      /**
       * ==========================
       * MESSAGE BASED MOMENTS
       *
       * Story
       * Product
       * Education
       * Gallery
       * Reward
       * Social
       * Replay
       *
       * ==========================
       */


      case "message": {


        let semanticType =
          payload.action ??
          payload.momentType ??
          payload.component ??
          "message";



        /**
         * Normalize runtime names
         */

        switch (semanticType) {


          case "commerce":

            semanticType = "product";

            break;


          case "gallery":

            semanticType = "photos";

            break;


          case "memory":

            semanticType = "story";

            break;


          case "cinematic_replay":

            semanticType = "cinematic_replay";

            break;


          case "education":

            semanticType = "education";

            break;


          case "reward":

            semanticType = "reward";

            break;


          case "social":

            semanticType = "social";

            break;


          case "profile":

            semanticType = "profile";

            break;


          default:

            break;

        }



        moments.push({

          type:
            semanticType as any,

          order:
            step.order,


          text:
            String(
              payload.text ??
              payload.title ??
              payload.description ??
              "Experience moment"
            ),


          meta:
            payload,

        });



        break;

      }




      /**
       * ==========================
       * GEO MEMORY
       *
       * location
       * arrival
       *
       * ==========================
       */


      case "location": {


      moments.push({

  type:"location",

  order:step.order,


  location:{

    lat:Number(payload.lat ?? 0),

    lng:Number(payload.lng ?? 0),

    label:
      payload.label ??
      payload.title ??
      "Location",

    city:
      payload.city,

    region:
      payload.region,

    country:
      payload.country,

  },


  meta:{

    geoMemory:
      payload.geoMemory === true,


    captureSnapshot:
      payload.captureSnapshot === true ||
      payload.snapshot === true,


    timeline:
      payload.timeline === true,

  },

});



        break;

      }





      /**
       * ==========================
       * REDIRECT / PAYMENT
       *
       * Commerce actions
       *
       * ==========================
       */


      case "redirect":
      case "payment": {

       moments.push({

  type:"action",

  order:
    step.order,

  action:
    step.type,

  text:
    String(
      payload.text ??
      payload.label ??
      (
        step.type === "payment"
        ? "Unlock Experience"
        : "Continue"
      )
    ),

  meta:{
    ...payload,

    url:
      payload.url,

    label:
      payload.label,
  },

});



        break;

      }





      /**
       * ==========================
       * TIMER / SYSTEM
       *
       * ==========================
       */


      case "timer": {


        moments.push({

          type:"system",

          order:
            step.order,


          text:
            "Pause",


          meta:{


            event:
              "DELAY",


            duration:
              Number(
                payload.duration ?? 0
              ),


          },


        });



        break;

      }





      /**
       * ==========================
       * FALLBACK
       *
       * Unknown future components
       *
       * ==========================
       */


      default: {


        moments.push({

          type:"message",

          order:
            step.order,


          text:
            String(
              payload.text ??
              payload.title ??
              payload.component ??
              "Experience moment"
            ),


          meta:
            payload,

        });



        break;

      }



    }



  }



  return moments;


}