import Stripe from "stripe";
import { db } from "@qre/db";
import { Prisma } from "@prisma/client";


/**
 * =====================================================
 * UNLOCK ASSET SERVICE
 * =====================================================
 *
 * PAYMENT EXECUTION BOUNDARY
 *
 * Stripe payment is truth.
 *
 * This service applies payment truth
 * to the QRE ownership system.
 *
 *
 * RESPONSIBILITIES:
 *
 * ✅ Verify asset exists
 * ✅ Mark asset as paid
 * ✅ Record revenue
 * ✅ Create/update Ownership
 * ✅ Remain idempotent for Stripe retries
 *
 *
 * DOES NOT:
 *
 * ❌ Create accounts
 * ❌ Create users
 * ❌ Create memberships
 * ❌ Create claims
 * ❌ Create flows
 * ❌ Attach assets
 *
 *
 * Architecture:
 *
 *
 * Stripe
 *   |
 *   |
 * stripeWebhook
 *   |
 *   |
 * unlockAsset()
 *   |
 *   +---- Asset.paid = true
 *   |
 *   +---- Ownership.ACTIVE
 *
 *
 * =====================================================
 */


export async function unlockAsset(
  assetId: string,
  session?: Stripe.Checkout.Session
) {


  return db.$transaction(

    async(
      tx: Prisma.TransactionClient
    )=>{


      /**
       * =================================================
       * LOAD ASSET
       * =================================================
       */


      const asset =
        await tx.asset.findUnique({

          where:{
            id:assetId,
          },

        });



      if(!asset){

        throw new Error(
          "Asset not found"
        );

      }



      /**
       * =================================================
       * UPDATE ASSET PAYMENT STATE
       *
       * Idempotent:
       *
       * Stripe retries are safe.
       *
       * =================================================
       */


      const updatedAsset =
        await tx.asset.update({

          where:{
            id:assetId,
          },


          data:{


            paid:true,


            status:
              "active",



            totalUnlocks:
              asset.paid
                ? undefined
                : {
                    increment:1,
                  },



            ...(session?.amount_total != null
              ? {

                  totalRevenueCents:{

                    increment:
                      session.amount_total,

                  },

                }

              : {}

            ),


          },

        });



      /**
       * =================================================
       * OWNERSHIP RECORD
       *
       * Account already exists.
       *
       * Payment activates ownership.
       *
       * =================================================
       */


      if(!asset.accountId){

        throw new Error(
          "Asset has no account ownership"
        );

      }



      await tx.ownership.upsert({

        where:{
          assetId,
        },


        update:{


          accountId:
            asset.accountId,


          status:
            "ACTIVE",


          claimedAt:
            new Date(),


          stripeSessionId:
            session?.id ?? undefined,


          paymentIntentId:

            typeof session?.payment_intent === "string"

              ? session.payment_intent

              : undefined,


        },


        create:{


          assetId,


          accountId:
            asset.accountId,


          status:
            "ACTIVE",


          claimedAt:
            new Date(),


          stripeSessionId:
            session?.id ?? undefined,


          paymentIntentId:

            typeof session?.payment_intent === "string"

              ? session.payment_intent

              : undefined,


        },


      });



      /**
       * =================================================
       * RETURN PAYMENT RESULT
       * =================================================
       */


      return updatedAsset;


    }

  );


}