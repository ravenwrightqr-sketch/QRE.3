import express from "express";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();


router.post(
  "/:slug",
  requireAuth,
  async(
    req: AuthRequest,
    res
  )=>{

    try {


      const slug =
        Array.isArray(req.params.slug)
          ? req.params.slug[0]
          : req.params.slug;


      const userId =
        req.user?.userId;



      if(!slug || !userId){

        return res.status(400).json({
          error:"slug and auth required"
        });

      }



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
            "No permission to claim assets",

        });

      }



      const accountId =
        membership.accountId;



      const result =
        await db.$transaction(

          async(tx)=>{


            const asset =
              await tx.asset.findUnique({

                where:{
                  slug,
                },

                select:{
                  id:true,
                  accountId:true,
                },

              });



            if(!asset){

              throw new Error(
                "Asset not found"
              );

            }



            if(asset.accountId){

              throw new Error(
                "Asset already claimed"
              );

            }



            const updated =
              await tx.asset.update({

                where:{
                  id:asset.id,
                },

                data:{

                  accountId,

                  claimedAt:
                    new Date(),

                },

              });



            await tx.ownership.upsert({

              where:{
                assetId:asset.id,
              },


              update:{

                accountId,

                status:
                  "CLAIMED",

                claimedAt:
                  new Date(),

              },


              create:{

                assetId:
                  asset.id,

                accountId,

                status:
                  "CLAIMED",

              },

            });



            return updated;

          }

        );



      return res.json({

        success:true,

        assetId:
          result.id,

        accountId:
          result.accountId,

      });



    }
    catch(error:any){


      console.error(
        "[CLAIM FAILED]",
        error
      );


      if(
        error.message === "Asset not found"
      ){

        return res.status(404).json({
          error:error.message,
        });

      }


      if(
        error.message === "Asset already claimed"
      ){

        return res.status(409).json({
          error:error.message,
        });

      }


      return res.status(500).json({

        error:
          "Claim failed",

      });


    }

  }

);


export default router;