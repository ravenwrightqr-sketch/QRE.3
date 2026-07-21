import Stripe from "stripe";
import { db } from "@qre/db";
import { Prisma } from "@prisma/client";

/**
 * =====================================================
 * UNLOCK ASSET SERVICE
 * =====================================================
 *
 * PAYMENT SOURCE OF TRUTH
 * Stripe
 *
 * OWNERSHIP SOURCE OF TRUTH
 * Account ownership
 * user id retained only for legacy compatability
 *
 * ARCHITECTURE
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
 * RULES
 *
 * - Assets belong to Accounts
 * - Users belong to Accounts
 * - Ownership tracks Account control
 * - Stripe retries are idempotent
 * - No Ownership.userId exists
 *
 * =====================================================
 */

export async function unlockAsset(
  assetId: string,
  userId: string | null,
  session?: Stripe.Checkout.Session
) {

  return db.$transaction(
    async (
      tx: Prisma.TransactionClient
    ) => {


      /**
       * Load asset
       */
      const asset =
        await tx.asset.findUnique({
          where:{
            id: assetId,
          },
        });


      if(!asset){
        throw new Error(
          "Asset not found"
        );
      }



      /**
       * Resolve account ownership
       */
      let accountId =
        asset.accountId;



      /**
       * Find existing user account
       */
      if(!accountId && userId){

        const membership =
          await tx.accountUser.findFirst({

            where:{
              userId,
            },

            select:{
              accountId:true,
            },

          });


        if(membership){
          accountId =
            membership.accountId;
        }

      }



      /**
       * Create consumer account
       * only if none exists
       */
      if(!accountId){


        const account =
          await tx.account.create({

            data:{

              name:
                userId
                  ? "Personal Account"
                  : "Anonymous Customer",


              type:
                "CONSUMER",


              plan:
                "CONSUMER",

            },

          });


        accountId =
          account.id;



        /**
         * Attach user
         */
        if(userId){


          await tx.accountUser.create({

            data:{

              accountId,

              userId,

              role:
                "OWNER",

            },

          });

        }

      }



      /**
       * Unlock asset
       *
       * Safe for Stripe retries.
       */
      const updated =
        await tx.asset.update({

          where:{
            id:assetId,
          },


          data:{


            paid:true,


            status:
              "active",


            accountId,


            totalUnlocks:{
              increment:
                asset.paid
                  ? 0
                  : 1,
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
       * Ownership record
       *
       * Account is owner.
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


          stripeSessionId:
            session?.id ?? null,


          paymentIntentId:
            typeof session?.payment_intent === "string"
              ? session.payment_intent
              : null,


        },


        create:{


          assetId,


          accountId,


          status:
            "CLAIMED",


          claimedAt:
            new Date(),


          stripeSessionId:
            session?.id ?? null,


          paymentIntentId:
            typeof session?.payment_intent === "string"
              ? session.payment_intent
              : null,


        },

      });



      return updated;


    }
  );

}