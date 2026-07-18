import { emitSpineEvent } from "../spine/eventSpine.js";
import { resolveGeoLabel } from "../geo/resolveGeoLabel.js";
import { buildGeoMemoryAnalytics } from "../analytics/geoMemoryAnalytics.js";

import type {
  GeoMemoryRepository,
  PresenceRepository,
} from "../repositories/index.js";


type CheckInInput = {

  assetId:string;

  sessionId:string;

  userId?:string;

  geo?:{

    lat:number;

    lng:number;

    accuracy?:number;

  };

};



export async function checkIn(
  input:CheckInInput,
  presenceRepo:PresenceRepository,
  geoRepo?:GeoMemoryRepository
){

  const now =
    new Date();



  /**
   * =====================================================
   * 1. PRESENCE SESSION
   * =====================================================
   */

  const session =
    await presenceRepo.upsertSession({

      id:
        input.sessionId,

      assetId:
        input.assetId,

      userId:
        input.userId ?? null,

      status:
        "ENTERED",

      enteredAt:
        now,

      geoLat:
        input.geo?.lat ?? null,

      geoLng:
        input.geo?.lng ?? null,

      accuracy:
        input.geo?.accuracy ?? null,

    });





  /**
   * =====================================================
   * 2. GEO LABEL RESOLUTION
   * =====================================================
   */

  let geoLabel:
    Awaited<
      ReturnType<typeof resolveGeoLabel>
    >
    | null = null;



  if(input.geo){

    geoLabel =
      await resolveGeoLabel(
        input.geo.lat,
        input.geo.lng
      );

  }





  /**
   * =====================================================
   * 3. GEO PROOF
   * =====================================================
   */

  if(input.geo){

    await presenceRepo.createGeoProof({

      assetId:
        input.assetId,

      sessionId:
        input.sessionId,

      userId:
        input.userId ?? null,

      lat:
        input.geo.lat,

      lng:
        input.geo.lng,

      accuracy:
        input.geo.accuracy ?? null,

      source:
        "checkin",

      label:
        geoLabel?.label ?? null,

      city:
        geoLabel?.city ?? null,

      region:
        geoLabel?.region ?? null,

      country:
        geoLabel?.country ?? null,

    });

  }





  /**
   * =====================================================
   * 4. EVENT SPINE
   * =====================================================
   */

  await emitSpineEvent({

    type:
      "CHECK_IN",

    assetId:
      input.assetId,

    sessionId:
      input.sessionId,

    userId:
      input.userId,

    meta:{

      geo:
        input.geo,

      geoLabel,

    },

  });







  /**
   * =====================================================
   * 5. GEO MEMORY ANALYTICS
   * =====================================================
   */

  if(geoRepo){

    try{

      await buildGeoMemoryAnalytics(

        input.assetId,

        geoRepo,

        input.sessionId

      );

    }
    catch(err){

      console.warn(
        "[GEO MEMORY ANALYTICS FAILED]",
        err
      );

    }

  }





  return session;

}