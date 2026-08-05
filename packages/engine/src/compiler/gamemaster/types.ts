import type {
 ExperienceGenome,
 ExperienceBlueprint,
} from "@qre/contracts";


import type {
 Cognition,
} from "@qre/contracts"


import type {
 Inquiry,
} from "@qre/contracts"

import type {
  ExperienceUnderstanding,
} from "@qre/contracts"



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