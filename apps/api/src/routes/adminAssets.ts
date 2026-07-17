import express from "express";
import { db } from "@qre/db";

const router = express.Router();


router.post(
  "/assets/:assetId/assign",
  async(req,res)=>{

    try{

      const {
        assetId
      } = req.params;


      const {
        userId
      } = req.body;



      if(!assetId || !userId){

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
             * Ownership belongs to Account,
             * not User.
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
             * Create ownership record
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
    catch(e:any){

      console.error(
        "ADMIN ASSIGN FAILED",
        e
      );


      return res.status(500).json({

        error:
          e.message,

      });

    }

  }
);


export default router;