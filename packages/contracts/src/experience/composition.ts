/**
 * =====================================================
 * QRE EXPERIENCE COMPOSITION CONTRACT
 * =====================================================
 *
 * Blueprint
 *      ↓
 * Composition
 *      ↓
 * Cinematic Scenes
 *
 * The director layer.
 *
 * Defines:
 *
 * - emotional pacing
 * - experience arc
 * - scene order
 * - sensory direction
 * - audience interaction
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {
  ExperienceJourney,
} from "./genome.js";


import type {
  ExperienceMoment,
} from "./moment.js";



export type CompositionPhase =

 | "arrival"
 | "discovery"
 | "tension"
 | "reveal"
 | "connection"
 | "transformation"
 | "return";




export type EmotionalBeat = {

 emotion:string;

 intensity:number;

 reason:string;

};




export type ExperienceBeat = {


 id:string;


 phase:CompositionPhase;


 title:string;


 description:string;



 sourceMoment?:ExperienceMoment;



 emotions:EmotionalBeat[];



 duration:number;



 sensoryDirection?: {


 visual?:string[];


 audio?:string[];


 atmosphere?:string[];


 };



 interaction?:{


 enabled:boolean;


 type?:

 "choice"
 |
 "scan"
 |
 "share"
 |
 "memory_capture"
 |
 "reaction";


 };

};


export type ExperienceComposition = {

 title:string;

 journey:ExperienceJourney[];

 beats:ExperienceBeat[];

 pacing:

 "slow"
 |
 "medium"
 |
 "fast";


 atmosphere:string[];

 audience:string[];

 metadata?:Record<string,unknown>;

};