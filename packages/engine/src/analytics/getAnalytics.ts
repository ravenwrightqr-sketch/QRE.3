import type {
  AnalyticsRepository,
} from "../repositories/index.js";



export async function getRecentActivity(

  assetId:string,

  repo:AnalyticsRepository,

  limit = 20

){


  return repo.findEvents({

    assetId,

    limit,

  });


}





export async function getFunnel(

  assetId:string,

  repo:AnalyticsRepository

){


  const map =

    await repo.countByType(

      assetId

    );



  return {

    scan:
      map.SCAN ?? 0,


    flowStart:
      map.FLOW_START ?? 0,


    flowStep:
      map.FLOW_STEP ?? 0,


    flowComplete:
      map.FLOW_COMPLETE ?? 0,


    errors:
      map.ERROR ?? 0,

  };


}