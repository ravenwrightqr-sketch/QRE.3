/**
 * =====================================================
 * QRE COGNITION DECISION ENGINE
 * =====================================================
 *
 * Adaptation
 *      ↓
 * Decision
 *      ↓
 * Recommended Action
 *
 * Responsibilities:
 *
 * - Evaluate possible actions
 * - Preserve evidence-based decisions
 * - Track confidence
 * - Track risk
 * - Rank recommendations
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * This layer recommends.
 * Runtime decides.
 *
 * =====================================================
 */


import type {
  AdaptationProposal,
} from "./adaptation.js";





export type DecisionRisk =

  | "low"

  | "medium"

  | "high";





export type CognitiveDecision = {


  id:
    string;



  action:
    string;



  reason:
    string;



  confidence:
    number;



  risk:
    DecisionRisk;



  priority:
    number;



  expectedOutcome:
    string;



  sourceAdaptationIds:
    string[];



  context?:
    Record<string, unknown>;

};








function calculateRisk(

 confidence:number

):DecisionRisk {


  if(confidence >= .8){

    return "low";

  }


  if(confidence >= .5){

    return "medium";

  }


  return "high";

}









function calculatePriority(

 adaptation:AdaptationProposal

):number {


  let score =
    adaptation.confidence;



  if(adaptation.type === "optimization"){

    score += .2;

  }



  if(adaptation.type === "warning"){

    score += .3;

  }



  return Math.min(

    score,

    1

  );

}










/**
 * =====================================================
 * DECISION CREATION
 * =====================================================
 */


export function makeDecision(

  adaptations:readonly AdaptationProposal[]

):CognitiveDecision[] {



  return adaptations.map(

    adaptation => ({


      id:

        crypto.randomUUID(),



      action:

        adaptation.change,



      reason:

        adaptation.reason,



      confidence:

        adaptation.confidence,



      risk:

        calculateRisk(

          adaptation.confidence

        ),



      priority:

        calculatePriority(

          adaptation

        ),



      expectedOutcome:

        "Improve future experience decisions through learned patterns.",



      sourceAdaptationIds:[

        adaptation.id

      ],



      context:

        adaptation.context,



    })

  );


}









/**
 * =====================================================
 * BEST DECISION
 * =====================================================
 *
 * Selects highest priority recommendation.
 *
 * =====================================================
 */


export function chooseBestDecision(

 decisions:readonly CognitiveDecision[]

):CognitiveDecision | null {



  if(!decisions.length){

    return null;

  }



  return (

    [...decisions]

      .sort(

        (a,b)=>

          b.priority -

          a.priority

      )[0]

  );


}