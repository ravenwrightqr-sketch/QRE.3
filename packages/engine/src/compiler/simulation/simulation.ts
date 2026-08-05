/**
 * =====================================================
 * QRE POSSIBILITY SIMULATOR
 * =====================================================
 *
 * Meaning
 *    ↓
 * Possibility Space
 *    ↓
 * Future Scenarios
 *
 *
 * Explores how an idea may evolve.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO TEMPLATES
 *
 * =====================================================
 */


import type {

 Simulation

} from "./types.js";





function extractSignals(

 idea:string

):string[] {


 return idea

  .toLowerCase()

  .split(/\s+/)

  .filter(

    word => word.length > 3

  );

}





function createScenario(

 idea:string,

 signal:string,

 index:number

):string {


 const evolutions = [

  `The idea develops around ${signal}.`,

  `The idea creates new relationships through ${signal}.`,

  `The idea changes as external forces interact with ${signal}.`,

  `The idea discovers a new possibility connected to ${signal}.`

 ];


 return evolutions[index % evolutions.length];

}





function estimateConfidence(

 signals:string[]

):number {


 if(signals.length === 0){

  return .2;

 }


 if(signals.length < 3){

  return .5;

 }


 return .75;

}





export function simulate(

 idea:string

):Simulation {


 if(!idea.trim()){

  throw new Error(

   "Simulation requires an idea."

  );

 }



 const signals =

  extractSignals(

   idea

  );





 const scenarios =

  signals.slice(0,4)

  .map(

    (signal,index)=>

      createScenario(

        idea,

        signal,

        index

      )

  );





 return {


  input:

    idea,



  scenarios,



  predictions:

    scenarios.map(

      scenario =>

        `Potential future state: ${scenario}`

    ),



  confidence:

    estimateConfidence(

      signals

    )


 };


}