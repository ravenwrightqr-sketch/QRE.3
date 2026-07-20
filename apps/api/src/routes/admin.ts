import express, { Response } from "express";
import { db } from "@qre/db";
import { Prisma } from "@prisma/client";

import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";

import {
  experienceCompiler,
} from "@qre/engine";


const router = express.Router();


router.use(requireAuth);


/**
 * =====================================================
 * CREATE ASSET + EXPERIENCE
 * =====================================================
 *
 * Prompt
 *        ↓
 * Experience Compiler
 *        ↓
 * Flow
 *        ↓
 * FlowSteps
 *        ↓
 * AssetFlow Link
 *        ↓
 * Ready To Scan
 *
 * Ownership is NOT created here.
 *
 * Asset starts unclaimed.
 * Claim flow creates Ownership later.
 *
 * =====================================================
 */


router.post(
  "/assets/create-experience",
  async (
    req: AuthRequest,
    res: Response
  ) => {

    try {

      const userId =
        req.user?.userId;


      if(!userId){

        return res.status(401).json({
          error:"Unauthorized",
        });

      }


      const {
        displayName,
        slug,
        prompt,
        priceCents,
      } = req.body;



      if(!slug || !prompt){

        return res.status(400).json({
          error:
            "slug and prompt required",
        });

      }



      /**
       * CREATE ASSET
       *
       * No ownerId.
       *
       * Ownership is handled through:
       *
       * Asset
       *   |
       * Ownership
       *   |
       * Account
       *
       */


      const asset =
        await db.asset.create({

          data:{

            displayName,

            slug,

            status:
              "active",

            paid:
              false,

            saleChannel:
              "ADMIN",

            priceCents:
              priceCents ?? 999,

          },

        });



      /**
       * COMPILE EXPERIENCE
       */


      const compiled =
        await experienceCompiler(
          prompt
        );



      /**
       * CREATE FLOW
       */


      const flow =
        await db.flow.create({

          data:{

            name:
              compiled.title,


            version:
              1,


            actions:{

              category:
             compiled.blueprint.metadata?.archetypes?.[0]
             ?? compiled.blueprint.metadata?.themes?.[0]
             ?? "experience",


              estimatedDuration:
                compiled.estimatedDuration,

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
       * LINK EXPERIENCE
       */


      await db.assetFlow.create({

        data:{

          assetId:
            asset.id,


          flowId:
            flow.id,


          active:
            true,


          priority:
            0,

        },

      });



      return res.json({

        success:
          true,


        assetId:
          asset.id,


        flowId:
          flow.id,


        slug:
          asset.slug,


        scanUrl:
          `/api/scan/${asset.slug}`,

      });


    } catch(e:any){

      console.error(
        "CREATE EXPERIENCE ERROR",
        e
      );


      return res.status(500).json({

        error:
          e.message,

      });

    }

  }
);


export default router;