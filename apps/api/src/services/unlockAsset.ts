import Stripe from "stripe";
import { db } from "@qre/db";
import { Prisma } from "@prisma/client";


/**
 * =====================================================
 * UNLOCK ASSET SERVICE
 * =====================================================
 *
 * SINGLE SOURCE OF TRUTH FOR PAYMENT UNLOCKS
 *
 * Payment truth:
 * Stripe event
 *
 * Asset ownership truth:
 * Asset.accountId
 *
 * User permission truth:
 * AccountUser
 *
 * Ownership history:
 * Ownership table
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
       * Prevent duplicate Stripe webhook execution
       */
      if(asset.paid){

        return asset;

      }



      /**
       * Resolve account ownership
       *
       * Existing business account:
       * reuse it.
       *
       * New buyer:
       * create personal account.
       */

      let accountId =
        asset.accountId;



      if(!accountId && userId){


        const account =
          await tx.account.create({

            data:{

              name:
                "Personal Account",

            },

          });



        accountId =
          account.id;



        await tx.accountUser.create({

          data:{

            accountId,

            userId,

            role:
              "OWNER",

          },

        });

      }



      /**
       * Unlock asset
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



            ...(accountId
              ? {
                  accountId,
                }
              : {}
            ),



            totalUnlocks:{
              increment:1,
            },



            ...(session?.amount_total !== null &&
              session?.amount_total !== undefined
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
       * Ownership history
       *
       * Ownership belongs to Account,
       * not User.
       */
      if(accountId){


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

      }



      return updated;


    }
  );

}