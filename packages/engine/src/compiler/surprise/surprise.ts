import type {

 Surprise

} from "./types.js";



export function surprise(

 prediction:string,

 observation:string

):Surprise {



 const mismatch =

 `Difference detected between "${prediction}" and "${observation}".`;



 return {


  prediction,


  observation,


  mismatch,


  intensity:.8,


  learningSignal:

   "Update the model using new evidence."


 };


}