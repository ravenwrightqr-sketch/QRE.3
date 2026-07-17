import { db } from "@qre/db";
import { nanoid } from "nanoid";

import type {
  CinematicScene,
  GeoStory,
  Moment,
} from "@qre/contracts";


type StoryInput = {

  assetId:string;

  sessionId:string;

  userId?:string|null;

  /**
   * Future delivery target.
   *
   * Examples:
   *
   * customer phone
   * customer email
   * guest account
   *
   * Kept optional until delivery system exists.
   */
  recipient?:{

    email?:string;

    phone?:string;

  };


  moments:Moment[];

  geoStory:GeoStory|null;

  cinematicScenes:CinematicScene[];

};





export async function createStoryDelivery(
  input:StoryInput
){


  /**
   * =====================================================
   * 1. LOAD ASSET
   * =====================================================
   *
   * Delivery only requires asset existence.
   *
   * Ownership is handled elsewhere.
   *
   * Asset owner != story recipient.
   *
   */


  const asset =
    await db.asset.findUnique({

      where:{
        id:input.assetId,
      },

      select:{

        id:true,

        accountId:true,

      },

    });



  if(!asset){

    throw new Error(
      "Asset not found"
    );

  }





  /**
   * =====================================================
   * 2. DUPLICATE DELIVERY GUARD
   * =====================================================
   *
   * Prevent duplicate story creation
   * for the same scan session.
   *
   */


  const existingSnapshot =
    await db.memorySnapshot.findFirst({

      where:{

        assetId:
          input.assetId,

        sessionId:
          input.sessionId,

        dominantLayer:
          "story_delivery",

      },

      orderBy:{

        createdAt:
          "desc",

      },

    });



  if(existingSnapshot){

    return {

      storyId:
        existingSnapshot.id,


      shareUrl:
        `/share/${existingSnapshot.id}`,


      delivered:false,


      reason:
        "ALREADY_DELIVERED",

    };

  }





  /**
   * =====================================================
   * 3. NORMALIZE EXPERIENCE DATA
   * =====================================================
   */


  const safeGeoStory =
    input.geoStory
      ? JSON.parse(
          JSON.stringify(
            input.geoStory
          )
        )
      : null;




  const safeCinematicScenes =
    JSON.parse(

      JSON.stringify(

        input.cinematicScenes.map(
          scene => ({

            id:
              scene.id,

            type:
              scene.type,

            duration:
              scene.duration,

            moment:
              scene.moment,

          })

        )

      )

    );




  const safeMoments =
    JSON.parse(

      JSON.stringify(
        input.moments
      )

    );






  /**
   * =====================================================
   * 4. CREATE MEMORY SNAPSHOT
   * =====================================================
   */


  const storyId =
    nanoid(12);



  const snapshot =
    await db.memorySnapshot.create({

      data:{

        assetId:
          input.assetId,


        sessionId:
          input.sessionId,


        scanWeight:
          input.moments.length,


        flowEngagementWeight:
          1,


        completionWeight:
          1,


        ctaClickWeight:
          0,


        rewardScore:
          0,


        confidence:
          1,


        dominantLayer:
          "story_delivery",



        dropOffPoints:{

          storyId,


          moments:
            safeMoments,


          geoStory:
            safeGeoStory,


          cinematicScenes:
            safeCinematicScenes,


          status:
            "READY",

        },

      },

    });







  /**
   * =====================================================
   * 5. DELIVERY EVENT
   * =====================================================
   *
   * Future:
   *
   * ExperienceDelivery table
   * NotificationQueue
   * SMS provider
   * Email provider
   *
   *
   * Example:
   *
   * Dog groomer:
   * customer gets finished story.
   *
   * Realtor:
   * buyer gets property experience.
   *
   * Hotel:
   * guest gets stay recap.
   *
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





  /**
   * =====================================================
   * 6. RETURN
   * =====================================================
   */


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
 * This becomes:
 *
 * Resend
 * Twilio
 * Push Notifications
 *
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