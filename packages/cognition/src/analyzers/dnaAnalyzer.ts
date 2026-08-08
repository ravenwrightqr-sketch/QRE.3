/**
 * =====================================================
 * QRE EXPERIENCE DNA ANALYZER
 * =====================================================
 *
 * ROLE:
 * Analyzer
 *
 * LAYER:
 * Experience Understanding
 *
 * RESPONSIBILITY:
 * Analyze human meaning signals and convert them
 * into a creative experience fingerprint.
 *
 * INPUT:
 * - Intent Understanding
 * - Emotion Understanding
 * - World Understanding
 * - Human prompt signals
 *
 * OUTPUT:
 * DNAUnderstanding
 *
 * THIS FILE DOES:
 * ✓ Detect creative traits
 * ✓ Detect emotional style patterns
 * ✓ Detect narrative qualities
 * ✓ Produce experience DNA traits
 *
 * THIS FILE DOES NOT:
 * ✗ Execute experiences
 * ✗ Build flows
 * ✗ Control runtime
 * ✗ Access database
 * ✗ Generate assets
 *
 * =====================================================
 */

import type {
  DNAUnderstanding,
  EmotionUnderstanding,
  WorldUnderstanding
} from "@qre/contracts";

import type {
  ExperienceIntent
} from "@qre/contracts";



type DNAAnalyzerInput = {

  prompt?: string;

  intent: ExperienceIntent[];

  emotions: EmotionUnderstanding;

  world: WorldUnderstanding;

};





const dnaSignals: Record<string, string[]> = {


  cinematic: [
    "wonder",
    "memory",
    "story",
    "film",
    "photo",
    "scene",
    "moment"
  ],


  reflection: [
    "memory_world",
    "nostalgia",
    "legacy",
    "tribute"
  ],


  exploration: [
    "discover",
    "explore",
    "quest",
    "adventure"
  ],


  ritual: [
    "celebrate",
    "ceremony",
    "milestone"
  ],


  rebellious: [
    "dark",
    "gothic",
    "cyber",
    "punk",
    "underground"
  ]

};






export function analyzeDNA(

 input: DNAAnalyzerInput

): DNAUnderstanding {



const traits =
new Set<string>();



//
// EVERY EXPERIENCE HAS ADAPTIVE DNA
//

traits.add(
  "adaptive"
);





const combinedContext =
JSON.stringify(input)
.toLowerCase();





//
// SIGNAL ANALYSIS
//

for(
 const [
  trait,
  signals
 ] of Object.entries(dnaSignals)
){


if(
 signals.some(
  signal =>
   combinedContext.includes(signal)
 )
){

 traits.add(
  trait
 );

}


}







//
// WORLD-BASED CREATIVE DNA
//

for(
 const domain of input.world.domains
){


switch(domain){


case "memory_world":

 traits.add(
  "emotional"
 );

 traits.add(
  "reflection"
 );

 break;



case "relationship_world":

 traits.add(
  "human_connection"
 );

 break;



case "discovery_world":

 traits.add(
  "exploration"
 );

 break;



case "commerce_world":

 traits.add(
  "trust"
 );

 break;



case "culture_world":

 traits.add(
  "expressive"
 );

 break;



}



}







//
// EMOTION-BASED DNA
//

for(
 const emotion of input.emotions.emotions
){


switch(emotion){


case "wonder":

 traits.add(
  "mysterious"
 );

 break;



case "nostalgia":

 traits.add(
  "reflective"
 );

 break;



case "love":

 traits.add(
  "human_connection"
 );

 break;



case "joy":

 traits.add(
  "playful"
 );

 break;



}



}








//
// INTENT-BASED DNA
//

for(
 const intent of input.intent
){


switch(intent){


case "discover":

 traits.add(
  "exploration"
 );

 break;



case "celebrate":

 traits.add(
  "ritual"
 );

 break;



case "remember":

 traits.add(
  "memory_driven"
 );

 break;



case "connect":

 traits.add(
  "social"
 );

 break;



}



}






//
// DIRECT CREATIVE STYLE SIGNALS
//

if(
 input.prompt &&
 /dark|gothic|cyber/i.test(
  input.prompt
 )
){

traits.add(
 "rebellious"
);

}






return {


 traits:[
  ...traits
 ]


};


}