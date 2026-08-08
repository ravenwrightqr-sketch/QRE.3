/**
 * =====================================================
 * QRE ORION FIELD
 * =====================================================
 *
 * Semantic Attractor Engine
 *
 * KAIVO
 *    ↓
 * ORION
 *
 * ORION discovers:
 *
 * - meaning gravity
 * - dominant semantic forces
 * - human tensions
 * - emerging direction
 *
 * It does not generate content.
 * It discovers where meaning wants to move.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO PLAYER
 *
 * =====================================================
 */
import type {
  CompilerMind,
  OrionField,
  KaivoField,
  MoverArc,
  MoverTopology,
} from "@qre/contracts";

export type {
  OrionField,
} from "@qre/contracts";



function rankSignals(

 nodes:string[] = []

):string[]{


 const frequency =
 new Map<string,number>();


 for(const node of nodes){


  frequency.set(

   node,

   (frequency.get(node) ?? 0) + 1

  );


 }



 return [

  ...frequency.entries()

 ]

 .sort(

  (a,b)=>

   b[1]-a[1]

 )

 .map(

  ([value])=>value

 );


}


function detectHumanNeed(

 nodes:string[]

):string {


 if(nodes.includes("memory") ||
    nodes.includes("legacy")){

  return "preserve meaningful existence";

 }


 if(nodes.includes("identity")){

  return "discover personal significance";

 }


 if(nodes.includes("connection") ||
    nodes.includes("community")){

  return "create belonging";

 }


 if(nodes.includes("discovery")){

  return "understand the unknown";

 }


 return "create deeper meaning";


}



function detectPurpose(

 nodes:string[]

):string {


 if(nodes.includes("legacy")){

  return "transform moments into lasting significance";

 }


 if(nodes.includes("memory")){

  return "turn experience into living memory";

 }


 if(nodes.includes("identity")){

  return "transform experience into self-understanding";

 }


 return "convert meaning into experience";


}

function detectArchetype(

 nodes:string[]

):string {


 if(nodes.includes("legacy")){

  return "meaning_preserver";

 }


 if(nodes.includes("identity")){

  return "identity_explorer";

 }


 if(nodes.includes("connection")){

  return "connection_creator";

 }


 if(nodes.includes("discovery")){

  return "discovery_engine";

 }


 return "experience_creator";

}

function analyzeMoverGravity(

 moverArc:MoverArc,

 moverTopology:MoverTopology

){

 return {

  transformationDirection:

   moverArc.dominantDirection,


  dominantTransformationPath:

   moverTopology.dominantPath,


  possibilityFieldStrength:

   moverTopology.transformationDensity

 };



}

export function awakenOrion(
  mind: CompilerMind
): OrionField {

  const kaivo = mind.kaivo;

  if (!kaivo) {
    throw new Error(
      "CompilerMind.kaivo must exist before awakenOrion()."
    );
  }


  const moverArc = mind.moverArc;

  if (!moverArc) {
    throw new Error(
      "CompilerMind.moverArc must exist before awakenOrion()."
    );
  }


  const moverTopology = mind.moverTopology;

  if (!moverTopology) {
    throw new Error(
      "CompilerMind.moverTopology must exist before awakenOrion()."
    );
  }



 const dominantNodes =

 rankSignals(

  kaivo.resonanceNodes

 );





 const coreVector =

 dominantNodes.length

 ?

 dominantNodes.join(
  " → "
 )

 :

 "emerging meaning";






 const humanNeed =

 detectHumanNeed(

  dominantNodes

 );






 const narrativePurpose =

 detectPurpose(

  dominantNodes

 );

 const experienceArchetype =

 detectArchetype(

  dominantNodes

 );
 const moverGravity =

 analyzeMoverGravity(

  moverArc,

  moverTopology

);

return {

  coreVector,


  dominantNodes,


  emotionalGravity:

   coreVector,


  humanNeed,


  narrativePurpose,


  experienceArchetype,


  creativeMission:

   `${experienceArchetype}: ${narrativePurpose}`,


  gravity:

   kaivo.coherence,


  transformationDirection:

   moverGravity.transformationDirection,


  dominantTransformationPath:

   moverGravity.dominantTransformationPath,


  possibilityFieldStrength:

   moverGravity.possibilityFieldStrength,


  synthesis:

   [

    coreVector,

    "→",

    humanNeed,

    "→",

    narrativePurpose,

    "→",

    moverGravity.dominantTransformationPath.join(
      " → "
    )

   ].join(" ")


};

}

export const orionField =

  awakenOrion;
