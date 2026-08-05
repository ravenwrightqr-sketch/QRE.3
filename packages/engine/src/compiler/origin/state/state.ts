import type {
    OriginCognitiveState
} from "@qre/contracts"

function semanticComplexity(

 input:string

):number{

 const words =

  input
   .trim()
   .split(/\s+/)
   .filter(Boolean);


 return Math.min(

  1,

  words.length / 40

 );


}



function initialCuriosity(

 complexity:number

):number{


 return Math.min(

  1,

  0.35 + complexity * 0.5

 );


}



function initialConfidence(

 complexity:number

):number{


 return Math.max(

  0.2,

  0.8 - complexity * 0.35

 );


}



export function createState(

 input:string

):OriginCognitiveState{


 if(!input.trim()){

  throw new Error(

   "Cannot initialize cognition without input."

  );

 }


 const complexity =

  semanticComplexity(

   input

  );


 return {

  id:

   crypto.randomUUID(),


  input,


  focus:

   [],


  observations:

   [],


  thoughts:

   [],


  questions:

   [],


  hypotheses:

   [],


  simulations:

   [],


  beliefs:

   [],


  memories:

   [],


  discoveries:

   [],


  goals:

   [],


  history:[

   `cognition initialized (${input.length} characters)`,

   `semantic complexity ${complexity.toFixed(2)}`

  ],


  confidence:

   initialConfidence(

    complexity

   ),


  curiosity:

   initialCuriosity(

    complexity

   ),


  energy:

   1,


  timestamp:

   Date.now()

 };

}