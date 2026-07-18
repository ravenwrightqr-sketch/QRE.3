import express, {
  Request,
  Response,
} from "express";


import {
  getAssetLiveMetrics,
} from "@qre/engine";


import {
  createAnalyticsRepository,
} from "../repositories/analyticsRepository.js";


const router =
  express.Router();



/**
 * =========================
 * ANALYTICS ADAPTER
 *
 * API owns database.
 * Engine receives repository.
 * =========================
 */
const analyticsRepository =
  createAnalyticsRepository();



/**
 * =========================
 * LIVE DASHBOARD STREAM (SSE)
 * =========================
 */
router.get(
  "/live/:assetId",
  async (
    req:Request,
    res:Response
  ) => {


    const assetId =
      req.params.assetId;



    if (
      !assetId ||
      typeof assetId !== "string"
    ) {

      return res.status(400).json({
        error:"Missing assetId",
      });

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
      () => {

        alive = false;

      }
    );



    const send =
      async () => {


        if(!alive){

          return;

        }



        try {


          const data =
            await getAssetLiveMetrics(

              assetId,

              analyticsRepository

            );



          res.write(

            `data: ${JSON.stringify(data)}\n\n`

          );


        }

        catch(error){


          console.error(
            "[LIVE METRICS ERROR]",
            error
          );


          res.write(

            `data: ${JSON.stringify({
              error:"metrics_failed",
            })}\n\n`

          );


        }


      };




    await send();



    const heartbeat =
      setInterval(
        () => {

          if(alive){

            res.write(
              ": heartbeat\n\n"
            );

          }

        },
        15000
      );



    const interval =
      setInterval(
        send,
        2000
      );



    req.on(
      "close",
      () => {

        clearInterval(
          interval
        );

        clearInterval(
          heartbeat
        );

        res.end();

      }
    );


  }
);



export default router;