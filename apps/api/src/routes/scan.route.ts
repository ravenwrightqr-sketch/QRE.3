import {
  Response,
} from "express";

import {
  scanEngine,
} from "@qre/engine";

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

import type {
  AuthRequest,
} from "../middleware/requireAuth.js";



function getString(
  value: unknown
): string | null {

  if (typeof value === "string") {
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

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return undefined;
  }


  const number =
    Number(value);


  if (Number.isFinite(number)) {
    return number;
  }


  return undefined;

}



export async function scanRoute(
  req: AuthRequest,
  res: Response
) {

  try {

    const slug =
      getString(
        req.params.slug
      );


    if (!slug) {

      return res.status(400).json({

        error:
          "Invalid slug",

      });

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



    console.log(
      "🔥 ENGINE INPUT",
      {
        slug,
        userId:userId ?? null,
        geo,
      }
    );



    /**
     * =========================
     * REPOSITORY ADAPTERS
     * =========================
     */

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



    console.log(
      "🔥 ENGINE OUTPUT",
      {

        sessionId:
          result.sessionId,

        moments:
          result.cinematicScenes?.length ?? 0,

        scenes:
          result.cinematicScenes?.length ?? 0,

        preview:
          result.preview,

      }
    );



    return res.json(
      result
    );


  } catch (e:any) {


    console.error(
      "🔥 SCAN ROUTE ERROR",
      e
    );


    return res.status(500).json({

      error:
        e.message,

    });

  }

}