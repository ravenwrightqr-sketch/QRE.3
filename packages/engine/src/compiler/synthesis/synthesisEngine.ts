/**
 * =====================================================
 * QRE SEMANTIC SYNTHESIS ENGINE
 * =====================================================
 *
 * Meaning A
 *       +
 * Meaning B
 *       ↓
 * Emergent Concept
 *
 *
 * Discovers new possibility from
 * relationships between domains.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO TEMPLATES
 *
 * =====================================================
 */


import type {

 BridgeInput,
 EmergentConcept

} from "./synthesisTypes.js";





function normalize(

 value:string

):string {


 return value

  .trim()

  .toLowerCase();


}





function buildEmergence(

 bridges:BridgeInput[]

):string {


 const statements =

  bridges

   .map(

    bridge =>

      bridge.bridgeStatement

   )

   .filter(Boolean);



 if(!statements.length){

  return "No emergent relationship detected.";

 }



 return statements.join(

  " + "

 );

}





function calculateStrength(

 bridges:BridgeInput[]

):number {


 if(!bridges.length){

  return 0;

 }



 const total =

 bridges.reduce(

  (sum,bridge)=>{


    const novelty =

      Math.max(

       0,

       Math.min(

        bridge.novelty,

        1

       )

      );


    return sum + novelty;


  },

  0

 );


 return total / bridges.length;

}





export function synthesize(

 bridges:BridgeInput[]

):EmergentConcept {


 if(!bridges.length){


  return {


   emergentConcept:

    "No semantic bridge available.",


   contributingDomains:[],


   sourceBridges:[],


   emergenceStrength:0


  };


 }




 const domains =

 Array.from(

  new Set(

   bridges.flatMap(

    bridge => [

     normalize(

      bridge.fromDomain

     ),


     normalize(

      bridge.toDomain

     )

    ]

   )

  )

 );





 return {


  emergentConcept:

   buildEmergence(

    bridges

   ),



  contributingDomains:

   domains,



  sourceBridges:

   bridges.map(

    bridge =>

     bridge.bridgeStatement

   ),



  emergenceStrength:

   calculateStrength(

    bridges

   )


 };


}