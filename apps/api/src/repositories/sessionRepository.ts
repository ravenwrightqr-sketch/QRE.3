import { db } from "@qre/db";

import type {
  SessionRepository,
} from "@qre/engine";


export function createSessionRepository(): SessionRepository {

  return {

    async create(
      input
    ){

      return await db.scanSession.create({

        data:{

          assetId:
            input.assetId,

          flowId:
            input.flowId ?? null,

          stepIndex:0,

          status:"active",

        },

        select:{

          id:true,

        },

      });

    },


    async update(
      id,
      data
    ){

      await db.scanSession.update({

        where:{
          id,
        },

        data,

      });

    },

  };

}