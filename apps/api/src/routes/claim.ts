import express from "express";
import { db } from "@qre/db";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";


const router = express.Router();


/**
 * =====================================================
 * CLAIM ASSET TO ACCOUNT
 * =====================================================
 *
 * Inventory assignment boundary.
 *
 *
 * DOES:
 *
 * ✅ Resolve user's account membership
 * ✅ Attach unassigned Asset to Account
 *
 *
 * DOES NOT:
 *
 * ❌ Unlock payment
 * ❌ Mark paid
 * ❌ Create Ownership
 * ❌ Handle Stripe
 *
 *
 * PAYMENT TRUTH:
 *
 * Stripe
 *    |
 *    v
 * unlockAsset()
 *    |
 *    v
 * Ownership
 *
 *
 * Asset control:
 *
 * AccountUser
 *    |
 *    v
 * Account
 *    |
 *    v
 * Asset.accountId
 *
 * =====================================================
 */


router.post(
  "/:slug",
  requireAuth,
  async(
    req: AuthRequest,
    res
  )=>{

    try{


      const slug =
        Array.isArray(req.params.slug)
          ? req.params.slug[0]
          : req.params.slug;



      const userId =
        req.user?.userId;



      if(
        !slug ||
        !userId
      ){

        return res.status(400).json({

          error:
            "slug and authentication required",

        });

      }



      /**
       * Resolve account access
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
            "No account permission",

        });

      }



      const accountId =
        membership.accountId;



      /**
       * Assign asset to account
       *
       * No ownership creation.
       */

      const asset =
        await db.asset.findUnique({

          where:{

            slug,

          },

          select:{

            id:true,

            accountId:true,

          },

        });



      if(!asset){

        return res.status(404).json({

          error:
            "Asset not found",

        });

      }



      if(asset.accountId){

        return res.status(409).json({

          error:
            "Asset already assigned",

        });

      }



      const updated =
        await db.asset.update({

          where:{

            id:
              asset.id,

          },


          data:{

            accountId,


          },


        });



      return res.json({

        success:true,


        assetId:
          updated.id,


        accountId:
          updated.accountId,


      });



    }
    catch(error:any){


      console.error(

        "[ASSET CLAIM FAILED]",

        error

      );


      return res.status(500).json({

        error:
          "Claim failed",

      });


    }

  }

);


export default router;