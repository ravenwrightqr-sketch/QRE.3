import type { Moment } from "@qre/contracts";

export type PaymentResult = {
  url: string;
};

export function createPaymentLink(
  action: Moment
): PaymentResult {

  if(action.type !== "action"){
    throw new Error(
      "Invalid moment type"
    );
  }


  const url =
    typeof action.meta?.url === "string"
      ? action.meta.url
      : null;


  if(!url){

    throw new Error(
      "Missing payment url in meta"
    );

  }


  return {
    url,
  };

}