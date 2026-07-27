import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint,
  ExperienceMoment,
  ExperienceModel,
} from "./index.js";

import type {
  FlowStep,
} from "../flow.js";

import type {
  CinematicScene,
} from "../cinematic.js";


export type CompiledExperience = {
   id:string;
  genome: ExperienceGenome;

  world: ExperienceWorld;

  blueprint: ExperienceBlueprint;

  flowSteps: FlowStep[];

  experienceMoments: ExperienceMoment[];

  cinematicScenes: CinematicScene[];

  model: ExperienceModel;

  title: string;

  estimatedDuration: number;

  momentCount: number;

};