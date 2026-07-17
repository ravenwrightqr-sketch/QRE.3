import { ExperienceGoal } from "./goal.js";
import { ExperienceEntities, ExperienceIndustry, ExperienceTone } from "./index.js";

export type ExperienceContext = {

 prompt:string;

 entities:ExperienceEntities;


 assetCategory?:string;


 audience?:string;


 purpose?:string;


 desiredOutcome?:string;


 suggestedIndustry?:ExperienceIndustry;


 suggestedGoal?:ExperienceGoal;


 suggestedTone?:ExperienceTone[];


 constraints?:string[];

};