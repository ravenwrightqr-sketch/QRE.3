/**
 * =====================================================
 * QRE COGNITIVE EXECUTIVE FIELD ENGINE
 * =====================================================
 *
 * ROLE:
 *
 * Metacognitive arbitration layer.
 *
 * The Executive does not create intelligence.
 *
 * It allocates cognitive direction.
 *
 * =====================================================
 */


import type {

 ExecutiveInput,
 ExecutiveDecision

} from "./types.js";




interface CognitivePressure {


 action:

 ExecutiveDecision["action"];


 score:number;


 reason:string;


 signal:string;


 depth:number;


}





export function decide(

 state:ExecutiveInput

):ExecutiveDecision {



const pressures:CognitivePressure[]=[];




function addPressure(

 action:ExecutiveDecision["action"],

 score:number,

 reason:string,

 signal:string,

 depth:number

){


 pressures.push({

  action,

  score,

  reason,

  signal,

  depth

 });


}





/**
 * Surprise
 */
addPressure(

 "investigate",

 state.surprise * .95,

 "Unexpected information requires causal investigation.",

 "surprise",

 3

);





/**
 * Contradictions
 */
addPressure(

 "criticize",

 state.contradictions * .92,

 "Contradictions require evaluation.",

 "contradiction",

 3

);





/**
 * Uncertainty
 */
addPressure(

 "simulate_future",

 (1 - state.confidence) * .90,

 "Low confidence requires future simulation.",

 "uncertainty",

 2

);





/**
 * Curiosity
 */
addPressure(

 "explore",

 state.curiosity * .85,

 "Novel possibilities deserve exploration.",

 "curiosity",

 2

);





/**
 * Memory preservation
 */
addPressure(

 "preserve_memory",

 (1 - state.continuity) * .80,

 "Continuity requires memory reinforcement.",

 "memory",

 2

);





/**
 * Complexity reflection
 */
addPressure(

 "reflect",

 Math.min(

 1,

 state.complexity / 300

 )

 * .75,

 "Complexity requires deeper semantic reflection.",

 "complexity",

 3

);





/**
 * Emotional relationship preservation
 */
addPressure(

 "strengthen_relationship",

 state.emotionalResonance * .70,

 "Strong emotional signals require relationship preservation.",

 "emotion",

 2

);





/**
 * Select strongest pressure
 */
pressures.sort(

 (a,b)=>

 b.score-a.score

);



const winner = pressures[0];





if(

 !winner ||

 winner.score < .15

){


return {


 action:"continue",


 reason:"Cognitive field stable.",


 priority:.5,


 depth:1,


 confidence:.75,


 strategicValue:.5,


 goalAlignment:.5,


 evolutionImpact:.5,


 signals:[

 "stable-state"

 ]


};


}






return {


 action:winner.action,


 reason:winner.reason,


 priority:Math.min(

 1,

 winner.score

 ),



 depth:winner.depth,



 confidence:Math.min(

 1,

 .5 + winner.score / 2

 ),



 strategicValue:

 Math.min(

 1,

 winner.score * 1.1

 ),



 goalAlignment:

 state.novelty * .5 +

 state.curiosity * .5,



 evolutionImpact:

 state.emergenceSignals > 0

 ?

 .8

 :

 .4,



 signals:

 pressures

 .filter(

  p =>

  p.score > .2

 )

 .map(

  p =>

  p.signal

 )



};



}