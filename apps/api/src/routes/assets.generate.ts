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
 * ASSET IDENTITY FACTORY
 * =====================================================
 *
 * Creates the physical/digital identity.
 *
 * Responsibility:
 *
 * User
 *   |
 * AccountUser
 *   |
 * Account
 *   |
 * Asset
 *   |
 * QR / NFC Identity
 *
 *
 * Does NOT create:
 *
 * ❌ Experience
 * ❌ Flow
 * ❌ AssetFlow
 * ❌ Ownership
 *
 *
 * Creation boundaries:
 *
 * Experience
 *   |
 *   experienceCreationServices
 *
 * Ownership
 *   |
 *   Stripe webhook
 *
 * =====================================================
 */


router.post(
  "/generate",
  requireAuth,
  async(
    req:AuthRequest,
    res,
  )=>{

    try{


      const userId =
        req.user?.userId;



      if(!userId){

        return res.status(401).json({

          error:
            "Authentication required",

        });

      }



      const {
        displayName,
      } = req.body;



      /**
       * Resolve account
       *
       * Asset belongs to Account.
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
       * Create identity token
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

          },

        );



      /**
       * Create Asset only.
       *
       * No runtime objects.
       */

      const asset =
        await db.asset.create({

          data:{

            slug,

            qrUrl,

            qrSvg,


            displayName:
              typeof displayName === "string" &&
              displayName.trim().length > 0
                ? displayName.trim()
                : "Untitled Asset",


            accountId,


            status:
              "active",


            paid:
              false,


            priceCents:
              599,

          },

        });



      return res.json({

        success:true,


        assetId:
          asset.id,


        accountId,


        slug:
          asset.slug,


        qrUrl:
          asset.qrUrl,


        qrSvg:
          asset.qrSvg,


        displayName:
          asset.displayName,

      });



    }
    catch(error:any){


      console.error(

        "[ASSET GENERATION ERROR]",

        error,

      );



      return res.status(500).json({

        error:
          error.message,

      });

    }

  },
);



export default router;