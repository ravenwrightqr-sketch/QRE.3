import type {
  ExperienceMoment,
} from "@qre/contracts";

import {
  executeAction,
} from "./actionExecutor";


export async function runScanRuntime(
  moments: ExperienceMoment[],
  setCurrent: (
    m: ExperienceMoment | null
  ) => void
) {

  const sorted =
    [...moments].sort(
      (a,b)=>a.order-b.order
    );


  for(
    const moment of sorted
  ){

    setCurrent(moment);


    // timing layer
    await new Promise(
      (r)=>setTimeout(r,800)
    );


    // action components
    if(
      moment.component === "cta" ||
      moment.component === "payment"
    ){

      executeAction(moment);

    }

  }

}