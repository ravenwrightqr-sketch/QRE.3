/**
 * =====================================================
 * QRE EXPERIENCE LIFECYCLE CONTRACT
 * =====================================================
 *
 * Tracks how meaningful entities evolve.
 *
 * Anything can have a lifecycle:
 *
 * person
 * pet
 * object
 * place
 * product
 * organization
 *
 * =====================================================
 */


export type LifecycleStage =

 | "origin"

 | "creation"

 | "acquisition"

 | "relationship"

 | "growth"

 | "transformation"

 | "legacy";




export interface LifecycleEvent {


 stage:LifecycleStage;


 description:string;


 timestamp?:string;


 location?:string;


 emotionalImpact?:number;


 significance:number;


}





export interface ExperienceLifecycle {


 currentStage:LifecycleStage;


 events:LifecycleEvent[];


 milestones:string[];


 futurePossibilities:string[];


}