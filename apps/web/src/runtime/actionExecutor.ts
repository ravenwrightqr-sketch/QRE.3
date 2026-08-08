import type {
  ExperienceMoment,
} from "@qre/contracts";


export function executeAction(
  moment: ExperienceMoment
) {

  if(
    moment.component !== "cta" &&
    moment.component !== "payment"
  ){
    return;
  }


  const action =
    moment.payload.action;


  const url =
    moment.payload.url;



  switch(action){


    case "redirect":

      if(
        typeof url === "string"
      ){
        window.location.href = url;
      }

      break;



    case "payment":

      if(
        typeof url === "string"
      ){
        window.location.href = url;
      }

      break;



    case "unlock":

      console.log(
        "UNLOCK",
        moment.payload
      );

      break;



    default:

      console.warn(
        "Unhandled experience action",
        {
          action,
          moment,
        }
      );

  }

}