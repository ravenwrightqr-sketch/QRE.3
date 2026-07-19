/**
 * =====================================================
 * QRE VALUE INTELLIGENCE ENGINE
 * =====================================================
 *
 * Experience
 *      ↓
 * Signals
 *      ↓
 * Value Analysis
 *      ↓
 * Business Insight
 *
 * Responsibilities:
 *
 * - Measure experience value
 * - Identify strengths
 * - Identify opportunities
 * - Generate recommendations
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * Intelligence recommends.
 * Runtime decides.
 *
 * =====================================================
 */



export type ValueSignal = {


  completionRate:number;


  engagementRate:number;


  repeatRate:number;


  rewardRate:number;


  shareRate:number;


};







export type ValueInsight = {


  id:string;


  score:number;


  strengths:string[];


  opportunities:string[];


  recommendations:string[];


};








function clamp(

 value:number

){

  return Math.max(

    0,

    Math.min(

      value,

      1

    )

  );

}









/**
 * =====================================================
 * ANALYZE EXPERIENCE VALUE
 * =====================================================
 */


export function analyzeExperienceValue(

 signals:ValueSignal

):ValueInsight {



  const score =

    clamp(

      (

        signals.completionRate *

        .30

      )

      +

      (

        signals.engagementRate *

        .25

      )

      +

      (

        signals.repeatRate *

        .30

      )

      +

      (

        signals.rewardRate *

        .10

      )

      +

      (

        signals.shareRate *

        .05

      )

    );







  const strengths:string[] = [];


  const opportunities:string[] = [];


  const recommendations:string[] = [];







  if(signals.repeatRate >= .7){


    strengths.push(

      "Strong repeat engagement detected."

    );


  } else {


    opportunities.push(

      "Increase reasons for customers to return."

    );


    recommendations.push(

      "Add memory, reward, or follow-up moments."

    );


  }







  if(signals.completionRate >= .8){


    strengths.push(

      "Experience flow completion is healthy."

    );


  } else {


    opportunities.push(

      "Users are leaving before completion."

    );


    recommendations.push(

      "Improve opening moments and reduce friction."

    );


  }








  if(signals.shareRate >= .5){


    strengths.push(

      "Experience has viral potential."

    );


  } else {


    recommendations.push(

      "Create more shareable emotional moments."

    );


  }








  return {


    id:

      crypto.randomUUID(),



    score,



    strengths,



    opportunities,



    recommendations,


  };


}