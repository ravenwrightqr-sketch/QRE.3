/**
 * =====================================================
 * ORIGIN CORE ENGINE
 * =====================================================
 *
 * Unified cognitive experience pipeline.
 *
 * =====================================================
 */

import {

 createInquiry

} from "./inquiry/index.js";


import {

 createScenes,
 evolveScene,
 createMemory,
 analyzeResonance,
 evolveMeaning,
 generateFuture,
 evaluateExperience

} from "./index.js";





export function runOrigin(

 input:any

){


 const scenes =

 createScenes(

  input.narrative

 );





 const states =

 scenes.map(

  evolveScene

 );





 const memories =

 states.map(

  createMemory

 );





 const resonance =

 analyzeResonance(

  memories[0],

  input.patterns ?? []

 );





 const evolution =

 evolveMeaning(

  resonance

 );





 const inquiry =

 createInquiry(

  `What deeper relationship exists inside ${input.narrative}?`

 );





 const future =

 generateFuture(

  evolution

 );

const evaluation =

 evaluateExperience(

  {
   concepts:[

    ...future.intent,

    ...future.purpose

   ],

   patterns:[

    ...future.direction,

    ...future.emergingPossibilities

   ]

  },

  {
   concepts:[

    ...evolution.previousTrajectory

   ],

   patterns:[

    ...evolution.adaptationDrivers

   ]

  }

 );

return {

 scenes,

 states,

 memories,

 resonance,


 evolution: {

  emerged:

   evolution.emergingTrajectory,


  preserved:

   evolution.previousTrajectory,


  transformed:

   evolution.adaptationDrivers,


  evolutionStrength:

   evolution.evolutionForce

 },


 future: {

 concepts:[

  ...future.intent,

  ...future.purpose

 ],

 patterns:[

  ...future.direction,

  ...future.emergingPossibilities

 ]

},

 evaluation,


 inquiry

};



}