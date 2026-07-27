import type {
  ExperienceMoment,
} from "@qre/contracts";



export type PaymentResult = {

  url:string;

};





export function createPaymentLink(

  moment:ExperienceMoment

):PaymentResult {



  if(
    moment.type !== "payment"
  ){

    throw new Error(
      "Invalid experience moment type"
    );

  }

   const url =
  moment.payload.interaction?.url;

  if(!url){

    throw new Error(
      "Missing payment url"
    );

  }


  return {

    url,

  };


}