import type {

 Attention

} from "./types.js";



export function attention(

 signals:string[]

):Attention {



 const selected =

 signals.slice(0,2);



 return {


  signals,


  selected,


  priority:

   selected.length / signals.length,



  reason:

   "Selected signals with highest immediate relevance."


 };


}