/**
 * =====================================================
 * QRE CONSOLIDATION COGNITION PASS
 * =====================================================
 *
 * ROLE:
 *
 * Converts important cognitive discoveries
 * into stable memory patterns.
 *
 *
 * Cognition:
 *
 * Discovery
 *      ↓
 * Evaluation
 *      ↓
 * Memory Candidate
 *      ↓
 * Consolidated Memory
 *
 *
 * =====================================================
 */


import type {
 CompilerMind
} from "@qre/contracts";


import {
 consolidateMemory
} from "../consolidation/index.js";




export function runConsolidationPass(

 mind:CompilerMind

):CompilerMind {



const state =
 mind.cognitionLoop!;



const candidate = {


 content:

  state.history.join(
   " | "
  ),


 emotionalWeight:

  state.energy.wonder
  +
  state.energy.belonging
  / 2,


 repetition:

  state.iteration / 10,


 futureInfluence:

  state.novelty



};



const memory =

 consolidateMemory(
  candidate
 );



return {


 ...mind,


 cognitionLoop:{


  ...state,


  phase:

   "complete",



  consolidatedMemory:

   memory,



  improvements:[


   ...(state.improvements ?? []),



   memory.reason



  ],



  history:[


   ...state.history,


   "Consolidation pass completed"



  ],



  lastAction:

   "Converted cognition into stable learning"



 }



};



}