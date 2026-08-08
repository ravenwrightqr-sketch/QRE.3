/**
 * =====================================================
 * QRE WORLD SYNTHESIS ENGINE
 * =====================================================
 *
 * Converts intelligence fields into world observations.
 *
 * NUVO:
 * possibility
 *
 * REVIK:
 * transformation
 *
 * KAIVO:
 * relationship
 *
 * ORION:
 * meaning gravity
 *
 * Output:
 *
 * WorldObservation[]
 *
 * NO DATABASE.
 * NO RUNTIME.
 *
 * =====================================================
 */
import type {

  NuvoField

} from "../nuvo/index.js";


import type {

  RevikField

} from "../revik/index.js";


import type {

  KaivoField

} from "../kaivo/index.js";


import type {

  OrionField

} from "../orion/index.js";


import type {
  WorldObservation
} from "@qre/contracts"







export function synthesizeWorld(

 nuvo:NuvoField,

 revik:RevikField,

 kaivo:KaivoField,

 orion:OrionField

):WorldObservation[] {


const observations:WorldObservation[] = [];

observations.push({

 concept:
  "possibility",

 domain:
  "creative",

 evidence:

  [

   ...nuvo.futureRealities.map(

    future => future.name

   ),

   ...nuvo.latentWorlds

  ],

 confidence:

  nuvo.resonance

});

observations.push({

 concept:
  "transformation",

 domain:
  "evolution",

 evidence:

  [

   ...revik.futureStates,

   ...revik.evolutionChains.map(

    chain =>

     chain.join(" → ")

   )

  ],

 confidence:

  revik.evolutionStrength

});

observations.push({

 concept:
  "relationship",

 domain:
  "meaning",

 evidence:

  [

   ...kaivo.resonanceNodes,

   ...kaivo.connections.map(

    connection =>

     `${connection.from} → ${connection.to}`

   )

  ],

 confidence:

  kaivo.coherence

});

observations.push({

 concept:

  orion.coreVector,


 domain:

  "purpose",


 evidence:

  [

   orion.synthesis,

   ...orion.dominantNodes

  ],


 confidence:

  orion.gravity

});

return observations;

}