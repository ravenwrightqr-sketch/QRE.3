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
const inquiry = createInquiry(

 `What deeper relationship exists inside ${input.narrative}?`

);



 const future =

 generateFuture(

  evolution

 );




 const evaluation =

 evaluateExperience(

  future,

  evolution

 );

return {

 scenes,

 states,

 memories,

 resonance,

 evolution,

 future,

 evaluation,

 inquiry

};


}