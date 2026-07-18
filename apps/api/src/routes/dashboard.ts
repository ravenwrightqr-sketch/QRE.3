import express from "express";
import { db } from "@qre/db";

import {
  getRecentActivity,
  getFunnel,
} from "@qre/engine";

import {
  createAnalyticsRepository,
} from "../repositories/analyticsRepository.js";

import { safeStringParam } from "../lib/safeParam.js";


const router = express.Router();


/**
 * =========================
 * ANALYTICS ADAPTER
 * =========================
 *
 * API owns persistence.
 *
 * Engine only receives contract.
 *
 * =========================
 */
const analyticsRepository =
  createAnalyticsRepository();



/**
 * =========================
 * DASHBOARD OVERVIEW
 * SINGLE SOURCE OF TRUTH
 * =========================
 */
router.get("/:slug", async (req, res) => {

  try {


    const slug =
      safeStringParam(
        req.params.slug
      );


    if (!slug) {

      return res.status(400).json({
        error:"Missing slug",
      });

    }



    /**
     * =========================
     * LOAD ASSET
     * =========================
     */
    const asset =
      await db.asset.findUnique({

        where:{
          slug,
        },

        select:{
          id:true,
        },

      });



    if(!asset){

      return res.status(404).json({
        error:"Asset not found",
      });

    }



    const assetId =
      asset.id;



    /**
     * =========================
     * ENGINE ANALYTICS
     *
     * Engine receives repository.
     *
     * No Prisma inside engine.
     * =========================
     */
    const [
      funnel,
      activity,

    ] =
      await Promise.all([

        getFunnel(

          assetId,

          analyticsRepository

        ),


        getRecentActivity(

          assetId,

          analyticsRepository,

          10

        ),

      ]);




    /**
     * =========================
     * DASHBOARD RESPONSE
     * =========================
     */
    return res.json({

      assetId,

      funnel,

      activity,

      timestamp:
        new Date().toISOString(),

    });



  }

  catch(e:any){

    return res.status(500).json({

      error:
        e.message ||
        "Dashboard failed",

    });

  }

});



export default router;