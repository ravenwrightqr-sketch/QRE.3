import type { ExperienceIndustry } from "./industry.js";
import type { ExperienceGoal } from "./goal.js";
import type { ExperienceTone } from "./tone.js";
import type { ExperienceType } from "./experienceType.js";
import type { ExperienceMoment } from "./moment.js";
import type { ExperienceEntities } from "./entityExtractor.js";


export type ExperienceBlueprint = {

  title: string;

  industry: ExperienceIndustry;

  type: ExperienceType;

  goal: ExperienceGoal;

  tone: readonly ExperienceTone[];

  moments: ExperienceMoment[];

  entities: ExperienceEntities;

};