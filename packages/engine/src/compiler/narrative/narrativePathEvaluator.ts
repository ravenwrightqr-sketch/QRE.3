/**
 * =====================================================
 * QRE NARRATIVE PATH EVALUATOR
 * =====================================================
 *
 * Cognitive evaluation layer.
 *
 * Converts possible narratives into ranked
 * experience realities.
 *
 *
 * NOT:
 *
 * ❌ story writer
 * ❌ template selector
 * ❌ fixed ranking
 *
 *
 * IS:
 *
 * ✅ emotional reasoning
 * ✅ meaning alignment
 * ✅ transformation analysis
 * ✅ memory prediction
 * ✅ novelty evaluation
 * ✅ world coherence
 * ✅ blueprint coherence
 * ✅ adaptive selection
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint
} from "@qre/contracts";


import type {
  NarrativePath
} from "./narrativePathGenerator.js";





export interface EvaluatedNarrativePath {


  path:NarrativePath;


  score:number;


  reasoning:string[];


}







export interface NarrativeEvaluation {


  selected:EvaluatedNarrativePath;


  alternatives:EvaluatedNarrativePath[];


}








function calculateEmotionAlignment(

 path:NarrativePath,

 genome:ExperienceGenome

):number {



const emotions =

genome.emotions ?? [];




const matches =

path.emotions.filter(

emotion =>

emotions.includes(emotion)

).length;




return Math.min(

1,

.35 +

(
matches /
Math.max(
 path.emotions.length,
 1
)

)

);


}









function calculateTransformationStrength(

path:NarrativePath

):number {



const uniqueStates =

new Set(

path.states

).size;



const movement =

uniqueStates /

Math.max(

path.states.length,

1

);





return Math.min(

1,

.4 +

movement * .6

);


}











function calculateMemoryPotential(

path:NarrativePath

):number {



const anchors = [

"memory",

"belonging",

"return",

"legacy",

"connection",

"transformation"

];




const matches =

path.states.filter(

state =>

anchors.includes(

state.toLowerCase()

)

).length;





return Math.min(

1,

.35 +

matches * .15

);


}











function calculateNovelty(

path:NarrativePath

):number {



const uniqueness =

new Set(

path.states

).size;



return Math.min(

1,

.45 +

uniqueness * .1

);


}











function calculateBlueprintAlignment(

 path:NarrativePath,

 blueprint:ExperienceBlueprint

):number {



const text =

JSON.stringify(

 blueprint

)

.toLowerCase();





const matches =

path.states.filter(

state =>

text.includes(

state.toLowerCase()

)

).length;





return Math.min(

1,

.5 +

matches * .1

);


}











function calculateWorldAlignment(

path:NarrativePath,

world:ExperienceWorld

):number {



let score = .4;





const semanticText =

[

...world.signature.semantic,

...world.signature.emotional,

...world.themes,

...world.journey,

...world.atoms

]

.map(

item =>

item.toLowerCase()

);







for(

const state of path.states

){


if(

semanticText.includes(

state.toLowerCase()

)

){

score += .08;

}


}







if(

world.transformation

){


const transformationText =

JSON.stringify(

world.transformation

)

.toLowerCase();





for(

const state of path.states

){


if(

transformationText.includes(

state.toLowerCase()

)

){

score += .05;

}


}


}






return Math.min(

1,

score

);


}











function calculateEvolutionPotential(

path:NarrativePath,

world:ExperienceWorld

):number {



if(

!world.evolution

){

return .5;

}






const futureStates =

world.evolution.nextPossibleStates ?? [];





const matches =

path.states.filter(

state =>

futureStates.includes(

state

)

).length;






return Math.min(

1,

.5 +

matches * .15

);


}











export function evaluateNarrativePaths(


paths:NarrativePath[],


genome:ExperienceGenome,


world:ExperienceWorld,


blueprint:ExperienceBlueprint


):NarrativeEvaluation {







const evaluated =


paths.map(

path => {




const emotion =

calculateEmotionAlignment(

path,

genome

);






const transformation =

calculateTransformationStrength(

path

);






const memory =

calculateMemoryPotential(

path

);






const novelty =

calculateNovelty(

path

);






const worldAlignment =

calculateWorldAlignment(

path,

world

);






const blueprintAlignment =

calculateBlueprintAlignment(

path,

blueprint

);






const evolution =

calculateEvolutionPotential(

path,

world

);








const score =


(

path.resonance * .15

+

emotion * .18

+

transformation * .18

+

memory * .15

+

worldAlignment * .15

+

blueprintAlignment * .10

+

novelty * .04

+

evolution * .05

);








return {



path,


score,



reasoning:[



`Emotion alignment: ${emotion.toFixed(2)}`,



`Transformation strength: ${transformation.toFixed(2)}`,



`Memory potential: ${memory.toFixed(2)}`,



`World coherence: ${worldAlignment.toFixed(2)}`,



`Blueprint coherence: ${blueprintAlignment.toFixed(2)}`,



`Novelty: ${novelty.toFixed(2)}`,



`Evolution potential: ${evolution.toFixed(2)}`



]


};




}

);









const sorted =

[...evaluated].sort(

(a,b)=>

b.score - a.score

);









return {


selected:

sorted[0],




alternatives:

sorted.slice(1)


};


}