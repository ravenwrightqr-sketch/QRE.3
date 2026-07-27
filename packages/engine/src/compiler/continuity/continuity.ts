import type {

    Continuity

} from "./types.js";



export function trackContinuity(

    previous:string,

    current:string

):Continuity {



return {


previous,


current,


changes:[

    "knowledge expanded",

    "new relationships detected"

],


direction:

    "increasing conceptual connection",


strength:.8


};


}