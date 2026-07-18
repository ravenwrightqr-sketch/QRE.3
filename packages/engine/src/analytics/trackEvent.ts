import type {
  AnalyticsEventType,
} from "@qre/contracts";

import type {
  AnalyticsRepository,
} from "../repositories/index.js";



export function mapAnalyticsEventType(

  type:AnalyticsEventType

):AnalyticsEventType {


  switch(type){


    case "SCAN":

    case "SESSION_START":

    case "SESSION_END":


    case "FLOW_START":

    case "FLOW_STEP":

    case "FLOW_COMPLETE":

    case "FLOW_ABANDON":

    case "FLOW_TRIGGERED":

    case "FLOW_POLICY_APPLIED":


    case "AI_MEMORY_USED":

    case "AI_DECISION":

    case "MEMORY_APPLIED":


    case "GEO_MARK":

    case "CHECK_IN":

    case "CHECK_OUT":


    case "PRESENCE_JOIN":

    case "PRESENCE_LEAVE":


    case "CTA_CLICK":

    case "WEBSITE_CLICK":

    case "SOCIAL_CLICK":

    case "REDIRECT":

    case "TEASER_VIEW":


    case "PAYMENT_REQUIRED":

    case "PAYMENT_STARTED":

    case "PAYMENT_COMPLETED":


    case "CLAIM_STARTED":

    case "CLAIM_COMPLETED":


    case "TIP_STARTED":

    case "TIP_COMPLETED":


    case "UNLOCK":

    case "ERROR":

      return type;


    default:{

      const exhaustiveCheck:never = type;

      throw new Error(
        `Unsupported analytics event type: ${exhaustiveCheck}`
      );

    }

  }

}





export async function trackEvent(

  repo:AnalyticsRepository,

  input:{

    assetId:string;

    sessionId?:string;

    flowId?:string;

    stepIndex?:number;

    type:AnalyticsEventType;

    meta?:Record<string,unknown>;

  }

){


  return repo.trackEvent({

    assetId:
      input.assetId,


    sessionId:
      input.sessionId ?? null,


    flowId:
      input.flowId ?? null,


    stepIndex:
      input.stepIndex ?? null,


    type:
      mapAnalyticsEventType(
        input.type
      ),


    meta:
      input.meta ?? {},

  });


}