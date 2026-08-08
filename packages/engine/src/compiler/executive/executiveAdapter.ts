import type {
 CognitiveEvolutionState
} from "@qre/contracts";


import type {
 ExecutiveInput
} from "./types.js";



export function buildExecutiveInput(

 cognition:CognitiveEvolutionState

):ExecutiveInput {


return {


 curiosity:
  cognition.energy.curiosity,


 confidence:
  cognition.confidence,


 surprise:
  cognition.emergence?.length
   ?
   .8
   :
   .2,


 continuity:
  cognition.stability,


 novelty:
  cognition.novelty,


 stability:
  cognition.stability,


 contradictions:
  cognition.contradictions.length / 10,


 emotionalResonance:
  cognition.energy.resonance ?? 0,


 unresolvedQuestions:
  cognition.questions?.length ?? 0,


 emergenceSignals:
  cognition.emergence?.length ?? 0,


 complexity:
  cognition.hypotheses.length +
  cognition.predictions.length,


 uncertainty:
  cognition.uncertainty?.length ?? 0,


 memoryPressure:
  cognition.memoryTrace?.length ?? 0,


 userValue:
  cognition.goals
   ?.reduce(
    (a,g)=>a+g.importance,
    0
   ) ?? 0,


 businessPotential:0,


 memoryImportance:
  cognition.energy.legacy,


 relationshipDepth:
  cognition.energy.belonging,


 urgency:
  cognition.failures?.length ?? 0


};


}