import express, {
  Request,
  Response,
} from "express";

import Stripe from "stripe";

import { db } from "@qre/db";

import { unlockAsset } from "../services/unlockAsset.js";


const router = express.Router();


const stripe =
  new Stripe(
    process.env.STRIPE_SECRET_KEY!,
    {
      apiVersion:
        "2026-06-24.dahlia",
    }
  );



/**
 * =====================================================
 * STRIPE PRODUCTION WEBHOOK
 * =====================================================
 *
 * Payment authority:
 * Stripe
 *
 * Ownership authority:
 * unlockAsset()
 *
 *
 * Pipeline:
 *
 * Stripe
 *   |
 *   | verified event
 *   |
 * stripeWebhook
 *   |
 *   |
 * unlockAsset()
 *   |
 *   |
 * Asset
 * Account
 * Ownership
 * Revenue
 *
 *
 * Guarantees:
 *
 * - Signature verified
 * - Duplicate safe
 * - Retry safe
 * - Ownership centralized
 * - No direct asset mutation
 *
 * =====================================================
 */


router.post(
  "/webhook",

  express.raw({
    type:
      "application/json",
  }),


  async(
    req: Request,
    res: Response
  ) => {


    const signature =
      req.headers[
        "stripe-signature"
      ];



    if(
      typeof signature !== "string"
    ){

      return res.status(400).json({

        error:
          "Missing Stripe signature",

      });

    }



    let event: Stripe.Event;



    /**
     * =====================================================
     * VERIFY STRIPE SIGNATURE
     * =====================================================
     */

    try {


      event =
        stripe.webhooks.constructEvent(

          req.body,

          signature,

          process.env
            .STRIPE_WEBHOOK_SECRET!

        );


    }
    catch(error){


      console.error(
        "[STRIPE SIGNATURE INVALID]",
        error
      );


      return res.status(400).json({

        error:
          "Invalid Stripe signature",

      });

    }




    /**
     * =====================================================
     * IGNORE DUPLICATES
     * =====================================================
     *
     * Stripe retries aggressively.
     *
     * Database unique constraint
     * is the final protection.
     *
     * =====================================================
     */

    try {


      await db.stripeEvent.create({

        data:{

          id:
            event.id,


          type:
            event.type,

        },

      });


    }
    catch(error:any){


      if(
        error.code === "P2002"
      ){

        console.log(
          "[STRIPE DUPLICATE EVENT]",
          event.id
        );


        return res.json({

          received:true,

          duplicate:true,

        });

      }


      console.error(
        "[STRIPE EVENT RECORD FAILED]",
        error
      );


      return res.status(500).json({

        error:
          "Unable to record event",

      });

    }




    try {


      /**
       * =====================================================
       * ONLY PROCESS COMPLETED CHECKOUTS
       * =====================================================
       */

      if(
        event.type !==
        "checkout.session.completed"
      ){

        return res.json({

          received:true,

        });

      }




      const session =
        event.data.object as Stripe.Checkout.Session;



      /**
       * =====================================================
       * PAYMENT VALIDATION
       * =====================================================
       */

      if(
        session.payment_status !==
        "paid"
      ){


        console.warn(
          "[STRIPE PAYMENT NOT PAID]",
          {

            eventId:
              event.id,


            sessionId:
              session.id,

          }
        );


        return res.json({

          received:true,

          ignored:true,

        });

      }





      /**
       * =====================================================
       * RESOLVE PURCHASE CONTEXT
       * =====================================================
       */

      const assetId =
        session.metadata?.assetId;



      if(!assetId){

        throw new Error(
          "Stripe session missing assetId metadata"
        );

      }

      /**
       * =====================================================
       * SINGLE UNLOCK PIPELINE
       * =====================================================
       */

      const asset =
      await unlockAsset(

       assetId,
 
       session

       );





      console.log(
        "[STRIPE PAYMENT SUCCESS]",
        {

          eventId:
            event.id,


          sessionId:
            session.id,


          assetId,


          accountId:
            asset.accountId,


          paymentIntent:
            session.payment_intent,

        }
      );




      return res.json({

        received:true,

        unlocked:true,

        assetId,

      });



    }
    catch(error:any){


      console.error(
        "[STRIPE WEBHOOK PROCESSING FAILED]",
        {

          eventId:
            event.id,


          type:
            event.type,


          error:
            error.message,

        }
      );



      /**
       * Important:
       *
       * 500 tells Stripe:
       * retry this event.
       *
       */

      return res.status(500).json({

        error:
          "Webhook processing failed",

      });

    }


  }

);



export default router;