/**
 * =====================================================
 * QRE CURIOSITY COGNITION PASS
 * =====================================================
 *
 * ROLE:
 *
 * Connects the executive cognition loop
 * with exploratory intelligence.
 *
 *
 * Curiosity discovers:
 *
 * - hidden opportunities
 * - missing relationships
 * - unanswered questions
 *
 *
 * It does not create the experience.
 *
 * It expands possibility space.
 *
 * =====================================================
 */


import type {
 CompilerMind
} from "@qre/contracts";


import {
 generateCuriosity
} from "../curiosity/index.js";




export function runCuriosityPass(

 mind:CompilerMind

):CompilerMind {



const state =
 mind.cognitionLoop!;



const curiosity =
 generateCuriosity(
  mind
 );



return {


 ...mind,


 cognitionLoop:{


  ...state,



  phase:

   "critique",



  curiosity,



  predictions:[


   ...state.predictions,



   ...curiosity.signals.map(
    signal => ({


     outcome:
      signal.discovery,


     probability:
      signal.strength,


     reason:
      signal.reason


    })
   )


  ],



  history:[


   ...state.history,


   "Curiosity pass completed"


  ],



  lastAction:

   "Expanded cognitive possibility space"


 }



};



}