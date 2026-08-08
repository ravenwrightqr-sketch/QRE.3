import type {

 Surprise

} from "./types.js";





function calculateIntensity(

 prediction:string,

 observation:string

):number {


 const predictedWords =

 prediction

 .toLowerCase()

 .split(/\s+/);



 const observedWords =

 observation

 .toLowerCase()

 .split(/\s+/);



 const overlap =

 predictedWords.filter(

  word =>

   observedWords.includes(word)

 ).length;



 const maxLength =

 Math.max(

  predictedWords.length,

  observedWords.length

 );



 if(!maxLength){

  return 0;

 }



 return Number(

  (1 - overlap / maxLength)

  .toFixed(2)

 );

}





function createMismatch(

 prediction:string,

 observation:string

):string {


 return [

  "Prediction:",

  prediction,

  "Observation:",

  observation,

  "Semantic divergence detected."

 ].join("\n");


}





function createLearningSignal(

 intensity:number

):string {


 if(intensity > .75){

  return (

   "Core assumption failed. " +

   "Reevaluate the underlying meaning model."

  );

 }



 if(intensity > .4){

  return (

   "Partial mismatch detected. " +

   "Adjust interpretation using new context."

  );

 }



 return (

  "Minor variation detected. " +

  "Preserve current model with refinement."

 );

}





export function surprise(

 prediction:string,

 observation:string

):Surprise {


 if(!prediction || !observation){

  throw new Error(

   "Prediction and observation required."

  );

 }



 const intensity =

  calculateIntensity(

   prediction,

   observation

  );



 return {


  prediction,


  observation,


  mismatch:

   createMismatch(

    prediction,

    observation

   ),



  intensity,



  learningSignal:

   createLearningSignal(

    intensity

   )


 };


}