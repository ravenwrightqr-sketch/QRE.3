/**
 * =====================================================
 * QRE CINEMATIC RUNTIME
 * =====================================================
 *
 * ExperienceMoment
 *        ↓
 * Cinematic Runtime
 *        ↓
 * CinematicScene
 *        ↓
 * Cinematic Player
 *
 *
 * Responsibilities:
 *
 * - Translate semantic meaning into presentation
 * - Assign cinematic classification
 * - Assign pacing
 * - Assign transitions
 * - Assign visual direction
 * - Prepare media references
 *
 *
 * CONTRACT:
 *
 * NO DATABASE
 * NO PRISMA
 * NO STORAGE
 * NO PLAYER LOGIC
 *
 * CinematicScene is a sealed runtime artifact.
 *
 * =====================================================
 */


import type {
  CinematicScene,
  ExperienceMoment,
} from "@qre/contracts";





type CinematicInput = {

  moments:
    ExperienceMoment[];

};





/**
 * =====================================================
 *
 * EXPERIENCE MOMENTS
 *
 * →
 *
 * CINEMATIC SCENES
 *
 * =====================================================
 */

export function cinematicRuntime(

  input:CinematicInput

):CinematicScene[] {


const scenes:CinematicScene[] = [];





function createSceneId(

  moment:ExperienceMoment

):string {


  return [

    "scene",

    moment.type,

    moment.component,

    moment.order

  ]

  .join("-")

  .toLowerCase();


}





/**
 * =====================================================
 *
 * MOMENT COMPILER
 *
 * Semantic truth becomes
 * player instructions.
 *
 * =====================================================
 */


for(

  const moment of input.moments

){


scenes.push({


  id:

    createSceneId(moment),



  type:

    resolveSceneType(

      moment.type

    ),



  /**
   * Complete semantic source.
   *
   * CinematicScene is self contained.
   */
  moment,



  order:

    moment.order,



  transition:

    resolveTransition(

      moment.type

    ),



  visual:

    resolveVisual(

      moment.type

    ),



  audio:

    resolveAudio(

      moment.type

    ),



  playback:{


    duration:

      resolveDuration(moment),



    preload:

      shouldPreload(

        moment.type

      ),



    autoplay:true,


  },



  meta:{


    version:

      "1.0",



    source:

      "experience_compiler",



    generated:

      true,



    tags:[

      moment.type

    ]


  }


});


}





/**
 * =====================================================
 *
 * FINAL RUNTIME OUTPUT
 *
 * =====================================================
 */


return scenes.sort(

(a,b)=>

a.order -

b.order

);


}






/**
 * =====================================================
 *
 * EXPERIENCE TYPE
 *
 * →
 *
 * CINEMATIC TYPE
 *
 * =====================================================
 */


function resolveSceneType(

type:string

):CinematicScene["type"] {



switch(type){


case "welcome":

case "introduction":

return "intro";




case "story":

case "love_story":

case "family":

case "friends":

case "pet_story":

return "emotion";




case "memory":

case "favorite_memories":

case "highlights":

case "time_capsule":

return "memory";




case "timeline":

case "legacy":

return "timeline";




case "location":

case "venue":

return "environment";




case "reveal":

case "milestone":

case "future":

return "reveal";




case "payment":

case "booking":

case "product":

case "reward":

case "offer":

return "cta";




default:

return "emotion";


}


}






/**
 * =====================================================
 *
 * DURATION ENGINE
 *
 * =====================================================
 */


function resolveDuration(

moment:ExperienceMoment

):number {



switch(moment.type){


case "welcome":

case "introduction":

return 1800;




case "video":

case "photos":

case "soundtrack":

return 5000;




case "memory":

case "timeline":

case "legacy":

case "time_capsule":

return 4500;




case "location":

case "venue":

return 3500;




case "payment":

case "booking":

case "product":

return 2500;




default:

return 3000;


}


}






/**
 * =====================================================
 *
 * TRANSITION DIRECTOR
 *
 * =====================================================
 */


function resolveTransition(

type:string

):CinematicScene["transition"] {



switch(type){



case "reveal":

return "cinematic";




case "memory":

case "timeline":

case "legacy":

return "dissolve";




case "video":

return "zoom";




case "payment":

case "product":

return "slide";




default:

return "fade";


}


}






/**
 * =====================================================
 *
 * VISUAL DIRECTOR
 *
 * =====================================================
 */


function resolveVisual(

type:string

):CinematicScene["visual"] {



switch(type){



case "memory":

case "timeline":

case "legacy":

return {


theme:

  "immersive",



animation:

  "cinematic_camera",


};




case "location":

case "venue":

return {


theme:

  "cinematic",



animation:

  "parallax",


};




case "video":

return {


theme:

  "cinematic",



animation:

  "slow_zoom",


};




case "payment":

case "product":

return {


theme:

  "glass",



animation:

  "none",


};




default:

return {


theme:

  "glass",



animation:

  "none",


};


}


}






/**
 * =====================================================
 *
 * AUDIO DIRECTOR PLACEHOLDER
 *
 * Media Engine resolves real assets later.
 *
 * =====================================================
 */


function resolveAudio(

type:ExperienceMoment["type"]

):CinematicScene["audio"] {



switch(type){



case "story":

case "message":

return {


assetId:

  "pending-voice",



type:

  "voice",



mood:

  "emotional",



volume:

  0.8,



autoplay:

  true


};




case "memory":

case "photos":

return {


assetId:

  "pending-memory-score",



type:

  "music",



mood:

  "nostalgia",



volume:

  0.6,



autoplay:

  true


};




case "video":

case "media":

return {


assetId:

  "pending-media-audio",



type:

  "ambient",



mood:

  "cinematic",



volume:

  0.7,



autoplay:

  true


};




default:

return {


assetId:

  "pending-default-audio",



type:

  "ambient",



mood:

  "neutral",



volume:

  0.5,



autoplay:

  true


};


}


}






/**
 * =====================================================
 *
 * PRELOAD STRATEGY
 *
 * =====================================================
 */


function shouldPreload(

type:string

):boolean {


return (

type === "video"

||

type === "photos"

||

type === "soundtrack"

||

type === "memory"

);


}