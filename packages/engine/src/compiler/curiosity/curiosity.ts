import type {

 Curiosity

} from "./types.js";



export function curiosity(

 surprise:string,

 importance:number

):Curiosity {



 return {


  trigger:surprise,


  importance,


  question:

   `Why does this pattern exist: ${surprise}?`,



  exploration:

   "Search connected domains for additional evidence."


 };


}