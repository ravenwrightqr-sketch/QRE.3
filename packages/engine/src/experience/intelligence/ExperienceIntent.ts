import { ExperienceGoal, ExperienceIndustry } from "@qre/contracts";

export type ExperienceIntent = {

  industry: ExperienceIndustry;

  purpose:
    ExperienceGoal;

  emotionalNeed:
    string[];

  audience:
    string[];

  desiredFeeling:
    string[];

  behavior:
    string[];

};