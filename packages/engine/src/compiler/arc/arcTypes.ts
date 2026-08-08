export type ExperiencePhase =
  | "arrival"
  | "curiosity"
  | "discovery"
  | "reveal"
  | "transformation"
  | "memory";
export interface ExperienceArc {

 phases:ExperiencePhase[];

 chapters:{
   title:string;
   purpose:string;
   emotion:string;
   reveal:string;
 }[];

 journeyQuestion:string;

 emotionalCurve:string[];

 peakMoment:string;

 transformation:{
   before:string;
   after:string;
 };

 memoryImprint:string;

 pacing:
 "slow"
 |
 "medium"
 |
 "fast";

 confidence:number;

}