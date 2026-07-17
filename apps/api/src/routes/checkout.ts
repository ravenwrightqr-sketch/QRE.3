import express from "express";
import Stripe from "stripe";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();


const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  {
    apiVersion:"2026-06-24.dahlia",
  }
);



/**
 * =====================================================
 * CREATE STRIPE CHECKOUT SESSION
 * =====================================================
 *
 * This route DOES NOT unlock.
 *
 * Payment truth:
 *      Stripe webhook
 *
 * Unlock:
 *      stripeWebhook.ts
 *
 * =====================================================
 */
router.post(
  "/",
  requireAuth,
  async(
    req:AuthRequest,
    res
  )=>{


    try {


      const {
        slug,
      } = req.body;



      const userId =
        req.user?.userId;



      if(
        typeof slug !== "string"
      ){

        return res.status(400).json({

          error:
            "Missing or invalid slug",

        });

      }



      const asset =
        await db.asset.findUnique({

          where:{
            slug,
          },

        });



      if(!asset){

        return res.status(404).json({

          error:
            "Asset not found",

        });

      }



      const baseUrl =
        process.env.CLIENT_URL;



      if(!baseUrl){

        throw new Error(
          "CLIENT_URL missing"
        );

      }



      /**
       * =====================================================
       * DEV MODE
       * =====================================================
       *
       * Development shortcut.
       *
       * IMPORTANT:
       * Uses same production unlock endpoint logic
       * eventually.
       *
       * No direct ownership writes here.
       *
       * =====================================================
       */
      if(
        process.env.NODE_ENV === "development"
      ){

        return res.json({

          dev:true,

          message:
            "Use stripe test webhook to complete unlock",

          assetId:
            asset.id,

        });

      }



      /**
       * =====================================================
       * VALIDATION
       * =====================================================
       */
      if(
        !asset.priceCents ||
        asset.priceCents <= 0
      ){

        return res.status(400).json({

          error:
            "Invalid price configuration",

        });

      }




      /**
       * =====================================================
       * STRIPE SESSION
       * =====================================================
       */
      const session =
        await stripe.checkout.sessions.create({

          mode:"payment",


          line_items:[

            {

              price_data:{

                currency:"usd",

                unit_amount:
                  asset.priceCents,


                product_data:{

                  name:
                    asset.displayName ??
                    "QRE Experience",

                },

              },


              quantity:1,

            },

          ],



          success_url:
            `${baseUrl}/success`,



          cancel_url:
            `${baseUrl}/cancel`,



          metadata:{
  assetId: asset.id,
  slug: asset.slug,
  userId: userId ?? "anonymous",
  type:"ASSET_UNLOCK",
  paymentType:"ONE_TIME_UNLOCK",
},

        });





      return res.json({

        url:
          session.url,


        assetId:
          asset.id,

      });



    }
    catch(error:any){


      console.error(
        "[CHECKOUT ERROR]",
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