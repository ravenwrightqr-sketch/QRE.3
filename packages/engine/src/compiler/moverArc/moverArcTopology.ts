/**
 * =====================================================
 * QRE MOVER ARC TOPOLOGY
 * =====================================================
 *
 * Transformation Field Intelligence.
 *
 * MoverArc:
 * "What movement exists?"
 *
 * MoverTopology:
 * "What paths have gravity?"
 *
 *
 * Converts transformation movement into a weighted
 * possibility field.
 *
 * Discovers:
 *
 * - attraction between states
 * - resistance between states
 * - emotional gravity
 * - narrative potential
 * - dominant transformation paths
 *
 *
 * NO DATABASE.
 * NO RUNTIME.
 * NO EXECUTION.
 *
 * =====================================================
 */


import type {
  MoverArc,
  MoverTopology,
  MoverConnection
} from "@qre/contracts";





function clamp(

 value:number

){

 return Math.max(

  0,

  Math.min(

   1,

   value

  )

 );

}






function calculateAttraction(

 from:string,

 to:string

):number {


 const growthWords = [

  "growth",

  "awakening",

  "transformation",

  "legacy",

  "connection",

  "discovery"

 ];



 const combined =

  `${from} ${to}`

   .toLowerCase();



 const matches =

  growthWords.filter(

   word =>

    combined.includes(word)

  ).length;



 return clamp(

  .4 +

  matches * .1

 );


}







function calculateResistance(

 from:string,

 to:string

):number {


 const conflictWords = [

  "loss",

  "fear",

  "unknown",

  "challenge",

  "conflict",

  "change"

 ];



 const combined =

  `${from} ${to}`

   .toLowerCase();



 const matches =

  conflictWords.filter(

   word =>

    combined.includes(word)

  ).length;



 return clamp(

  matches * .15

 );


}







function createConnections(

 arc:MoverArc

):MoverConnection[] {


 const connections:MoverConnection[] = [];




 for(

  let i = 0;

  i < arc.nodes.length - 1;

  i++

 ){


  const current =

   arc.nodes[i];


  const next =

   arc.nodes[i + 1];





  const attraction =

   calculateAttraction(

    current.label,

    next.label

   );




  const resistance =

   calculateResistance(

    current.label,

    next.label

   );





  connections.push({

   from:

    current.id,


   to:

    next.id,


   attraction,


   resistance,


   emotionalGravity:

    current.emotionalWeight,


   narrativePotential:

    clamp(

     (

      attraction +

      arc.transformationStrength

     )

     /

     2

    )


  });



 }



 return connections;

}









function findDominantPath(

 arc:MoverArc,

 connections:MoverConnection[]

):string[] {


 if(

  !connections.length

 ){

  return [];

 }



 const path:string[] = [];




 const first =

  arc.nodes.find(

   node =>

    node.id === connections[0].from

  );



 if(first){

  path.push(

   first.label

  );

 }



 for(

  const connection of connections

 ){


  const node =

   arc.nodes.find(

    item =>

     item.id === connection.to

   );



  if(node){

   path.push(

    node.label

   );

  }


 }



 return path;

}









export function buildMoverTopology(

 arc:MoverArc

):MoverTopology {



 const connections =

  createConnections(

   arc

  );



 const dominantPath =

  findDominantPath(

   arc,

   connections

  );



 const transformationDensity =

  connections.length

   ?

   connections.reduce(

    (

     sum,

     item

    ) =>

     sum +

     item.narrativePotential,

    0

   )

   /

   connections.length


   :

   0;





 return {


  nodes:

   arc.nodes,



  connections,



  dominantPath,



  transformationDensity:

   clamp(

    transformationDensity

   )



 };


}