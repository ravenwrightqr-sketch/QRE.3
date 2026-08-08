import type {

 ConceptInput,
 BridgeConnection

} from "./bridgeTypes.js";




function findSharedPatterns(

 a:ConceptInput,

 b:ConceptInput

):string[] {


 const patterns = new Set<string>();


 for(const propA of a.properties){

  for(const propB of b.properties){


   if(

    propA === propB ||

    propA.includes(propB) ||

    propB.includes(propA)

   ){

    patterns.add(propA);

   }


  }

 }


 return Array.from(patterns);

}






export function createBridge(

 a:ConceptInput,

 b:ConceptInput

):BridgeConnection {


 const sharedPatterns =

 findSharedPatterns(a,b);



 const novelty =

 sharedPatterns.length > 0

 ? 0.8

 : 0.4;



 return {


  from:a,


  to:b,


  sharedPatterns,



  bridgeStatement:

   `${a.name} and ${b.name} share patterns of ${

    sharedPatterns.join(", ")

   }.`,



  novelty,


  confidence:

   novelty * 0.9


 };


}