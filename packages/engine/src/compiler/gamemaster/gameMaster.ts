import type {
  GameMasterResult,
} from "./types.js";

import type {
  Cognition
} from "@qre/contracts";

import {
  createInquiry,
} from "../origin/inquiry/inquiry.js";


import {
  understandExperience,
} from "../understanding/ExperienceUnderstandingKernel.js";

import {
  runCompilerBrain,
} from "../compilerBrain.js";

import {
  think
} from "../cognition/cognition.js";



export function gameMaster(
  input:string
):GameMasterResult {


  /*
   * HUMAN INTENTION
   */

  const cognition =
    think(input);



  /*
   * QUESTION GENERATION
   */

  const inquiry =
    createInquiry(
      cognition.thought
    );



  /*
   * UNDERSTAND THE HUMAN
   */

  const understanding =
    understandExperience(
      input
    );

  /*
   * EXPERIENCE STRUCTURE
   */
   const brain =
  runCompilerBrain(
    input
  );

   const compiled =
  brain.compiled;


  return {


    input,


    cognition,


    inquiry,


    understanding,

   genome:
  compiled.genome,
    

    blueprint:
  compiled.blueprint,


    confidence:
      cognition.confidence


  };

}