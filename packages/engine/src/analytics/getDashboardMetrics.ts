import type {
  AnalyticsRepository,
} from "../repositories/index.js";


export async function getDashboardMetrics(

  assetId:string,

  repo:AnalyticsRepository

){


  return repo.getDashboardMetrics(
    assetId
  );


}