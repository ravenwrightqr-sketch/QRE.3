import type {
  Moment,
  ActionContext,
} from "@qre/contracts";


export type Action = Moment;


export async function runAction(
  action: Action,
  ctx: ActionContext
){

  switch(action.type){

    case "message":
      return {
        event:"message",
        text: action.text,
      };


    case "action":
      return {
        event:"action",
        text: action.text,
        url: action.meta?.url,
        label: action.meta?.label,
      };


    case "media":
      return {
        event:"media",
        url: action.meta?.url,
        meta: action.meta,
      };


    case "location":
      return {
        event:"location",
        text: action.meta?.text,
        meta: action.meta,
      };


    case "system":
      return {
        event:"system",
        text: action.text,
      };

default:
  throw new Error(
    "Unhandled runtime moment type"
  );
  

  }

}