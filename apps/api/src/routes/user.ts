import express, { Response } from "express";
import { db } from "@qre/db";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";


const router = express.Router();


/**
 * =========================
 * GET USER ASSETS
 *
 * SOURCE OF TRUTH:
 *
 * Asset.accountId
 * Ownership.accountId
 * AccountUser membership
 *
 * Returns:
 * - account owned QR/NFC assets
 * - ownership state
 * - experience bindings
 *
 * User access is resolved
 * through account membership.
 * =========================
 */


router.get(
  "/assets",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
  )=>{


    try{


      const userId =
        req.user?.userId;



      if(!userId){

        return res.status(401).json({

          error:
            "Unauthorized",

        });

      }



      /**
       * Find accounts this user belongs to
       */

      const memberships =
        await db.accountUser.findMany({

          where:{
            userId,
          },

          select:{
            accountId:true,
          },

        });



      const accountIds =
        memberships.map(
          membership =>
            membership.accountId
        );



      if(accountIds.length === 0){

        return res.json({

          assets:[],

          count:0,

        });

      }



      /**
       * Load account assets
       */

      const assets =
        await db.asset.findMany({

          where:{

            accountId:{
              in:accountIds,
            },

          },


          orderBy:{

            createdAt:
              "desc",

          },


          select:{


            id:true,


            slug:true,


            priceCents:true,


            status:true,


            paid:true,


            accountId:true,


            createdAt:true,



            ownership:{

              select:{

                status:true,

                claimedAt:true,

              },

            },



            account:{

              select:{

                plan:true,

              },

            },



            flows:{


              where:{

                active:true,

              },


              select:{


                id:true,


                flowId:true,


              },


              orderBy:{

                priority:
                  "desc",

              },

            },


          },

        });



      const response =
        assets.map(

          asset => ({


            id:
              asset.id,


            slug:
              asset.slug,


            priceCents:
              asset.priceCents,


            status:
              asset.status,


            paid:
              asset.paid,


            accountId:
              asset.accountId,


            ownershipStatus:
              asset.ownership?.status ?? "UNCLAIMED",


            tier:
              asset.account?.plan ?? "CONSUMER",


            createdAt:
              asset.createdAt,



            hasExperience:
              asset.flows.length > 0,


            flowId:
              asset.flows[0]?.flowId ?? null,


          })

        );



      return res.json({

        assets:response,

        count:
          response.length,

      });



    }
    catch(error:any){


      console.error(
        "GET USER ASSETS FAILED:",
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