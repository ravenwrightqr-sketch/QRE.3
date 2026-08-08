/**
 * =====================================================
 * QRE NARRATIVE PATH SELECTOR
 * =====================================================
 *
 * Chooses the strongest possible emotional journey.
 *
 * NOT:
 *
 * ❌ fixed stories
 * ❌ templates
 * ❌ chapters
 *
 *
 * IS:
 *
 * ✅ narrative reasoning
 * ✅ emotional selection
 * ✅ experience intelligence
 * ✅ cognitive choice
 *
 *
 * Pipeline:
 *
 * Evaluated Narrative Paths
 *          ↓
 * Cognitive Selection
 *          ↓
 * Selected Journey
 *          ↓
 * Narrative Sequence
 *
 * =====================================================
 */



import type {
  NarrativePath
} from "./narrativePathGenerator.js";



import type {
  EvaluatedNarrativePath
} from "./narrativePathEvaluator.js";





export interface SelectedNarrativePath {


  path:NarrativePath;



  reason:string;



  confidence:number;



  reasoning:string[];



}







export interface NarrativeSelectorInput {


 evaluated:EvaluatedNarrativePath[];


}









function calculateConfidence(

 selected:EvaluatedNarrativePath,

 alternatives:EvaluatedNarrativePath[]

):number {


if(
 alternatives.length === 0
){

 return selected.score;

}



const second =

alternatives[0].score;



const separation =

selected.score - second;



return Math.min(

1,

selected.score + separation

);


}









export function selectNarrativePath(


input:NarrativeSelectorInput


):SelectedNarrativePath {





const ranked =


[...input.evaluated]

.sort(

(a,b)=>

b.score - a.score

);






const selected = ranked[0];





const alternatives =

ranked.slice(1);






return {


path:

selected.path,



reason:

"Selected because it creates the strongest emotional transformation with the highest cognitive alignment.",



confidence:

calculateConfidence(

 selected,

 alternatives

),



reasoning:

selected.reasoning



};



}