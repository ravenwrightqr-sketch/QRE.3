import type {
  CompilerMind
} from "@qre/contracts";


import type {
 Curiosity
} from "./types.js";



export function generateCuriosity(

 mind:CompilerMind

):Curiosity {



 const signals = [];



 const themes =
  mind.genome.themes ?? [];



 for(const theme of themes){


  signals.push({

   discovery:
    `Explore deeper relationship around ${theme}`,


   strength:
    0.7,


   reason:
    "Theme indicates unexplored semantic potential."


  });


 }



 if(signals.length === 0){


  signals.push({

   discovery:
    "Search for hidden meaning relationships.",


   strength:
    0.5,


   reason:
    "Experience contains unexplored possibility space."


  });


 }



 return {

  signals

 };


}