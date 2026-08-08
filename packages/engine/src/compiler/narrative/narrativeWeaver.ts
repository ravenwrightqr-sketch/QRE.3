/**
 * =====================================================
 * QRE NARRATIVE WEAVER
 * =====================================================
 *
 * Converts generated sequence into emotional continuity.
 *
 * NOT:
 *
 * ❌ templates
 * ❌ chapters
 * ❌ captions
 * ❌ story generation
 *
 *
 * IS:
 *
 * ✅ emotional continuity
 * ✅ meaning reinforcement
 * ✅ narrative texture
 * ✅ memory anchoring
 * ✅ human experience depth
 * ✅ cognitive preservation
 * ✅ world intelligence preservation
 *
 *
 * Pipeline:
 *
 * Narrative Sequence
 *        ↓
 * Narrative Weaver
 *        ↓
 * Experience Narrative
 *
 * =====================================================
 */


import type {
  NarrativeSequence
} from "./narrativeSequenceEngine.js";







export interface NarrativeThread {


  state:string;


  meaning:string;


  emotion:string;


  intensity:number;


  purpose:string;


  connection:string;


  /**
   * What the moment reveals.
   */
  revelation:string;


  /**
   * What the human expects.
   */
  expectation:string;


  /**
   * Long-term memory imprint.
   */
  memoryAnchor:string;


  /**
   * Emotional movement speed.
   */
  momentum:number;


  /**
   * World identity behind the moment.
   */
  worldIdentity:string;


  /**
   * Force shaping the experience.
   */
  worldForce:string;


  /**
   * Rule governing emotional movement.
   */
  emotionalLaw:string;


  /**
   * Future evolution signal.
   */
  futurePossibility:string;


}








export interface WovenNarrative {


  threads:NarrativeThread[];


  transformation:string;


  worldIdentity:string;


}









function createConnection(

 previous:string | undefined,

 current:string

):string {


if(!previous){

 return "experience origin";

}



return (

 `movement from ${previous} into ${current}`

);


}









function strengthenMeaning(

 meaning:string,

 emotion:string,

 revelation:string

):string {


return (

 `${meaning} Emotional force: ${emotion}. ${revelation}`

);


}









function weaveWorldContext(

 worldIdentity:string,

 worldForce:string,

 emotionalLaw:string

):string {


return (

 `${worldIdentity} operates through ${worldForce}. The emotional law is ${emotionalLaw}.`

);


}









export function weaveNarrative(


 sequence:NarrativeSequence


):WovenNarrative {






const threads =


sequence.moments.map(

(moment,index)=>{



return {



state:

moment.state,






meaning:

strengthenMeaning(

 moment.meaning,

 moment.emotion,

 moment.revelation

),






emotion:

moment.emotion,






intensity:

moment.intensity,






purpose:

moment.purpose,






connection:

createConnection(

 sequence.moments[index - 1]?.state,

 moment.state

),






revelation:

moment.revelation,






expectation:

moment.expectation,






memoryAnchor:

moment.memoryAnchor,






momentum:

moment.momentum,






worldIdentity:

sequence.worldIdentity,






worldForce:

moment.worldForce,






emotionalLaw:

moment.emotionalLaw,






futurePossibility:

moment.futurePossibility




};


}

);









return {


threads,



transformation:


sequence.transformation,



worldIdentity:

sequence.worldIdentity



};


}