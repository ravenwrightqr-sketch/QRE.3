import type {
  ExperienceIndustry
} from "./industry.js";

import type {
  ExperienceGoal
} from "./goal.js";

import type {
  ExperienceTone
} from "./tone.js";

import type {
  ExperienceMoment
} from "./moment.js";


export type ExperienceModel = {

  id?: string;


  title:string;


  description:string;


  industry:
    ExperienceIndustry;


  goal:
    ExperienceGoal;


  tone:
    readonly ExperienceTone[];


  moments:
    ExperienceMoment[];


  metadata?: {

    creator?:string;

    category?:string;

    tags?:string[];

  };


};