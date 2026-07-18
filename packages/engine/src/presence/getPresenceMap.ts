import type {
  PresenceRepository,
} from "../repositories/index.js";



export async function getPresenceMap(
  assetId:string,
  presenceRepo:PresenceRepository
){


  const points =
    await presenceRepo.getPresenceMap(
      assetId
    );



  return points;

}