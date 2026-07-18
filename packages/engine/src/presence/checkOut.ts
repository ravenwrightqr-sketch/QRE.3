import { emitSpineEvent } from "../spine/eventSpine.js";

import type {
  PresenceRepository,
} from "../repositories/index.js";



export async function checkOut(
  sessionId:string,
  assetId:string,
  userId:string | undefined,
  presenceRepo:PresenceRepository
){


  const session =
    await presenceRepo.checkOut({

      sessionId,

      exitedAt:
        new Date(),

    });



  await emitSpineEvent({

    type:
      "CHECK_OUT",


    assetId,


    sessionId,


    userId,


  });



  return session;

}