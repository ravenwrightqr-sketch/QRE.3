import express from "express";
import { db } from "@qre/db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";


const router = express.Router();


/**
 * =====================================================
 * ASSET FACTORY
 * =====================================================
 *
 * Production creation pipeline:
 *
 * User
 *   |
 * AccountUser
 *   |
 * Account
 *   |
 * Asset Identity
 *   |
 * Flow
 *   |
 * AssetFlow Binding
 *   |
 * QR/NFC Identity
 *
 *
 * Ownership is NOT created here.
 *
 * Ownership is created by:
 *
 * Stripe payment
 *        |
 *        |
 * unlockAsset()
 *
 *
 * Source of truth:
 *
 * Asset.accountId
 *
 * =====================================================
 */


router.post(
  "/generate",
  requireAuth,
  async(
    req:AuthRequest,
    res
  )=>{


    try{


      const {
        displayName,
      } = req.body;



      const userId =
        req.user?.userId;



      if(!userId){

        return res.status(401).json({

          error:
            "Authentication required",

        });

      }



      /**
       * Resolve account membership
       */

      const membership =
        await db.accountUser.findFirst({

          where:{
            userId,
          },

          select:{
            accountId:true,
          },

        });



      if(!membership){

        return res.status(400).json({

          error:
            "User has no account",

        });

      }



      const accountId =
        membership.accountId;



      /**
       * Create QR identity
       */

      const slug =
        nanoid(10);



      const baseUrl =
        process.env.PUBLIC_URL ??
        "http://localhost:3000";



      const qrUrl =
        `${baseUrl}/s/${slug}`;



      const qrSvg =
        await QRCode.toString(

          qrUrl,

          {

            type:"svg",

            errorCorrectionLevel:"H",

            margin:1,

            scale:6,

          }

        );




      /**
       * Atomic creation:
       *
       * Asset
       * Flow
       * AssetFlow
       *
       */

      const result =
        await db.$transaction(

          async(tx)=>{


            const asset =
              await tx.asset.create({

                data:{

                  slug,

                  qrUrl,

                  qrSvg,


                  displayName:
                    typeof displayName === "string"
                      ? displayName
                      : "Untitled Experience",


                  accountId,


                  status:
                    "active",


                  paid:
                    false,


                  priceCents:
                    599,

                },

              });



            const flow =
              await tx.flow.create({

                data:{


                  name:
                    "Untitled Experience",


                  actions:
                    [],


                  data:{

                    blocks:[]

                  },


                  merchantId:
                    accountId,


                },

              });



            await tx.assetFlow.create({

              data:{


                assetId:
                  asset.id,


                flowId:
                  flow.id,


                active:
                  true,


                priority:
                  0,


              },

            });



            return {

              asset,

              flow,

            };


          }

        );




      return res.json({

        success:true,


        assetId:
          result.asset.id,


        flowId:
          result.flow.id,


        accountId,


        slug:
          result.asset.slug,


        qrUrl:
          result.asset.qrUrl,


        qrSvg:
          result.asset.qrSvg,


      });



    }
    catch(error:any){


      console.error(

        "[ASSET GENERATION ERROR]",

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