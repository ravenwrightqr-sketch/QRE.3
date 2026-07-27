import type {

 BridgeInput,
 EmergentConcept

} from "./synthesisTypes.js";




export function synthesize(

 bridges:BridgeInput[]

):EmergentConcept {


 const domains =

 Array.from(

  new Set(

   bridges.flatMap(b => [

    b.fromDomain,

    b.toDomain

   ])

  )

 );



 const strength =

 bridges.reduce(

  (sum,b)=>sum+b.novelty,

  0

 ) / bridges.length;




 return {


  emergentConcept:

  "Connected systems preserve information through patterns, memory, and transformation.",



  contributingDomains:domains,



  sourceBridges:

   bridges.map(

    b=>b.bridgeStatement

   ),



  emergenceStrength:strength


 };

}