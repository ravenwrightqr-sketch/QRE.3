import type {

 Hypothesis

} from "./hypothesisTypes.js";



export function createHypothesis(

 concept:string

):Hypothesis {


 return {

  statement:

   `${concept} may reveal a deeper relationship between connected systems.`,


  sourceConcept:concept,


  assumptions:[

   "patterns can transfer between systems",

   "relationships can create new meaning"

  ],


  predictions:[

   "similar structures may appear across domains"

  ],


  confidence:0.7


 };


}