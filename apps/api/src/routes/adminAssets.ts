import express, {
  Response,
} from "express";

import { db } from "@qre/db";
import {
  requireAuth,
  AuthRequest,
} from "../middleware/requireAuth.js";


const router = express.Router();



function resolveParam(
  value: string | string[] | undefined
): string | undefined {

  if(typeof value === "string"){
    return value;
  }

  if(Array.isArray(value)){
    return value[0];
  }

  return undefined;
}




/**
 * =====================================================
 * ASSIGN ASSET TO ACCOUNT
 * =====================================================
 *
 * Ownership model:
 *
 * User
 *   |
 * AccountUser
 *   |
 * Account
 *   |
 * Asset
 *   |
 * Ownership
 *
 *
 * Production rules:
 *
 * - Users never own assets
 * - Accounts own assets
 * - Ownership mirrors account control
 * - Transaction is atomic
 *
 * =====================================================
 */


router.post(
  "/assets/:assetId/assign",
  requireAuth,
  async(
    req: AuthRequest,
    res: Response
  )=>{

    try {


      const assetId =
        resolveParam(
          req.params.assetId
        );


      const userId =
        req.user?.userId;



      if(!assetId || !userId){

        return res.status(400).json({

          error:
            "assetId required",

        });

      }




      const result =
        await db.$transaction(
          async(tx)=>{


            /**
             * Resolve user's account
             */
            const membership =
              await tx.accountUser.findFirst({

                where:{
                  userId,
                },

                select:{
                  accountId:true,
                },

              });



            if(!membership){

              throw new Error(
                "ACCOUNT_NOT_FOUND"
              );

            }



            const accountId =
              membership.accountId;




            /**
             * Load asset
             */
            const asset =
              await tx.asset.findUnique({

                where:{
                  id:assetId,
                },

                select:{

                  id:true,

                  accountId:true,

                },

              });



            if(!asset){

              throw new Error(
                "ASSET_NOT_FOUND"
              );

            }




            /**
             * Prevent ownership theft
             */
            if(
              asset.accountId &&
              asset.accountId !== accountId
            ){

              throw new Error(
                "ASSET_ALREADY_ASSIGNED"
              );

            }





            /**
             * Attach asset
             */
            const updated =
              await tx.asset.update({

                where:{
                  id:assetId,
                },


                data:{

                  accountId,


                  claimedAt:
                    new Date(),

                },

              });





            /**
             * Ownership mirror
             */
            await tx.ownership.upsert({

              where:{
                assetId,
              },


              update:{

                accountId,


                status:
                  "CLAIMED",


                claimedAt:
                  new Date(),

              },


              create:{

                assetId,


                accountId,


                status:
                  "CLAIMED",

              },

            });




            return updated;

          });



      return res.json({

        success:true,

        assetId:
          result.id,

        accountId:
          result.accountId,

      });



    }
    catch(error){

      const message =
        error instanceof Error
          ? error.message
          : "UNKNOWN_ERROR";



      console.error(
        "[ADMIN ASSIGN FAILED]",
        message
      );



      if(message === "ASSET_NOT_FOUND"){

        return res.status(404).json({

          error:
            "Asset not found",

        });

      }



      if(message === "ASSET_ALREADY_ASSIGNED"){

        return res.status(409).json({

          error:
            "Asset already assigned",

        });

      }



      return res.status(500).json({

        error:
          "Assignment failed",

      });

    }

  }

);








/**
 * =====================================================
 * LIST ASSETS
 * =====================================================
 *
 * Admin inventory dashboard.
 *
 * Source of truth:
 *
 * Prisma Asset
 *
 * =====================================================
 */


router.get(
  "/assets",
  requireAuth,
  async(
    _req: AuthRequest,
    res: Response
  )=>{

    try {


      const assets =
        await db.asset.findMany({

          orderBy:{

            createdAt:
              "desc",

          },


          select:{


            id:true,


            slug:true,


            token:true,


            displayName:true,


            accountId:true,


            merchantId:true,


            category:true,


            status:true,


            paid:true,


            activationMethod:true,


            priceCents:true,


            premiumPriceCents:true,


            totalRevenueCents:true,


            totalScans:true,


            totalUnlocks:true,


            claimedAt:true,


            createdAt:true,



            template:{

              select:{

                id:true,

                name:true,

                slug:true,

                category:true,

              },

            },



            flows:{

              select:{

                id:true,

                flowId:true,

                createdAt:true,

              },

            },



            ownership:{

              select:{

                id:true,

                status:true,

                accountId:true,

                claimedAt:true,

              },

            },


          },

        });




      return res.json({

        count:
          assets.length,


        assets,


        timestamp:
          new Date().toISOString(),

      });



    }
    catch(error){

      console.error(
        "[ADMIN ASSET LIST FAILED]",
        error
      );


      return res.status(500).json({

        error:
          "Unable to load assets",

      });

    }

  }

);



export default router;