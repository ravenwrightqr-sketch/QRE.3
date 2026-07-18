import express from "express";

import { safeStringParam } from "../lib/safeParam.js";

import {
  getDashboardMetrics,
  getFunnel,
  getRecentActivity,
  getAssetLiveMetrics,
} from "@qre/engine";

import {
  createAnalyticsRepository,
} from "../repositories/analyticsRepository.js";


const router = express.Router();


const analyticsRepository =
  createAnalyticsRepository();



/**
 * =========================
 * DASHBOARD SNAPSHOT
 * =========================
 */
router.get("/:assetId", async (req, res) => {

  try {

    const assetId =
      safeStringParam(
        req.params.assetId
      );


    if(!assetId){

      return res.status(400).json({
        error:"Missing assetId",
      });

    }



    const [
      metrics,
      funnel,
      activity,

    ] =
      await Promise.all([


        getDashboardMetrics(
          assetId,
          analyticsRepository
        ),


        getFunnel(
          assetId,
          analyticsRepository
        ),


        getRecentActivity(
          assetId,
          analyticsRepository,
          20
        ),


      ]);



    return res.json({

      metrics,

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
        "analytics failed",

    });

  }

});





/**
 * =========================
 * LIVE DASHBOARD STREAM
 * =========================
 */
router.get("/live/:assetId", async(req,res)=>{


  const assetId =
    safeStringParam(
      req.params.assetId
    );


  if(!assetId){

    return res.status(400).end();

  }



  res.setHeader(
    "Content-Type",
    "text/event-stream"
  );

  res.setHeader(
    "Cache-Control",
    "no-cache"
  );

  res.setHeader(
    "Connection",
    "keep-alive"
  );


  res.flushHeaders?.();



  let alive = true;



  req.on(
    "close",
    ()=>{
      alive=false;
    }
  );




  const heartbeat =
    setInterval(()=>{

      if(alive){

        res.write(
          ": heartbeat\n\n"
        );

      }

    },15000);





  const send =
    async()=>{


      if(!alive)return;



      try{


        const [

          metrics,

          funnel,

          activity,


        ] =
        await Promise.all([



          getAssetLiveMetrics(
            assetId,
            analyticsRepository
          ),



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



        res.write(

          `data: ${JSON.stringify({

            metrics,

            funnel,

            activity,

            timestamp:
              Date.now(),

          })}\n\n`

        );


      }
      catch(err){

        console.error(
          "[SSE ERROR]",
          err
        );

      }


    };




  await send();



  const interval =
    setInterval(
      send,
      2000
    );




  req.on(
    "close",
    ()=>{

      alive=false;

      clearInterval(
        interval
      );

      clearInterval(
        heartbeat
      );


      res.end();

    }
  );


});



export default router;