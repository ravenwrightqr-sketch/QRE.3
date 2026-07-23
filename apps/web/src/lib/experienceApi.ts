import {
  apiPost,
} from "./api";

import type {
  Experience,
} from "@qre/contracts";


type ExperienceIntent = {
  prompt: string;
};


export async function compileExperience(
  intent: ExperienceIntent
): Promise<Experience> {


  const result =
    await apiPost(
      "/experience/compile",
      {
        prompt:intent.prompt,
      }
    );


  if(!result?.experience){

    throw new Error(
      "Invalid compiler response"
    );

  }


  return result.experience as Experience;

}