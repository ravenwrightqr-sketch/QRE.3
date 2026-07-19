/**
 * =====================================================
 * QRE COGNITION ADAPTATION ENGINE
 * =====================================================
 *
 * Reflection
 *      ↓
 * Adaptation
 *      ↓
 * Behavior Improvement Proposal
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  CognitiveInsight,
} from "./reflection.js";





export type AdaptationType =

  | "optimization"

  | "attention"

  | "warning"

  | "learning";







export type AdaptationProposal = {


  id:
    string;



  type:
    AdaptationType;



  change:
    string;



  reason:
    string;



  confidence:
    number;



  sourceInsightIds:
    string[];



  context?:
    Record<string, unknown>;

};









/**
 * =====================================================
 * ADAPT
 * =====================================================
 */


export function adapt(

  insights:readonly CognitiveInsight[]

):AdaptationProposal[] {



  const proposals:
    AdaptationProposal[] = [];






  for(const insight of insights){



    if(insight.confidence < 0.5){

      continue;

    }






    const event =

      insight.context?.event;






    let type:
      AdaptationType =
        "learning";



    let change =
      "Continue monitoring this pattern for future improvement.";







    if(typeof event === "string"){


      type =
        "optimization";



      change =
        `Optimize behavior around repeated event: ${event}.`;


    }







    proposals.push({



      id:

        crypto.randomUUID(),




      type,



      change,



      reason:

        insight.statement,



      confidence:

        insight.confidence,



      sourceInsightIds:[

        insight.id

      ],



      context:

        insight.context,



    });


  }







  return proposals;


}