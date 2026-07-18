import type {
  AnalyticsRepository,
} from "../repositories/index.js";


/**
 * =========================
 * LIVE DASHBOARD METRICS
 * =========================
 */

export async function getAssetLiveMetrics(

  assetId:string,

  repo:AnalyticsRepository

) {


  const events =

    await repo.findEvents({

      assetId,

      limit:1000,

    });



  const scans =

    events.filter(
      (e:any)=>
        e.type === "SCAN"
    ).length;



  const errors =

    events.filter(
      (e:any)=>
        e.type === "ERROR"
    ).length;



  const flows =

    events.filter(
      (e:any)=>
        e.type === "FLOW_START"
    ).length;



  const completions =

    events.filter(
      (e:any)=>
        e.type === "FLOW_COMPLETE"
    ).length;




  return {

    scans,

    errors,

    flows,

    completions,


    conversionRate:

      scans > 0

        ? completions / scans

        : 0,

  };


}