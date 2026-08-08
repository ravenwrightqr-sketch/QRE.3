import { nanoid } from "nanoid";

import type {
  ServiceReceipt,
  ExperienceMoment,
} from "@qre/contracts";


type ServiceReceiptAsset = {

  id:string;

  slug:string;

};



type ServiceReceiptInput = {

  asset:ServiceReceiptAsset;

  sessionId:string;

  moments:ExperienceMoment[];

};



function resolveLocationPayload(
  payload:Record<string, unknown>
){

  return {

    lat:
      typeof payload.lat === "number"
        ? payload.lat
        : undefined,


    lng:
      typeof payload.lng === "number"
        ? payload.lng
        : undefined,


    label:
      typeof payload.label === "string"
        ? payload.label
        : undefined,

  };

}



function findLocationMoment(
  moments:ExperienceMoment[]
){

  return moments.find(
    (moment)=>

      moment.type === "location" ||

      moment.type === "arrival"

  );

}




export function buildServiceReceipt(
  input:ServiceReceiptInput
):ServiceReceipt {


  const id =
    nanoid(12);



  const locationMoment =
    findLocationMoment(
      input.moments
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

      locationMoment

        ? resolveLocationPayload(
            locationMoment.payload
          )

        : undefined,



    metadata:{


      steps:
        input.moments.length,


      shareUrl:

        `/receipt/${id}`,

    },


  };


}