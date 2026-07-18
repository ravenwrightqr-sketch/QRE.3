import { db } from "@qre/db";

import type {
  GeoMemoryRepository,
} from "@qre/engine";


export function createGeoMemoryRepository():GeoMemoryRepository {

  return {


    async findGeoProof(assetId){

      return db.geoProof.findMany({

        where:{
          assetId,
        },

        orderBy:{
          createdAt:"asc",
        },

      });

    },


    async createMemorySnapshot(input){

      return db.memorySnapshot.create({

        data:{

          assetId:
            input.assetId,

          sessionId:
            input.sessionId ?? null,

          scanWeight:
            input.scanWeight,

          rewardScore:
            input.rewardScore,

          confidence:
            input.confidence,

          dominantLayer:
            input.dominantLayer,

          dropOffPoints:
            input.data as any,

        },

        select:{
          id:true,
        },

      });

    },


  };

}