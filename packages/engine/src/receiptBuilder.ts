import { nanoid } from "nanoid";

import type {
  ServiceReceipt,
} from "@qre/contracts";


export function buildServiceReceipt(
  input:{
    asset:any;
    sessionId:string;
    moments:any[];
  }
): ServiceReceipt {


  const id =
    nanoid(12);



  const locationMoment =
    input.moments.find(
      (m)=>m.type === "location"
    );



  return {


    id,


    assetId:
      input.asset.id,


    sessionId:
      input.sessionId,



    type:
      "service",



    title:
      `${input.asset.slug} Service Receipt`,



    summary:
      `Completed ${input.moments.length} service steps.`,



    completedAt:
      new Date().toISOString(),



    location:

      locationMoment?.meta

      ? {

          lat:
            locationMoment.meta.lat,

          lng:
            locationMoment.meta.lng,

          label:
            locationMoment.meta.label,

        }

      : undefined,



    metadata:{

      steps:
        input.moments.length,


      shareUrl:
        `/receipt/${id}`,

    },


  };

}