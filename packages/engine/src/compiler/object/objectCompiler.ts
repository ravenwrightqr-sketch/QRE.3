/**
 * =====================================================
 * QRE OBJECT GENOME COMPILER
 * =====================================================
 *
 * Universal Experience Compiler
 *
 * Human Reality
 *      ↓
 * Signals
 *      ↓
 * Events
 *      ↓
 * Moments
 *      ↓
 * Memory
 *      ↓
 * Legacy
 *
 * NO TEMPLATES
 * NO INDUSTRY LOGIC
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {

 ObjectCompilationInput

} from "./objectTypes.js";


import type {

 ObjectGenome,
 ObjectMoment,
 ObjectRelationship

} from "@qre/contracts";


import {

 compileLifecycle

} from "../lifecycle/lifecycleCompiler.js";




function unique(

 values:string[] = []

):string[]{


 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}





function normalizeText(

 text:string

):string{


 return text

 .replace(/\n/g," ")

 .trim();

}







function extractIdentity(

 input:ObjectCompilationInput

):string | undefined {


 return (

  input.entities?.objects?.[0]

  ??

  input.entities?.products?.[0]

  ??

  input.entities?.creatures?.[0]

  ??

  input.entities?.people?.[0]

 );


}







function extractAttributes(

 input:ObjectCompilationInput

):string[]{


 return unique([


  ...(input.meaning?.desiredFeeling ?? []),


  ...(input.meaning?.symbols ?? []),


  ...(input.meaning?.themes ?? []),


  ...(input.emotions?.emotions ?? []),


  ...(input.dna?.traits ?? [])


 ]);

}








function extractSentences(

 text:string

):string[]{


 return normalizeText(text)

 .split(/[.!?]/)

 .map(

  value => value.trim()

 )

 .filter(

  value => value.length > 0

 );


}







function inferStateChange(

 text:string

):{

 before:string;

 after:string;

}


{


 const lower = text.toLowerCase();



 if(

 lower.includes("from")

 &&

 lower.includes("to")

 ){


  return {

   before:"previous_state",

   after:"changed_state"

  };

 }



 return {

  before:"initial_condition",

  after:"new_condition"

 };


}









function extractMomentTitle(

 text:string

):string{


 const words =

 text

 .split(" ")

 .slice(0,7);



 return words.join(" ");

}









function buildMoments(

 input:ObjectCompilationInput

):ObjectMoment[]{


 const moments:ObjectMoment[]=[];



 const sentences =

 extractSentences(

  input.prompt

 );



 for(

  const sentence of sentences

 ){



  const change =

  inferStateChange(sentence);



  moments.push({



   id:

    crypto.randomUUID(),



   title:

    extractMomentTitle(sentence),



   description:

    sentence,



   timeline:[

    "human_described_event"

   ],



   participants:

    input.entities?.people

    ??

    [],



   emotions:

    input.emotions?.emotions

    ??

    [],



   actions:

    [],



   objects:

    [

     ...(input.entities?.objects ?? []),

     ...(input.entities?.products ?? []),

     ...(input.entities?.creatures ?? [])

    ],



   significance:

    input.emotions?.intensity

    ??

    .5,



   sensory:{


    visual:[],


    audio:[],


    atmosphere:

     input.meaning?.themes

     ??

     []

   },



   outcome:

    `${change.before} → ${change.after}`


  });


 }



 return moments;


}









function buildRelationships(

 input:ObjectCompilationInput

):ObjectRelationship[]{


 return (

 input.relationships

 ??

 []

 )

 .map(

 relation => ({


  subject:

   relation.subject

   ??

   "unknown",



  relationship:

   "connected_to",



  object:

   relation.object

   ??

   "unknown",



  confidence:

   relation.confidence

   ??

   .5


 })

 );


}
function buildExperienceSignals(

 moments:ObjectMoment[]

):{
 phase:string;
 action:string;
 description:string;
 outcome?:string;

}[]{


return moments.map(

(moment,index)=>({


phase:

 `moment_${index + 1}`,


action:

 moment.actions.length

 ?

 moment.actions.join(", ")

 :

 "observed",



description:

 moment.description,



outcome:

 moment.outcome


})


);


}










function buildFuturePossibilities():string[]{


 return [

  "future interactions",

  "continued memory development",

  "new experiences"

 ];

}









export function compileObjectGenome(

 input:ObjectCompilationInput

):ObjectGenome {



 if(!input){

  throw new Error(

   "Object compilation input required."

  );

 }



 const moments =

 buildMoments(input);




 const lifecycle =

 compileLifecycle({


  prompt:

   input.prompt,


  memory:

   input.memory,


  entities:

   input.entities,


  relationships:

   input.relationships


 });






 return {


 identity:{


  name:

   extractIdentity(input),


  type:

   "unknown",


  category:

   extractAttributes(input),


  attributes:

   extractAttributes(input)


 },





 state:{


  current:

   "observed",


  previous:[],


  transitions:[]

 },





 history:{


  origin:

   input.prompt,


  timeline:[],


  importantMoments:

   moments.map(

    moment => moment.description

   )


 },




 lifecycle,





 relationships:

  buildRelationships(input),






 moments,






 experienceSignals:

  buildExperienceSignals(moments),






 memory:{


  memories:

   input.memory?.memories

   ??

   [],



  emotionalMarkers:

   input.memory?.markers

   ??

   input.emotions?.emotions

   ??

   [],



  locations:

   input.entities?.places

   ??

   [],



  dates:[],



  associatedPeople:

   input.entities?.people

   ??

   [],



  triggers:

   input.meaning?.themes

   ??

   []

 },







 legacy:{


  meaning:

   input.meaning?.symbols

   ??

   [],



  impact:

   input.dna?.traits

   ??

   [],



  preservation:

   input.memory?.timeCapsule

   ?

   [

    "preserved"

   ]

   :

   []

 },






 emotionalSignature:

  input.emotions?.emotions

  ??

  [],






 symbolicMeaning:

  input.meaning?.symbols

  ??

  [],






 futurePossibilities:

  buildFuturePossibilities()



 };


}







export const objectCompiler =

compileObjectGenome;