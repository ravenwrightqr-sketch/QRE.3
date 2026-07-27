/**
 * =====================================================
 * EXPERIENCE CREATION SERVICE
 * =====================================================
 *
 * Production creation boundary.
 *
 * Prompt
 *   ↓
 * Experience Compiler (ENGINE)
 *   ↓
 * Experience Record
 *   ↓
 * Flow Runtime
 *
 * Responsibilities:
 *
 * - Compile experience
 * - Create Experience
 * - Create Flow
 * - Link runtime to experience
 *
 * NO FRONTEND LOGIC
 * NO EXECUTION
 * NO ENGINE OWNERSHIP
 *
 * =====================================================
 */


import { db } from "@qre/db";


import {
  compileExperience,
} from "./experienceService.js";

export type CreateExperienceInput = {


  assetId:string;


  prompt:string;


  title?:string;


};


export async function createExperience(

  input:CreateExperienceInput

){


  if(
    !input.assetId ||
    !input.prompt.trim()
  ){

    throw new Error(
      "Asset and prompt required."
    );

  }

  /**
   * ===================================================
   *
   * 1. COMPILE
   *
   * API → ENGINE
   *
   * ===================================================
   */

  const compiled =

    await compileExperience(
      input.prompt.trim()
    );
   console.log(
  "🔥 COMPILER OUTPUT FLOW STEPS",
  JSON.stringify(
    compiled.flowSteps,
    null,
    2
  )
);
   
  /**
   * ===================================================
   *
   * 2. CREATE EXPERIENCE
   *
   * Human creative object
   *
   * ===================================================
   */


  const experience =

    await db.experience.create({

      data:{

        assetId:
          input.assetId,


        title:
          input.title ??
          compiled.title,


        blueprint:
          compiled.blueprint,


      },

    });


  /**
   * ===================================================
   *
   * 3. CREATE FLOW
   *
   * Runtime representation
   *
   * ===================================================
   */


  const flow =

    await db.flow.create({

      data:{


        name:

          experience.title ??

          "Experience",



        version:

          1,



        actions:{


          category:

            compiled.blueprint.type ??
            "experience",


        },



        steps:{


          create:

            compiled.flowSteps.map(
              
              step => ({

                order:
                  step.order,


                type:
                  step.type,


                payload:
                  step.payload,


              })

            ),


        },


      },


      include:{


        steps:true,


      },


    });


  /**
   * ===================================================
   *
   * 4. LINK EXPERIENCE → FLOW
   *
   * ===================================================
   */


  await db.experience.update({

    where:{

      id:
        experience.id,

    },


    data:{


      flow:{

        connect:{

          id:
            flow.id,

        },

      },


    },


  });
   /**
 * ===================================================
 *
 * 5. LINK ASSET → FLOW
 *
 * Runtime ownership bridge.
 *
 * AssetFlow is the canonical relationship.
 *
 * ===================================================
 */

  await db.assetFlow.create({

  data:{

    assetId:
      input.assetId,

    flowId:
      flow.id,

  },

  });



  return {


    experience,


    flow,


    compiled,


  };


}