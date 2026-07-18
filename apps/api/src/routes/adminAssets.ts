import express from "express";
import { db } from "@qre/db";

const router = express.Router();



/**
 * =====================================================
 * ASSIGN ASSET TO ACCOUNT
 * =====================================================
 *
 * Admin inventory operation.
 *
 * User resolves to Account.
 * Asset belongs to Account.
 *
 * Ownership record mirrors assignment.
 *
 * =====================================================
 */

router.post(
  "/assets/:assetId/assign",
  async(
    req,
    res
  )=>{

    try {


      const {
        assetId,
      } = req.params;


      const {
        userId,
      } = req.body;



      if(
        !assetId ||
        !userId
      ){

        return res.status(400).json({

          error:
            "assetId and userId required",

        });

      }



      const result =
        await db.$transaction(
          async(tx)=>{


            /**
             * Resolve user's account.
             *
             * Users do not own assets.
             * Accounts own assets.
             */

            const membership =
              await tx.accountUser.findFirst({

                where:{
                  userId,
                },

              });



            if(!membership){

              throw new Error(
                "User has no account"
              );

            }



            const accountId =
              membership.accountId;



            /**
             * Attach asset to account
             */

            const asset =
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



            return asset;


          });



      return res.json({

        success:
          true,


        assetId:
          result.id,


        accountId:
          result.accountId,

      });


    }
    catch(error:any){

      console.error(
        "[ADMIN ASSIGN FAILED]",
        error
      );


      return res.status(500).json({

        error:
          error.message,

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
 * Neon
 * Prisma Asset
 *
 * Includes:
 *
 * - ownership
 * - template
 * - flows
 * - revenue
 * - scans
 * - unlocks
 *
 * =====================================================
 */

router.get(
  "/assets",
  async(
    _req,
    res
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
    catch(error:any){


      console.error(
        "[ADMIN ASSET LIST FAILED]",
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);




export default router;