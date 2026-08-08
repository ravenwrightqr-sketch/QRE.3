/**
 * =====================================================
 * QRE WORLD MODEL BUILDER
 * =====================================================
 *
 * Converts observations into a reality blueprint.
 *
 * Observation:
 * "What was detected?"
 *
 * World Model:
 * "What reality should emerge?"
 *
 * NO DATABASE.
 * NO RUNTIME.
 *
 * =====================================================
 */


import type {

  WorldObservation,
  WorldModel

} from "@qre/contracts"







function unique(

 values:string[]

){

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}









export function createWorldModel(

 observations:WorldObservation[]

):WorldModel {



const patterns = unique(

 observations.flatMap(

  observation => observation.evidence

 )

);






const concepts = unique(

 observations.map(

  observation => observation.concept

 )

);








return {



 observations,





 knownPatterns:

  patterns,





 uncertainty:[

  "future observations may refine current world interpretation"

 ],





 worldName:

  concepts.length

   ?

   `${concepts[0]} Reality`

   :

   "Emergent Experience World",





 worldType:

  observations.length

   ?

   observations[0].domain

   :

   "unknown",





 entities:

  [],





 rules:[


  {

   principle:
    "Meaning should guide experience.",


   effect:
    "Generated content follows discovered purpose.",


   reason:
    "Experiences become stronger when aligned with human intent."

  }


 ],





 atmosphere:{


  tone:

   patterns.slice(0,3),



  sensory:

   [],



  emotional:

   concepts


 },







 interactions:[


  {

   action:
    "explore",


   outcome:
    "discover deeper meaning",


   purpose:
    "create participant engagement"

  }


 ],





 purpose:

  concepts.length

   ?

   `Express ${concepts.join(", ")} through an immersive experience.`

   :

   "Transform an idea into a meaningful experience."



};



}