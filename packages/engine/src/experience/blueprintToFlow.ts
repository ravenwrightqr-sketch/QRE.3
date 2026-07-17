import type {
  ExperienceBlueprint,
  FlowStep,
} from "@qre/contracts";

import {
  mapMomentToFlowType,
} from "./momentMapper.js";



/**
 * =====================================================
 *
 * BLUEPRINT → FLOW COMPILER
 *
 * Converts creative experience language
 * into runtime execution language.
 *
 *
 * INPUT:
 *
 * ExperienceBlueprint
 *
 *
 * OUTPUT:
 *
 * FlowStep[]
 *
 *
 * RULES:
 *
 * - Pure function
 * - No database
 * - No Prisma
 * - No execution
 * - Preserve creative DNA
 *
 * =====================================================
 */



export function blueprintToFlow(

  blueprint: ExperienceBlueprint

): FlowStep[] {



  if(
    !blueprint ||
    !Array.isArray(
      blueprint.moments
    )
  ){

    return [];

  }



  return blueprint.moments.map(

    (
      moment,
      index
    ) => ({


      /**
       * Runtime identity
       */

      id:
        `experience-${index}`,



      /**
       * Execution order
       */

      order:
        index,



      /**
       * Runtime action type
       */

      type:
        mapMomentToFlowType(
          moment
        ),



      /**
       * Preserve experience DNA
       *
       * This becomes the source
       * for Cinematic Runtime.
       */

      payload:{


        experience:{

          component:
            moment.component,


          momentType:
            moment.type,


          title:
            moment.title,


          subtitle:
            moment.subtitle,


          description:
            moment.description,


          icon:
            moment.icon,


          animation:
            moment.animation,


          editable:
            moment.editable,


          demo:
            moment.demo,


          order:
            moment.order,


        },



        /**
         * Custom generated data
         */

        ...moment.payload,


      },


    })

  );


}