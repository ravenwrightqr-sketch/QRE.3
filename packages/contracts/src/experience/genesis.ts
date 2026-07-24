/**
 * =====================================================
 * QRE EXPERIENCE GENESIS CONTRACT
 * =====================================================
 *
 * Experience Blueprint
 *        ↓
 * Genesis
 *        ↓
 * Living Experience
 *
 * This is the birth-state of an experience.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO PLAYER LOGIC
 *
 * =====================================================
 */


import type {
  ExperienceBlueprint,
} from "./blueprint.js";



export type GenesisState =

  | "born"
  | "awakened"
  | "paused"
  | "completed";





export interface ExperienceGenesis {


  /**
   * Unique experience birth identity
   */
  genesisId:string;



  /**
   * Blueprint source
   */
  blueprint:
    ExperienceBlueprint;



  /**
   * Current moment
   */
   currentMoment:number;



  /**
   * Life state
   */
  state:
    GenesisState;



  /**
   * Completion percentage
   */
  progression:number;



  /**
   * Captured experience fragments
   */
  moments:string[];


}