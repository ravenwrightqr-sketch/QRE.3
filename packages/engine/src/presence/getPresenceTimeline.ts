import type {
  PresenceRepository,
} from "../repositories/index.js";



export async function getPresenceTimeline(
  assetId:string,
  presenceRepo:PresenceRepository
){


  const points =
    await presenceRepo.getPresenceTimeline(
      assetId
    );



  return points.map((p:any) => ({

    sessionId:
      p.sessionId ?? null,

    lat:
      p.lat,

    lng:
      p.lng,

    accuracy:
      p.accuracy ?? null,

    timestamp:
      p.createdAt,

  }));

}