import type {
  StoryDeliveryRepository,
} from "../repositories/index.js";

import type {
  CinematicScene,
  GeoStory,
  Moment,
} from "@qre/contracts";



type StoryInput = {

  assetId:string;

  sessionId:string;

  userId?:string|null;


  recipient?:{

    email?:string;

    phone?:string;

  };


  moments:Moment[];

  geoStory:GeoStory|null;

  cinematicScenes:CinematicScene[];

};





export async function createStoryDelivery(

  input:StoryInput,

  repo:StoryDeliveryRepository

){


  /**
   * =====================================================
   * 1. VERIFY ASSET
   * =====================================================
   *
   * Repository owns persistence.
   *
   * Engine only receives truth.
   *
   * =====================================================
   */


  const asset =
    await repo.findAsset(
      input.assetId
    );



  if(!asset){

    throw new Error(
      "Asset not found"
    );

  }





  /**
   * =====================================================
   * 2. DUPLICATE STORY GUARD
   * =====================================================
   */


  const existing =
    await repo.findExistingStory({

      assetId:
        input.assetId,

      sessionId:
        input.sessionId,

    });




  if(existing){

    return {

      storyId:
        existing.id,


      shareUrl:
        `/share/${existing.id}`,


      delivered:false,


      reason:
        "ALREADY_DELIVERED",

    };

  }





  /**
   * =====================================================
   * 3. NORMALIZE EXPERIENCE PAYLOAD
   * =====================================================
   */


  const safeGeoStory =
    structuredClone(
      input.geoStory
    );



  const safeMoments =
    structuredClone(
      input.moments
    );



  const safeScenes =
    structuredClone(
      input.cinematicScenes
    );






  /**
   * =====================================================
   * 4. CREATE MEMORY SNAPSHOT
   * =====================================================
   */


  const snapshot =
    await repo.createStorySnapshot({

      assetId:
        input.assetId,


      sessionId:
        input.sessionId,


      moments:
        safeMoments,


      geoStory:
        safeGeoStory,


      cinematicScenes:
        safeScenes,

    });






  /**
   * =====================================================
   * 5. FUTURE DELIVERY PIPELINE
   * =====================================================
   *
   * Email/SMS/push will attach here.
   *
   * Snapshot creation is the source of truth.
   *
   * =====================================================
   */



  const shareUrl =
    `/share/${snapshot.id}`;



  const delivered =
    Boolean(

      input.recipient?.email ||

      input.recipient?.phone

    );



  if(delivered){

    await queueExperienceDelivery({

      snapshotId:
        snapshot.id,

      assetId:
        asset.id,

      email:
        input.recipient?.email,

      phone:
        input.recipient?.phone,

      shareUrl,

    });

  }





  return {

    storyId:
      snapshot.id,


    shareUrl,


    delivered,


    reason:
      delivered
        ? "DELIVERY_QUEUED"
        : "CREATED",

  };


}








/**
 * =====================================================
 * DELIVERY QUEUE PLACEHOLDER
 * =====================================================
 *
 * Future:
 *
 * Resend
 * Twilio
 * Push
 *
 * =====================================================
 */


async function queueExperienceDelivery(

  payload:{

    snapshotId:string;

    assetId:string;

    email?:string;

    phone?:string;

    shareUrl:string;

  }

){

  console.log(

    "[EXPERIENCE DELIVERY QUEUED]",

    payload

  );

}