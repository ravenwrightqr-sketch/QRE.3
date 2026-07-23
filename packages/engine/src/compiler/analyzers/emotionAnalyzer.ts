/**
 * =====================================================
 * QRE EXPERIENCE EMOTION ANALYZER
 * =====================================================
 *
 * Responsibility:
 *
 * Extract emotional signals from human language.
 *
 *
 * Input:
 *
 * Human Prompt
 *
 *
 * Output:
 *
 * EmotionUnderstanding
 *
 *
 * Determines:
 *
 * - emotional states
 * - atmosphere
 * - intensity
 *
 *
 * This analyzer does NOT:
 *
 * - create experiences
 * - generate creative direction
 * - build runtime states
 * - access database
 *
 *
 * Pipeline:
 *
 * Prompt
 *   ↓
 * EmotionAnalyzer
 *   ↓
 * Understanding Kernel
 *
 *
 * NO DATABASE
 * NO RUNTIME
 * =====================================================
 */



import type {

  EmotionUnderstanding

} from "../models/understandingTypes.js";









type EmotionRule = {

  emotion:string;

  signals:string[];

};









const emotionSignals:EmotionRule[] = [



{

emotion:"nostalgia",

signals:[

"memory",

"past",

"childhood",

"legacy",

"remember",

"history",

"old"

]

},



{

emotion:"wonder",

signals:[

"magic",

"amazing",

"universe",

"dream",

"discover",

"secret",

"mystery",

"unknown"

]

},



{

emotion:"love",

signals:[

"love",

"wedding",

"family",

"relationship",

"together"

]

},



{

emotion:"joy",

signals:[

"party",

"birthday",

"celebrate",

"fun",

"happy"

]

},



{

emotion:"trust",

signals:[

"brand",

"business",

"customer",

"safe",

"professional"

]

},



{

emotion:"excitement",

signals:[

"vip",

"exclusive",

"event",

"concert",

"festival",

"launch"

]

},



{

emotion:"fear",

signals:[

"danger",

"lost",

"emergency",

"dark",

"warning"

]

}



];









export function analyzeEmotion(

prompt:string

):EmotionUnderstanding {



const text =

prompt.toLowerCase();





const emotions = new Set<string>();









for(const rule of emotionSignals){


const matched =

rule.signals.some(

signal =>

text.includes(signal)

);



if(matched){

emotions.add(

rule.emotion

);

}


}









if(!emotions.size){

emotions.add(

"curiosity"

);

}









const resolved =

[

...emotions

];









return {


emotions:

resolved,



atmosphere:

[

...resolved,

"immersive"

],



intensity:

Math.min(

1,

resolved.length / 5

)



};



}