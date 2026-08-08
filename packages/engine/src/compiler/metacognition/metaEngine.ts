import type {

 CognitiveEvent,
 MetaState

} from "./metaTypes.js";



export function analyzeCognition(

 events:CognitiveEvent[]

):MetaState {


 const successfulPatterns =

 events

 .filter(e => e.success)

 .map(e => e.process);



 const failedPatterns =

 events

 .filter(e => !e.success)

 .map(e => e.process);



 const score =

 events.length === 0

 ? 0

 : events.filter(e=>e.success).length

 /

 events.length;



 return {


  strategies:

   Array.from(

    new Set(

     events.map(e=>e.process)

    )

   ),



  successfulPatterns,



  failedPatterns,



  cognitiveScore:score


 };

}