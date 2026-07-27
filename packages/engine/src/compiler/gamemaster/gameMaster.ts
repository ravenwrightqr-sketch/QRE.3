import type {
  GameMasterResult,
} from "./types.js";


import {
  think,
} from "../cognition/cognition.js";

import type {
  ExperienceUnderstanding,
} from "../models/understandingTypes.js";
import {
  createInquiry,
} from "../origin/inquiry/inquiry.js";


import {
  understandExperience,
} from "../understanding/ExperienceUnderstandingKernel.js";


import {
  buildExperienceGenome,
} from "../semantic/genome/genomeBuilder.js";


import {
  compileExperience,
} from "../experience/experienceCompiler.js";




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
   * CREATIVE DNA
   */

  const genome =
  buildExperienceGenome(
    input
  );



  /*
   * EXPERIENCE STRUCTURE
   */

  const blueprint =
    compileExperience(
      genome
    );



  return {


    input,


    cognition,


    inquiry,


    understanding,


    genome,


    blueprint,


    confidence:
      cognition.confidence


  };

}