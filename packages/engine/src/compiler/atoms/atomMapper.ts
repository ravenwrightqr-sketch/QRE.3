import type {
  ExperienceAtom,
} from "./atomTypes.js";

import type {
  ExperienceMomentType,
} from "@qre/contracts";



export function atomToMomentType(
  atom:ExperienceAtom
):ExperienceMomentType {


switch(atom.type){


case "arrival":

  return "arrival";



case "identity":

  return "profile";



case "location":

  return "location";



case "story":

  return "story";



case "media":

case "proof":

  return "photos";



case "activity":

  return "timeline";



case "completion":

  return "message";



case "reward":

  return "reward";



case "review":

  return "review";



case "share":

  return "social";



case "replay":

  return "replay";

case "education":

return "education";

case "followup":

  return "followup";

 case "product":

 return "product";


case "terpene":

 return "terpene_profile";

default:

  return "message";


  
}

}