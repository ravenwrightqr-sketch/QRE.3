import type { ExperienceAtom } from "../atoms/atomTypes.js";


export type ExperiencePatternType =
  | "service"
  | "memory"
  | "business"
  | "product"
  | "event"
  | "generic";


export type ExperiencePattern = {

  type:
    ExperiencePatternType;


  atoms:
    ExperienceAtom[];


  description:
    string;

};