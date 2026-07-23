/**
 * =====================================================
 * QRE EXPERIENCE INTENT ANALYZER
 * =====================================================
 *
 * Responsibility:
 * Understand WHY a human wants an experience.
 *
 * Input:
 * Human creative prompt
 *
 * Output:
 * ExperienceIntent[]
 *
 * Answers:
 *
 * "What does the human want?"
 *
 *
 * This analyzer does NOT:
 *
 * - extract entities
 * - analyze emotions
 * - classify worlds
 * - create DNA
 * - build flows
 * - execute runtime
 * - access database
 *
 *
 * Pipeline:
 *
 * Prompt
 *   ↓
 * IntentAnalyzer
 *   ↓
 * Understanding Kernel
 *
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceIntent
} from "@qre/contracts";




type IntentRule = {

  intent: ExperienceIntent;

  signals: string[];

  weight: number;

};






const intentRules: IntentRule[] = [


  {
    intent:"remember",

    weight:1,

    signals:[

      "memory",
      "remember",
      "past",
      "history",
      "archive",
      "legacy",
      "childhood",
      "old photo",
      "timeline",
      "nostalgia",
      "tribute"

    ]

  },




  {
    intent:"celebrate",

    weight:1,

    signals:[

      "birthday",
      "wedding",
      "anniversary",
      "celebrate",
      "party",
      "milestone",
      "ceremony",
      "event"

    ]

  },




  {
    intent:"teach",

    weight:1,

    signals:[

      "learn",
      "teach",
      "guide",
      "education",
      "explain",
      "tutorial",
      "course",
      "lesson"

    ]

  },




  {
    intent:"sell",

    weight:1,

    signals:[

      "buy",
      "sell",
      "shop",
      "product",
      "offer",
      "customer",
      "brand",
      "business",
      "store"

    ]

  },




  {
    intent:"discover",

    weight:1,

    signals:[

      "explore",
      "discover",
      "secret",
      "hidden",
      "unknown",
      "quest",
      "adventure",
      "journey"

    ]

  },




  {
    intent:"reward",

    weight:1,

    signals:[

      "reward",
      "loyalty",
      "exclusive",
      "unlock",
      "vip",
      "member"

    ]

  },




  {
    intent:"protect",

    weight:1,

    signals:[

      "protect",
      "safety",
      "emergency",
      "lost",
      "medical",
      "secure"

    ]

  },




  {
    intent:"connect",

    weight:1,

    signals:[

      "family",
      "friend",
      "community",
      "relationship",
      "together",
      "share",
      "people"

    ]

  }


];









export function analyzeIntent(

  prompt:string

):ExperienceIntent[] {



const text =
prompt
.toLowerCase()
.trim();





if(!text){

 return [];

}






const scores =
new Map<ExperienceIntent,number>();







for(const rule of intentRules){



let score = 0;



for(const signal of rule.signals){



if(text.includes(signal)){

 score += rule.weight;

}


}





if(score){


scores.set(

 rule.intent,

 score

);


}


}









const ranked =

[
 ...scores.entries()

]

.sort(

(a,b)=>

 b[1] - a[1]

)

.map(

([intent])=>

 intent

);









/**
 * Unknown human intent.
 *
 * Default to discovery because
 * creative prompts without explicit
 * intent usually represent exploration.
 *
 */

if(!ranked.length){


return [

 "discover"

];


}







return ranked;


}