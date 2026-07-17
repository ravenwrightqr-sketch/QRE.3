import express from "express";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();


router.post("/:slug", requireAuth, async (req: AuthRequest, res) => {

  try {

    const rawSlug = req.params.slug;

    const slug =
      typeof rawSlug === "string"
        ? rawSlug
        : Array.isArray(rawSlug)
          ? rawSlug[0]
          : undefined;


    const userId = req.user?.userId;


    if (!slug || !userId) {

      return res.status(400).json({
        error:"Invalid request",
      });

    }


    /**
     * USER ACCOUNT
     *
     * Ownership is account based.
     */
    const membership =
      await db.accountUser.findFirst({

        where:{
          userId,
          role:"OWNER",
        },

        include:{
          account:true,
        },

      });



    if(!membership){

      return res.status(403).json({
        error:"No account available",
      });

    }



    const accountId =
      membership.accountId;



    /**
     * CLAIM ASSET
     *
     * Only unassigned assets.
     */
    const updated =
      await db.asset.updateMany({

        where:{
          slug,
          accountId:null,
        },


        data:{

          accountId,

          claimedAt:new Date(),

        },

      });



    if(updated.count === 0){

      return res.status(409).json({
        error:"Already claimed",
      });

    }



    const asset =
      await db.asset.findUnique({

        where:{
          slug,
        },

        select:{

          id:true,

          accountId:true,

        },

      });



    if(!asset){

      return res.status(404).json({
        error:"Asset not found",
      });

    }



    /**
     * OWNERSHIP RECORD
     *
     * Account owns asset.
     */
    await db.ownership.upsert({

      where:{
        assetId:asset.id,
      },


      update:{

        accountId,

        status:"CLAIMED",

        claimedAt:new Date(),

      },


      create:{

        assetId:asset.id,

        accountId,

        status:"CLAIMED",

      },

    });



    return res.json({

      success:true,

      assetId:asset.id,

      accountId,

    });



  } catch(e:any){

    console.error(
      "CLAIM FAILED",
      e
    );


    return res.status(500).json({

      error:e.message,

    });

  }

});


export default router;