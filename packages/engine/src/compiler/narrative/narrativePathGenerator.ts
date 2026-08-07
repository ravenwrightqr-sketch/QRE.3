/**
 * =====================================================
 * QRE NARRATIVE PATH GENERATOR
 * =====================================================
 *
 * Creates a narrative possibility space.
 *
 * NOT:
 *
 * ❌ templates
 * ❌ predefined stories
 * ❌ chapters
 * ❌ fixed journeys
 *
 *
 * IS:
 *
 * ✅ narrative search space
 * ✅ emotional possibility generation
 * ✅ meaning-driven sequencing
 * ✅ adaptive story evolution
 * ✅ world-aware path exploration
 *
 *
 * Pipeline:
 *
 * Cognitive Meaning
 *        ↓
 * Experience Signals
 *        ↓
 * Narrative State Graph
 *        ↓
 * World Physics
 *        ↓
 * Narrative Possibilities
 *        ↓
 * Path Evaluation
 *        ↓
 * Selected Experience Journey
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint
} from "@qre/contracts";


import type {
  NarrativeIntent
} from "./narrativeIntentEngine.js";


import type {
  NarrativeStateGraph
} from "./narrativeStateGraph.js";




export interface NarrativePath {


  states:string[];


  emotions:string[];


  meaning:string;


  resonance:number;


}





export interface NarrativePathSet {


  paths:NarrativePath[];


}






function calculateResonance(

 states:string[],

 emotions:string[],

 intent:NarrativeIntent,

 world:ExperienceWorld

):number {



const movement =

states.length * .06;



const emotionalDepth =

emotions.length * .05;



const worldDepth =

(
 world.worldLaws.length
 +
 world.signature.emotional.length
 +
 world.journey.length
)
*
.02;




return Math.min(

1,

intent.narrativeGravity
+
movement
+
emotionalDepth
+
worldDepth

);


}









function createWorldMeaning(

 intent:NarrativeIntent,

 world:ExperienceWorld,

 states:string[]

):string {


const worldName =

world.worldIdentity.name
||
"experience world";



const law =

world.worldLaws[0]?.principle
||
"meaning evolves through experience";



return (

`${worldName} follows the purpose: ${intent.purpose} ` +

`The journey moves through ${states.join(", ")}. ` +

`Its guiding principle is ${law}.`

);


}









function createGeneratedPath(


 graph:NarrativeStateGraph,


 intent:NarrativeIntent,


 world:ExperienceWorld


):NarrativePath {



const states =

graph.states.map(

state =>

state.state

);





const emotions =

graph.states.map(

state =>

state.emotion

);





return {


states,


emotions,



meaning:

createWorldMeaning(

 intent,

 world,

 states

),



resonance:

calculateResonance(

 states,

 emotions,

 intent,

 world

)



};


}









function createAlternativePath(


 graph:NarrativeStateGraph,


 intent:NarrativeIntent,


 world:ExperienceWorld,


 offset:number


):NarrativePath {



const rotatedStates =

[

 ...graph.states.slice(offset),

 ...graph.states.slice(0, offset)

];




const states =

rotatedStates.map(

state =>

state.state

);





const emotions =

rotatedStates.map(

state =>

state.emotion

);





return {


states,


emotions,



meaning:

`${world.worldIdentity.name} explores an alternate path where ${states.join(", ")} reshape the experience.`,



resonance:

calculateResonance(

 states,

 emotions,

 intent,

 world

)
-
(offset * .03)



};


}









export function generateNarrativePaths(


 intent:NarrativeIntent,


 graph:NarrativeStateGraph,


 genome:ExperienceGenome,


 world:ExperienceWorld,


 blueprint:ExperienceBlueprint


):NarrativePathSet {



const paths:NarrativePath[] = [];






/*

Primary world-aligned path

*/


paths.push(

createGeneratedPath(

 graph,

 intent,

 world

)

);








/*

Alternative cognitive traversals.

These are not stories.

They are alternate emotional realities.

*/


for(

let i = 1;

i < Math.min(graph.states.length,5);

i++

){


paths.push(

createAlternativePath(

 graph,

 intent,

 world,

 i

)

);


}







/*

Future evolution path.

Allows world memory

to influence possible futures.

*/


if(

world.evolution?.nextPossibleStates?.length

){


paths.push({

states:

[

...graph.states.map(

state => state.state

),

...world.evolution.nextPossibleStates

],


emotions:

world.signature.emotional,


meaning:

`${world.worldIdentity.name} evolves beyond the current moment into future possibilities.`,


resonance:

Math.min(

1,

intent.narrativeGravity + .15

)



});


}







return {


paths


};


}