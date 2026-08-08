/**
 * =====================================================
 * QRE EXPERIENCE MEMORY ANALYZER
 * =====================================================
 *
 * Responsibility:
 *
 * Detect temporal and preservation signals
 * inside human experience requests.
 *
 *
 * Input:
 *
 * Human Prompt
 *
 *
 * Output:
 *
 * MemoryUnderstanding
 *
 *
 * Detects:
 *
 * - past memories
 * - present moments
 * - future intentions
 * - legacy
 * - replay
 * - preservation
 * - time capsules
 *
 *
 * This analyzer does NOT:
 *
 * - build timelines
 * - store memories
 * - create experiences
 * - execute runtime
 *
 *
 * Pipeline:
 *
 * Prompt
 *    ↓
 * MemoryAnalyzer
 *    ↓
 * Understanding Kernel
 *
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */
import type {
  MemoryUnderstanding
} from "@qre/contracts";







export function analyzeMemory(

prompt:string

):MemoryUnderstanding {



const text =

prompt.toLowerCase();







const past =

/past|history|childhood|memory|remember|old|nostalgia/

.test(text);







const present =

/moment|today|now|live|current/

.test(text);







const future =

/future|goal|dream|wish|plan|vision/

.test(text);







const legacy =

/legacy|tribute|family|ancestor|inherit/

.test(text);







const replay =

/replay|again|timeline|archive|restore/

.test(text);







const preservation =

/archive|save|preserve|keep|record|capture/

.test(text);







const timeCapsule =

/time capsule|forever|future generations/

.test(text);








let mode:

MemoryUnderstanding["mode"] =

"none";







if(timeCapsule){

 mode = "time_capsule";

}

else if(legacy){

 mode = "legacy";

}

else if(replay){

 mode = "replay";

}

else if(preservation){

 mode = "archive";

}

else if(past){

 mode = "timeline";

}







return {


past,


present,


future,


legacy,


replay,


timeCapsule,


mode


};



}