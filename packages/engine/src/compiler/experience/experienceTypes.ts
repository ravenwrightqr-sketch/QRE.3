/**
 * =====================================================
 * EXPERIENCE BLUEPRINT CONTRACT
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Experience Blueprint
 *
 * This is the bridge between intelligence
 * and runtime creation.
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */


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



export interface ExperienceBlueprint {


  title:string;


  world:string;


  dna:string[];


  emotions:string[];


  pacing:string;


  scenes:ExperienceScene[];


}