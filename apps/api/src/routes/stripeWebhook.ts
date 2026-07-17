import express, { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "@qre/db";
import { unlockAsset } from "../services/unlockAsset.js";


const router = express.Router();


const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY as string,
  {
    apiVersion: "2026-06-24.dahlia",
  }
);


/**
 * =====================================================
 * STRIPE WEBHOOK
 * =====================================================
 *
 * POST /api/stripe/webhook
 *
 * Responsibilities:
 *
 * - Verify Stripe signature
 * - Record Stripe event
 * - Prevent duplicate processing
 * - Send successful payment to unlock service
 *
 *
 * Does NOT:
 *
 * - Update assets directly
 * - Create ownership directly
 * - Handle revenue logic
 *
 *
 * Payment truth:
 * Stripe
 *
 * Unlock truth:
 * services/unlockAsset.ts
 *
 * =====================================================
 */
router.post(
  "/webhook",

  express.raw({
    type:"application/json",
  }),


  async(
    req:Request,
    res:Response
  )=>{


    const signature =
      req.headers["stripe-signature"];



    if(
      typeof signature !== "string"
    ){

      return res.status(400).json({

        error:
          "Missing Stripe signature",

      });

    }



    let event:Stripe.Event;



    try{


      event =
        stripe.webhooks.constructEvent(

          req.body,

          signature,

          process.env.STRIPE_WEBHOOK_SECRET as string

        );


    }
    catch(error){


      return res.status(400).json({

        error:
          error instanceof Error
            ? error.message
            : "Invalid webhook",

      });


    }



    /**
     * =====================================================
     * STRIPE EVENT IDEMPOTENCY
     * =====================================================
     *
     * Stripe retries events.
     * Database remembers what was processed.
     *
     * =====================================================
     */
    const existing =
      await db.stripeEvent.findUnique({

        where:{
          id:event.id,
        },

      });



    if(existing){

      return res.json({

        received:true,

        duplicate:true,

      });

    }



    await db.stripeEvent.create({

      data:{

        id:event.id,

        type:event.type,

      },

    });



    /**
     * =====================================================
     * PAYMENT SUCCESS ONLY
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



    const assetId =
      session.metadata?.assetId;



    if(!assetId){

      return res.status(400).json({

        error:
          "Missing assetId metadata",

      });

    }



    const userId =
      session.metadata?.userId &&
      session.metadata.userId !== "anonymous"

        ? session.metadata.userId

        : null;



    /**
     * =====================================================
     * SINGLE UNLOCK PATH
     * =====================================================
     */
    await unlockAsset(

      assetId,

      userId,

      session

    );



    return res.json({

      received:true,

      unlocked:true,

      assetId,

    });


  }
);



export default router;