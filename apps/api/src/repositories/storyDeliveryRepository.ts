import { db } from "@qre/db";

import type {
  StoryDeliveryRepository,
} from "@qre/engine";



export function createStoryDeliveryRepository(): StoryDeliveryRepository {

  return {


    async findAsset(assetId) {

      return db.asset.findUnique({

        where: {
          id: assetId,
        },

        select: {

          id: true,

          accountId: true,

        },

      });

    },



    async findExistingStory(input) {

      return db.memorySnapshot.findFirst({

        where: {

          assetId:
            input.assetId,

          sessionId:
            input.sessionId,

        },

        select: {

          id: true,

        },

      });

    },
    async createStorySnapshot(input) {

  const payload = JSON.parse(
    JSON.stringify({
      moments:
        input.moments,

      geoStory:
        input.geoStory,

      cinematicScenes:
        input.cinematicScenes,
    })
  );


  return db.memorySnapshot.create({

    data: {

      assetId:
        input.assetId,


      sessionId:
        input.sessionId,


      dropOffPoints:
        payload,


      scanWeight:
        1,


      flowEngagementWeight:
        1,


      completionWeight:
        0,


      ctaClickWeight:
        0,


      rewardScore:
        0,


      confidence:
        0,


      dominantLayer:
        "cinematic",

    },


    select: {

      id:true,

    },

  });

},


    

  };

}