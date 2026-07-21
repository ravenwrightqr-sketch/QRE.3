import express, {
  Response,
} from "express";

import {
  Prisma,
} from "@prisma/client";

import {
  db,
} from "@qre/db";

import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";

import {
  experienceCompiler,
} from "@qre/engine";


const router =
  express.Router();


router.use(requireAuth);


/**
 * =====================================================
 * CREATE ASSET + EXPERIENCE
 * =====================================================
 *
 * User
 *   |
 *   | AccountUser
 *   |
 * Account
 *   |
 *   | accountId
 *   |
 * Asset
 *   |
 *   | Experience Compiler
 *   |
 * Flow
 *   |
 * FlowSteps
 *   |
 * AssetFlow
 *   |
 * Ready To Scan
 *
 *
 * ARCHITECTURE RULES:
 *
 * Account:
 * - identity boundary
 * - billing container
 * - dashboard ownership
 *
 * Asset:
 * - QR/NFC identity
 * - belongs to Account
 *
 * Ownership:
 * - claim/payment lifecycle
 * - created later
 *
 * Asset.accountId is the source of truth.
 *
 * =====================================================
 */


router.post(
  "/assets/create-experience",
  async (
    req: AuthRequest,
    res: Response,
  ) => {

    try {


      const userId =
        req.user?.userId;


      if(!userId){

        return res.status(401).json({
          error:
            "Unauthorized",
        });

      }



      const {
        displayName,
        slug,
        prompt,
        priceCents,
      } =
        req.body;



      if(!slug || !prompt){

        return res.status(400).json({

          error:
            "slug and prompt required",

        });

      }



      /**
       * =================================================
       * RESOLVE ACCOUNT
       * =================================================
       *
       * Assets belong to Accounts.
       *
       * Never attach assets directly
       * to users.
       *
       * User membership determines
       * account context.
       *
       * =================================================
       */


      const membership =
        await db.accountUser.findFirst({

          where:{

            userId,

            role:{
              in:[
                "OWNER",
                "ADMIN",
              ],
            },

          },

          select:{

            accountId:true,

          },

        });



      if(!membership){

        return res.status(403).json({

          error:
            "No account available",

        });

      }



      const accountId =
        membership.accountId;




      /**
       * =================================================
       * CREATE ASSET
       * =================================================
       *
       * Asset is created attached
       * to Account immediately.
       *
       * Ownership records are NOT
       * created here.
       *
       * Claim/payment creates
       * Ownership later.
       *
       * =================================================
       */


      const asset =
        await db.asset.create({

          data:{

            accountId,


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
       * =================================================
       * COMPILE EXPERIENCE
       * =================================================
       *
       * Prompt
       *   ↓
       * Experience Compiler
       *   ↓
       * Blueprint + Flow Steps
       *
       * =================================================
       */


      const compiled =
        await experienceCompiler(
          prompt,
        );




      /**
       * =================================================
       * CREATE FLOW
       * =================================================
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

                compiled.blueprint.metadata
                  ?.archetypes?.[0]

                ??

                compiled.blueprint.metadata
                  ?.themes?.[0]

                ??

                "experience",


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
       * =================================================
       * LINK ASSET TO FLOW
       * =================================================
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




      /**
       * =================================================
       * RESPONSE
       * =================================================
       */


      return res.json({

        success:
          true,


        accountId,


        assetId:
          asset.id,


        flowId:
          flow.id,


        slug:
          asset.slug,


        scanUrl:
          `/api/scan/${asset.slug}`,


      });



    } catch(error:any){


      console.error(
        "CREATE EXPERIENCE ERROR",
        error,
      );


      return res.status(500).json({

        error:
          error.message,

      });


    }

  },
);



export default router;