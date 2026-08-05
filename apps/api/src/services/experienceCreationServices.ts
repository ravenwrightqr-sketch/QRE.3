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


import {
  Prisma,
} from "@prisma/client";


import {
  db,
} from "@qre/db";


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

      await tx.experience.create({

        data:{


          assetId:
            input.assetId,


          title:

            input.title ??
            compiled.title,



          blueprint:

            compiled.blueprint as Prisma.InputJsonValue,

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

      await tx.flow.create({

        data:{


          name:

            experience.title ??
            "Experience",



          version:

            1,



          actions:

            {

              category:

                compiled.blueprint.type ??
                "experience",

            } as Prisma.InputJsonValue,



          steps:{


            create:

              compiled.flowSteps.map(

                step => ({


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
     * 4. LINK EXPERIENCE → FLOW
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
     * 5. LINK ASSET → FLOW
     *
     * Runtime ownership bridge.
     *
     * AssetFlow is canonical.
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


      compiled,


    };


  });


}