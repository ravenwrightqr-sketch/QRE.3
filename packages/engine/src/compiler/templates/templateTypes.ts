import type {
  ExperienceIndustry,
  ExperienceGoal,
  ExperienceMomentType,
  ExperienceTone,
} from "@qre/contracts";



export type IndustryTemplate = {


  industry:
    ExperienceIndustry;



  defaultGoal:
    ExperienceGoal;



  preferredDNA:
    readonly ExperienceTone[];



  recommendedMoments:
    readonly ExperienceMomentType[];



  keywords?:
    readonly string[];



  experiences?:
    readonly string[];



  recommendedFeatures?:
    readonly string[];


};