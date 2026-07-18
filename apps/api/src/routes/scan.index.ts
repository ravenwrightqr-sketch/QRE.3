import express from "express";

import {
  scanEngine,
} from "@qre/engine";


import {
  scanRoute,
} from "./scan.route.js";


import {
  createAssetRepository,
} from "../repositories/assetRepository.js";


import {
  createSessionRepository,
} from "../repositories/sessionRepository.js";


import {
  createAccessRepository,
} from "../repositories/accessRepository.js";


import {
  createAnalyticsRepository,
} from "../repositories/analyticsRepository.js";


import {
  createStoryDeliveryRepository,
} from "../repositories/storyDeliveryRepository.js";


import {
  requireAuth,
} from "../middleware/requireAuth.js";


import type {
  AuthRequest,
} from "../middleware/requireAuth.js";



const router =
  express.Router();




function getString(
  value: unknown
): string | null {

  if (
    typeof value === "string"
  ) {

    return value;

  }


  if (
    Array.isArray(value) &&
    typeof value[0] === "string"
  ) {

    return value[0];

  }


  return null;

}




function getNumber(
  value: unknown
): number | undefined {

  const number =
    typeof value === "string"
      ? Number(value)
      : value;


  if (
    typeof number === "number" &&
    Number.isFinite(number)
  ) {

    return number;

  }


  return undefined;

}



/**
 * =========================
 * STATIC SCAN
 * =========================
 */

router.get(
  "/:slug",
  (
    req,
    res,
    next
  ) => {

    console.log(
      "🔥 SCAN ROUTE HIT",
      req.params.slug
    );

    next();

  },
  scanRoute
);





/**
 * =========================
 * LIVE SCAN (SSE)
 * =========================
 */

router.get(
  "/:slug/live",
  requireAuth,
  async (
    req:AuthRequest,
    res
  ) => {


    try {


      const slug =
        getString(
          req.params.slug
        );


      if (!slug) {

        res.status(400).json({

          error:
            "Invalid slug",

        });

        return;

      }



      const lat =
        getNumber(
          req.query.lat
        );


      const lng =
        getNumber(
          req.query.lng
        );


      const accuracy =
        getNumber(
          req.query.accuracy
        );



      const geo =
        lat !== undefined &&
        lng !== undefined

          ? {
              lat,
              lng,
              accuracy,
            }

          : undefined;



      const userId =
        req.user?.userId;



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




      const assetRepository =
        createAssetRepository();


      const sessionRepository =
        createSessionRepository();


      const analyticsRepository =
        createAnalyticsRepository();


      const accessRepository =
        createAccessRepository();


      const storyDeliveryRepository =
        createStoryDeliveryRepository();





      const result =
        await scanEngine(

          {
            slug,

            userId,

            geo,

          },

          {

            assetRepository,

            sessionRepository,

            analyticsRepository,

            accessRepository,

            storyDeliveryRepository,

          }

        );





      const moments =
        [...result.moments].sort(

          (a,b) =>
            a.order - b.order

        );





      res.write(

        `data: ${JSON.stringify({

          type:
            "session",

          id:
            result.sessionId,

        })}\n\n`

      );





      for (
        const moment of moments
      ) {


        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              400
            )
        );


        res.write(

          `data: ${JSON.stringify({

            type:
              "moment",

            payload:
              moment,

          })}\n\n`

        );

      }




      res.write(

        `data: ${JSON.stringify({

          type:
            "end",

        })}\n\n`

      );


      res.end();



    } catch(error:any) {


      console.error(
        "🔥 LIVE SCAN ERROR",
        error
      );


      res.write(

        `data: ${JSON.stringify({

          type:
            "error",

          message:
            error.message,

        })}\n\n`

      );


      res.end();


    }


  }

);



export default router;