import type {

 WorldObservation,
 WorldModel

} from "./worldTypes.js";




export function createWorldModel(

 observations:WorldObservation[]

):WorldModel {


 const patterns = observations.flatMap(

  o => o.evidence

 );


 return {


  observations,


  knownPatterns:patterns,


  uncertainty:[

   "future observations may change current interpretation"

  ]


 };


}