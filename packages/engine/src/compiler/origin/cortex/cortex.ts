import type {
    OriginCognitiveState,
} from "@qre/contracts";

import { createInquiry } from "../inquiry/index.js";



function unique(
 values:string[]=[]
):string[]{

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}



function extractSignals(

 input:string

):string[]{

 return input
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter(

   word => word.length > 3

  );

}



export function tick(

 state:OriginCognitiveState

):OriginCognitiveState{


 const signals =

  extractSignals(

   state.input

  );



 const observations =

  unique([

   ...state.observations,

   ...signals.map(

    signal =>

     `semantic signal: ${signal}`

   )

  ]);



 const inquiry =

  createInquiry(

   `What relationships emerge between ${signals.join(", ")}?`

  );



 const confidenceGain =

  Math.min(

   0.05,

   signals.length * 0.01

  );



 return {

  ...state,



  history:[

   ...state.history,

   `semantic evolution (${signals.length} signals)`,

  ],



  observations,



  questions:[

   ...state.questions,

   inquiry

  ],



  curiosity:

   Math.min(

    1,

    state.curiosity +

    Math.max(

     0.02,

     signals.length * 0.005

    )

   ),



  confidence:

   Math.min(

    1,

    state.confidence +

    confidenceGain

   )

 };


}