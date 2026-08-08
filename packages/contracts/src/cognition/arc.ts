/**
 * =====================================================
 * QRE EXPERIENCE ARC CONTRACT
 * =====================================================
 *
 * Meaning progression through an experience.
 *
 * Defines emotional movement.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * Engine systems create this artifact.
 *
 * =====================================================
 */


export type ExperiencePhase =
  | "arrival"
  | "curiosity"
  | "discovery"
  | "reveal"
  | "transformation"
  | "memory";



export interface ExperienceArc {


  phases:
    ExperiencePhase[];



  chapters:{

    title:string;

    purpose:string;

    emotion:string;

    reveal:string;

  }[];



  journeyQuestion:
    string;



  emotionalCurve:
    string[];



  peakMoment:
    string;



  transformation:{

    before:string;

    after:string;

  };



  memoryImprint:
    string;



  pacing:

    | "slow"
    | "medium"
    | "fast";



  confidence:
    number;

}