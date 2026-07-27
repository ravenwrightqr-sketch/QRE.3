import {
  apiPost,
} from "./api";

import type {
  CompiledExperience
} from "@qre/contracts";


type ExperienceIntent = {
  prompt:string;
};


export async function compileExperience(
 intent:ExperienceIntent
):Promise<CompiledExperience>{


 const result =
 await apiPost(
   "/experience/compile",
   {
     prompt:intent.prompt
   }
 );


 if(!result?.experience){

   throw new Error(
     "Invalid compiler response"
   );

 }


 return result.experience as CompiledExperience;

}