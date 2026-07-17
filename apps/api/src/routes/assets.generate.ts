import express from "express";
import { db } from "@qre/db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

const router = express.Router();


/**
 * ASSET FACTORY (PRODUCTION LOCKED)
 *
 * Creates:
 *
 * User
 *  ↓
 * Asset Identity
 *  ↓assetflow binding
 * Experience Flow
 *  ↓
 * QR Code
 *
 */


router.post("/generate", async (req, res) => {
  const { displayName } = req.body;

  try {


    const userId =
      (req as any).user?.userId ?? null;



    if(!userId){

      return res.status(401).json({
        error:
          "Authentication required"
      });

    }




    const slug =
      nanoid(10);





    const baseUrl =
      process.env.PUBLIC_URL ||
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
     * 4. CREATE ASSET IDENTITY
     */

    const asset =
      await db.asset.create({

        data: {

          slug,

          qrUrl,

          qrSvg,

          status:
            "active",

          paid:
            false,

          accountId:
           null,

        },

      });






    /**
     * 5. CREATE INITIAL EXPERIENCE FLOW
     *
     * Flow now owns the relationship.
     *
     */

   const flow =
  await db.flow.create({

    data: {

      name:
        "Untitled Experience",

      actions:
        [],

      data:
        {
          blocks:[]
        },

      merchantId:
        userId,

    },

  });

   await db.assetFlow.create({

  data:{
    assetId: asset.id,
    flowId: flow.id,
    active:true,
    priority:0,
  },

});




    return res.json({

      assetId:
        asset.id,


      flowId:
        flow.id,


      slug:
        asset.slug,


      qrUrl:
        asset.qrUrl,


      qrSvg:
        asset.qrSvg,


    });



  } catch(e:any){


    console.error(
      "ASSET GENERATION ERROR:",
      e
    );


    return res.status(500).json({

      error:
        e.message,

    });


  }

});


export default router;