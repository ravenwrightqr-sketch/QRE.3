import { aiInsightsEngine } from "../ai/aiInsightsEngine.js";

import type {
  AnalyticsEventType,
} from "@qre/contracts";


import type {
  AnalyticsRepository,
} from "../repositories/index.js";



type NormalizedAnalyticsEvent = {

  assetId:string;

  timestamp:Date;

  sessionId:string|null;

  type:AnalyticsEventType;

};





export async function getScanInsights(

  assetId:string,

  repo:AnalyticsRepository

){


  const events =

    await repo.findEvents({

      assetId,

      limit:100,

    });




  const normalized:

    NormalizedAnalyticsEvent[] =

      events.map((e:any)=>({

        assetId:e.assetId,

        timestamp:e.createdAt,

        sessionId:e.sessionId,

        type:e.type as AnalyticsEventType,

      }));




  return aiInsightsEngine(

    normalized

  );


}