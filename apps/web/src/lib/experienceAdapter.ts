import type {
  ExperienceBlueprint,
  ExperienceMoment,
  ExperienceEntities,
  ExperienceType,
  ExperienceGoal,
  ExperienceIndustry,
} from "@qre/contracts";

import type {
  ExperienceBlock,
} from "../components/experience/ExperienceBlueprint";



/**
 * =====================================================
 *
 * EXPERIENCE ADAPTER
 *
 * Dashboard Blocks
 *        ↓
 * Experience Blueprint
 *
 * Frontend Translation Layer
 *
 * Pure transformation only.
 *
 * =====================================================
 */



const emptyEntities: ExperienceEntities = {

  people: [],

  places: [],

  organizations: [],

  dates: [],

  times: [],

  events: [],

  products: [],

  urls: [],

  phones: [],

  emails: [],

  keywords: [],

};





type BlueprintOptions = {

  title?: string;

  industry?: ExperienceIndustry;

  type?: ExperienceType;

  goal?: ExperienceGoal;

};







export function blocksToBlueprint(

  blocks: ExperienceBlock[],

  options?: BlueprintOptions

): ExperienceBlueprint {



  return {


    title:
      options?.title ??
      "Untitled Experience",



    industry:
      options?.industry ??
      "generic",



    type:
      options?.type ??
      "journey",



    goal:
      options?.goal ??
      "storytelling",



    tone:[

      "cinematic",

    ],



    entities:
      emptyEntities,



    moments:

      blocks.map(

        (
          block,
          index
        ): ExperienceMoment => ({



          type:
            normalizeMomentType(
              block.type
            ),



          component:
            resolveComponent(
              block.type
            ),



          title:
            block.title,



          subtitle:
            block.text,



          description:
            block.text,



          editable:
            true,



          demo:
            false,



          order:
            index,



          payload:{


            text:
              block.text,


            timer:
              block.timer,


            ...block.config,


          },


        })

      ),


  };

}







function normalizeMomentType(

  type:string

): ExperienceMoment["type"] {



  switch(type){


    case "memory":

    case "location":

    case "reward":

    case "payment":

    case "redirect":

    case "message":

      return type as ExperienceMoment["type"];


    default:

      return "story";


  }


}








function resolveComponent(

  type:string

): ExperienceMoment["component"] {


  switch(type){



    case "location":

      return "map";



    case "place":

      return "geo_memory";



    case "memory":

      return "memory";



    case "reward":

      return "reward";



    case "payment":

      return "payment";



    case "redirect":

    case "link":

      return "cta";



    default:

      return "story";


  }

}