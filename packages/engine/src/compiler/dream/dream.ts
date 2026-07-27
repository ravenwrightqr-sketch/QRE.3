import type {

 Dream

} from "./types.js";



export function dream(

 concepts:string[]

):Dream {


 const associations = concepts.map(

  concept =>

   `${concept} contains transferable patterns`

 );



 return {


  inputs:concepts,


  associations,


  possibility:

   `${concepts.join(
    " + "
   )} may represent a deeper shared structure.`,



  novelty:.8,


  confidence:.5


 };


}