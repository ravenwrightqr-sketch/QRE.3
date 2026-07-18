import express from "express";

import {
  getPresenceTimeline,
  getPresenceReplay,
} from "@qre/engine";

import {
  createPresenceRepository,
} from "../repositories/presenceRepository.js";


const router = express.Router();



/**
 * =====================================================
 * PRESENCE REPOSITORY ADAPTER
 * =====================================================
 *
 * API owns persistence.
 *
 * Engine receives:
 *
 * PresenceRepository contract
 *
 * Engine does not know:
 *
 * - Prisma
 * - database models
 * - queries
 *
 * =====================================================
 */
const presenceRepository =
  createPresenceRepository();





/**
 * =====================================================
 * RAW TIMELINE
 * =====================================================
 *
 * Returns geo presence history.
 *
 * Used by:
 *
 * - maps
 * - replay
 * - memory timeline
 *
 * =====================================================
 */
router.get(
  "/presence/:assetId",
  async (req, res) => {

    try {

      const assetId =
        req.params.assetId;



      if(!assetId){

        return res.status(400).json({
          error:"Missing assetId",
        });

      }



      const data =
        await getPresenceTimeline(

          assetId,

          presenceRepository

        );



      return res.json({

        assetId,

        points:data,

        timestamp:
          new Date().toISOString(),

      });


    }

    catch(err){

      console.error(
        "[PRESENCE][TIMELINE]",
        err
      );


      return res.status(500).json({

        error:"timeline failed",

      });

    }

  }
);






/**
 * =====================================================
 * REPLAY DATA
 * =====================================================
 *
 * Returns location movement history.
 *
 * Used by:
 *
 * - cinematic replay
 * - geo memory playback
 * - timeline visualization
 *
 * =====================================================
 */
router.get(
  "/presence/:assetId/replay",
  async (req, res) => {


    try {


      const assetId =
        req.params.assetId;



      if(!assetId){

        return res.status(400).json({
          error:"Missing assetId",
        });

      }




      const data =
        await getPresenceReplay(

          assetId,

          presenceRepository

        );




      return res.json({

        assetId,

        replay:data,

        timestamp:
          new Date().toISOString(),

      });


    }

    catch(err){

      console.error(
        "[PRESENCE][REPLAY]",
        err
      );



      return res.status(500).json({

        error:"replay failed",

      });

    }


  }
);



export default router;