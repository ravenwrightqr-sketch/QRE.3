import type {
 ExperienceGenome,
 ExperienceBlueprint,
} from "@qre/contracts";


import type {
 Cognition,
} from "../cognition/types.js";


import type {
 Inquiry,
} from "../origin/inquiry/types.js";

import type {
  ExperienceUnderstanding,
} from "../models/understandingTypes.js";



export interface GameMasterResult {


 input:string;


 cognition:Cognition;


 inquiry:Inquiry;


 understanding:
 ExperienceUnderstanding;


 genome:
 ExperienceGenome;


 blueprint:
 ExperienceBlueprint;


 confidence:number;


}