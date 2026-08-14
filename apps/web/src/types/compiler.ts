import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint,
  FlowStep,
  ExperienceMoment,
  CinematicScene,
  ExperienceModel,
} from "@qre/contracts";

export type ExperienceIntent = { prompt: string };

export type CompiledExperience = {
  genome: ExperienceGenome;
  world: ExperienceWorld;
  blueprint: ExperienceBlueprint;
  flowSteps: FlowStep[];
  moments: ExperienceMoment[];
  cinematicScenes: CinematicScene[];
  model: ExperienceModel;
  title: string;
  estimatedDuration: number;
  momentCount: number;
};
