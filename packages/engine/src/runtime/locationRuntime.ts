import {
  checkIn,
} from "../presence/checkIn.js";


import {
  buildMemorySnapshot,
} from "../geo/buildMemorySnapshot.js";


import type {
  FlowStep,
} from "@qre/contracts";



export async function runLocationStep(
  step: FlowStep,
  context:{
    assetId:string;
    sessionId:string;
    userId?:string;
    geo?:{
      lat:number;
      lng:number;
      accuracy?:number;
    };
  }
){


  const payload =
    step.payload as Record<string,unknown>;



  if(
    payload.geoMemory !== true
  ){

    return {
      skipped:true
    };

  }



  /**
   * 1.
   * Create presence proof
   */
  await checkIn({

    assetId:
      context.assetId,

    sessionId:
      context.sessionId,

    userId:
      context.userId,

    geo:
      context.geo,

  });



  /**
   * 2.
   * Return runtime result
   */
  return {

    type:"location",

    captured:true,

    timeline:true,

    snapshot:true,

  };


}