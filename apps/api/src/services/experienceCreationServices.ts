/**
 * =====================================================
 * EXPERIENCE CREATION SERVICE
 * =====================================================
 *
 * Production creation boundary.
 *
 * Prompt
 *   ↓
 * Experience Compiler
 *   ↓
 * Experience Blueprint
 *   ↓
 * Blueprint → Flow Compiler
 *   ↓
 * Runtime Flow
 *
 *
 * Responsibilities:
 *
 * ✅ Compile experience
 * ✅ Persist experience
 * ✅ Generate runtime flow
 * ✅ Link asset ownership
 *
 *
 * NO FRONTEND LOGIC
 * NO PLAYER EXECUTION
 *
 * =====================================================
 */


import {
  Prisma,
} from "@prisma/client";


import {
  db,
} from "@qre/db";


import {
  blueprintToFlow,
} from "@qre/engine";


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






  return db.$transaction(async(tx)=>{





    /**
     * ===================================================
     *
     * 1. COMPILE BLUEPRINT
     *
     * API → ENGINE
     *
     * IMPORTANT:
     *
     * compileExperience returns
     * ExperienceBlueprint directly.
     *
     * ===================================================
     */


    const compiled =

  await compileExperience(

    input.prompt.trim()

  );


const blueprint =

  compiled.blueprint;


const narrative =

  compiled.narrative;









    /**
     * ===================================================
     *
     * 2. BLUEPRINT → RUNTIME FLOW
     *
     * ===================================================
     */


    const flowSteps =

      blueprintToFlow(

        blueprint

      );







    console.log(

      "🔥 BLUEPRINT GENERATED FLOW STEPS",

      JSON.stringify(

        flowSteps,

        null,

        2

      )

    );









    /**
     * ===================================================
     *
     * 3. CREATE EXPERIENCE
     *
     * Human creative object
     *
     * ===================================================
     */


    const experience =

      await tx.experience.create({

        data:{


          assetId:

            input.assetId,



          title:

            input.title ??

            blueprint.title,



          blueprint:

            blueprint as unknown as Prisma.InputJsonValue,


        },

      });









    /**
     * ===================================================
     *
     * 4. CREATE FLOW
     *
     * Runtime representation
     *
     * ===================================================
     */


    const flow =

      await tx.flow.create({

        data:{


          name:

            experience.title ??

            "Experience",



          version:1,



          actions:

          {

            category:

              blueprint.type ?? "experience",


          } as Prisma.InputJsonValue,





          steps:{


            create:

              flowSteps.map(

                step=>({


                  order:

                    step.order,


                  type:

                    step.type,


                  payload:

                    step.payload as Prisma.InputJsonValue,


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
     * 5. LINK EXPERIENCE → FLOW
     *
     * ===================================================
     */


    await tx.experience.update({

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
     * 6. LINK ASSET → FLOW
     *
     * ===================================================
     */


    await tx.assetFlow.upsert({

      where:{


        assetId_flowId:{


          assetId:

            input.assetId,


          flowId:

            flow.id,


        },


      },



      update:{},



      create:{


        assetId:

          input.assetId,


        flowId:

          flow.id,


      },


    });









    return {


      experience,


      flow,


      blueprint,


    };



  });


}