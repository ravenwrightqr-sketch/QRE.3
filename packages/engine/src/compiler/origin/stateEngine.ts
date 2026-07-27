/**
 * =====================================================
 * ORIGIN STATE ENGINE
 * =====================================================
 *
 * Converts scenes into experiential state changes.
 *
 * =====================================================
 */


export interface ExperienceState {


 sceneId:string;


 before:{
  emotion:string;
  awareness:string;
 };


 action:string;


 after:{
  emotion:string;
  awareness:string;
 };


 memoryImpact:string;


 nextPotential:string;


}





export function evolveScene(

 scene:any

):ExperienceState {


 return {


  sceneId:
   scene.id,



  before:{


   emotion:
    "anticipation",


   awareness:
    "unknown"


  },



  action:

   scene.action,



  after:{


   emotion:
    "wonder",


   awareness:
    "meaning discovered"


  },



  memoryImpact:

   scene.meaningAnchor,



  nextPotential:

   "deeper connection"


 };


}