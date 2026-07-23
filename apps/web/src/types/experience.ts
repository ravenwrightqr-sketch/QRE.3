import type {
  CinematicScene,
} from "@qre/contracts";


export type CompiledExperience = {

  genome:any;

  world:any;

  blueprint:any;

  flowSteps:any[];

  moments:any[];

  cinematicScenes:CinematicScene[];

  model:any;

  title:string;

  estimatedDuration:number;

  momentCount:number;

};