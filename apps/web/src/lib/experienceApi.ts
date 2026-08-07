import {
  apiPost,
} from "./api";

import type {
  ExperienceBlueprint
} from "@qre/contracts";

type ExperienceIntent = {
  prompt:string;
};

export async function compileExperience(
  intent:ExperienceIntent
):Promise<ExperienceBlueprint>{


  const result =

    await apiPost(

      "/experience/compile",

      {
        prompt:intent.prompt
      }

    );



  if(!result?.blueprint){


    throw new Error(

      "Invalid compiler response"

    );


  }



  return result.blueprint as ExperienceBlueprint;




}