export type ExperienceSceneType =
  | "arrival"
  | "discovery"
  | "connection"
  | "reflection"
  | "transformation"
  | "memory"
  | "return";


export interface ExperienceScene {

  id:string;

  type:ExperienceSceneType;

  title:string;

  atmosphere:string;

  emotionalIntent:string;

  duration:number;

}