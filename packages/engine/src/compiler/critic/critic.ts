import type {

 Critic

} from "./types.js";



export function criticize(

 idea:string

):Critic {



 return {


  idea,


  strengths:[

   "connects multiple patterns",

   "creates a possible explanatory model"

  ],


  weaknesses:[

   "requires additional evidence",

   "may contain hidden assumptions"

  ],


  risks:[

   "pattern similarity does not prove causation"

  ],


  confidence:.6


 };


}