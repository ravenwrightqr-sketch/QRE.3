/**
 * =====================================================
 * QRE EXPERIENCE GENESIS BUILDER
 * =====================================================
 *
 * Experience Blueprint
 *        ↓
 * Genesis
 *
 * Gives a composed experience its first living state.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO PLAYER LOGIC
 *
 * =====================================================
 */


import type {

  ExperienceBlueprint,
  ExperienceGenesis,

} from "@qre/contracts";







export function buildExperienceGenesis(

  blueprint: ExperienceBlueprint

): ExperienceGenesis {



  if(
    !blueprint
  ){

    throw new Error(
      "Cannot birth experience without blueprint"
    );

  }






  return {


    /**
     * Unique birth identity
     */
    genesisId:

      crypto.randomUUID(),




    /**
     * Source blueprint
     */
    blueprint,






    /**
     * First moment position
     *
     * Genesis begins at origin.
     */
    currentMoment:

      0,






    /**
     * Birth state
     */
    state:

      "born",






    /**
     * Experience has not unfolded yet
     */
    progression:

      0,






    /**
     * Captured fragments
     */
    moments:

      [],



  };


}







export const genesisBuilder =

  buildExperienceGenesis;