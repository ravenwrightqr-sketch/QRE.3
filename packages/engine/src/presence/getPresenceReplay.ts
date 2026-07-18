import type {
  PresenceRepository,
} from "../repositories/index.js";



export async function getPresenceReplay(
  assetId:string,
  presenceRepo:PresenceRepository
){


  const points =
    await presenceRepo.getPresenceReplay(
      assetId
    );



  const sessions:Record<string, any[]> = {};



  for(const p of points as any[]){


    const sid =
      p.sessionId ?? "anonymous";



    if(!sessions[sid]){
      sessions[sid] = [];
    }



    sessions[sid].push({

      lat:
        p.lat,

      lng:
        p.lng,

      time:
        p.createdAt,

    });

  }



  return {

    sessions,

    totalSessions:
      Object.keys(sessions).length,

  };

}