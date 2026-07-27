/**
 * =====================================================
 * QRE CINEMATIC COMPILER
 * =====================================================
 *
 * Experience Blueprint
 *        +
 * Experience Direction
 *
 *        ↓
 *
 * Cinematic Scenes
 *
 *
 * Converts emotional intent into
 * player-ready cinematic instructions.
 *
 *
 * RESPONSIBILITIES:
 *
 * ✅ semantic → cinematic translation
 * ✅ player instruction generation
 * ✅ deterministic runtime output
 *
 *
 * DOES NOT:
 *
 * ❌ DATABASE
 * ❌ EXECUTION
 * ❌ PLAYER LOGIC
 * ❌ STORAGE
 *
 * =====================================================
 */


import type {

  CinematicScene,
  CinematicSceneType,
  SceneTransition,
  ExperienceBlueprint,

} from "@qre/contracts";


import type {

  ExperienceDirection,

} from "../experience/director.js";





/**
 * =====================================================
 * SCENE TYPE RESOLUTION
 *
 * Converts meaning into presentation.
 *
 * =====================================================
 */


function resolveSceneType(
  momentType:string
):CinematicSceneType {


  switch(momentType){


    case "welcome":
    case "arrival":
    case "introduction":

      return "intro";


    case "story":
    case "love_story":
    case "pet_story":
    case "family":
    case "friends":
       return "emotion";
    



    case "memory":
    case "favorite_memories":
    case "highlights":
    case "time_capsule":

      return "memory";



    case "reveal":
    case "milestone":
    case "future":

      return "emotion";



    case "timeline":
    case "legacy":

      return "timeline";



    case "completion":
    case "offer":
    case "booking":
    case "payment":
    case "reward":

      return "cta";



    case "location":
    case "venue":

      return "action";



    case "video":
    case "photos":
    case "media":

      return "system";



    default:

      return "intro";


  }

}





/**
 * =====================================================
 * TRANSITION ENGINE
 *
 * Cinematic pacing rules.
 *
 * =====================================================
 */


function resolveTransition(
  direction:ExperienceDirection
):SceneTransition {


  if(
    direction.pacing.includes("slow")
  ){

    return "cinematic";

  }



  if(
    direction.atmosphere.includes(
      "mysterious"
    )
  ){

    return "fade";

  }



  if(
    direction.atmosphere.includes(
      "dramatic"
    )
  ){

    return "flash";

  }



  return "none";


}


/**
 * =====================================================
 * VISUAL DNA
 *
 * Creates player rendering instructions.
 *
 * =====================================================
 */


function buildVisual(
  direction:ExperienceDirection
){


  return {


    theme:

      direction.atmosphere.includes(
        "dark"
      )

      ? "dark" as const

      :

      direction.atmosphere.includes(
        "glass"
      )

      ? "glass" as const

      :

      "cinematic" as const,




    animation:

      direction.pacing.includes(
        "slow"
      )

      ?

      "cinematic_camera" as const

      :

      direction.pacing.includes(
        "journey"
      )

      ?

      "parallax" as const

      :

      "none" as const,




    effects:

      direction.atmosphere,


  };


}



/**
 * =====================================================
 * AUDIO DNA
 *
 * Intent only.
 *
 * Media Engine resolves assets.
 *
 * =====================================================
 */


function buildAudio(){


  return {


    assetId:
      "ambient-default",



    type:
      "ambient" as const,



    volume:
      0.7,



    autoplay:
      true,


  };


}

/**
 * =====================================================
 * PLAYBACK DNA
 *
 * Player optimization.
 *
 * =====================================================
 */


function buildPlayback(){


  return {


    duration:
      8000,



    preload:
      true,



    autoplay:
      true,



    skippable:
      false,


  };


}

/**
 * =====================================================
 * BLUEPRINT
 *
 *        +
 *
 * DIRECTOR
 *
 *        ↓
 *
 * CINEMATIC RUNTIME
 *
 * =====================================================
 */


export function compileCinematicScenes(

  blueprint:ExperienceBlueprint,

  direction:ExperienceDirection

):CinematicScene[] {


  return blueprint.moments.map(

    (moment,index)=>{


      return {

  /**
   * Stable deterministic identity.
   */
  id:

     `scene-${index}-${moment.order}`,


  /**
   * Rendering category.
   */
  type:

    resolveSceneType(
      moment.type
    ),


   /**
   * Resolved semantic layer.
   *
   * Complete ExperienceMoment.
   *
   * Compiler output is self-contained.
   */
     moment:

    moment,


  /**
   * Playback ordering.
   */
  order:

    index,



        /**
         * Transition.
         */
        transition:

          resolveTransition(
            direction
          ),



        /**
         * Visual instructions.
         */
        visual:

          buildVisual(
            direction
          ),



        /**
         * Audio instructions.
         */
        audio:

          buildAudio(),



        /**
         * Runtime controls.
         */
        playback:

          buildPlayback(),




        /**
         * Controlled runtime metadata.
         */
        meta:{


          version:
            "1.0",



          generated:
            true,



          source:
            "experience_compiler",



          tags:[

            ...direction.atmosphere,

            ...direction.pacing,

          ],


        },


      };


    }

  );


}





export const cinematicCompiler =

compileCinematicScenes;