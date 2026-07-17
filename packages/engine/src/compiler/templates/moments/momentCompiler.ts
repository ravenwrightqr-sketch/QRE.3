/**
 * =====================================================
 * QRE MOMENT COMPILER
 * =====================================================
 *
 * Converts Experience Moments
 * into runtime FlowSteps.
 *
 * Blueprint
 *    ↓
 * ExperienceMoment
 *    ↓
 * FlowStep
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceMoment,
  FlowStep,
} from "@qre/contracts";



function createId(){

  return crypto.randomUUID();

}




export function compileMoment(
  moment: ExperienceMoment,
  order:number
): FlowStep {


  switch(moment.type){



    // =========================
    // ENTRY
    // =========================

    case "welcome":

    case "introduction":

      return {

        id:createId(),

        order,

        type:"message",

        payload:{

           component:"story",
          text:
            moment.description ??
            (
              moment.type === "welcome"
                ? moment.title
                : `Welcome to ${moment.title}`
            ),

        },

      };





    // =========================
    // GEO / PRESENCE
    // =========================

    case "location":

    case "arrival":


      return {

        id:createId(),

        order,

        type:"location",

        payload:{

          geoMemory:true,

          snapshot:true,

          timeline:true,

          label:
            moment.title,

        },

      };





    // =========================
    // MEMORY
    // =========================

    case "memory":

    case "meeting":

    case "favorite_memories":

    case "legacy":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"memory",

          capture:true,

          title:
            moment.title,

        },

      };





    // =========================
    // STORY
    // =========================

    case "story":

    case "love_story":

    case "proposal":

    case "ceremony":

    case "vows":

    case "first_dance":

    case "adoption_story":

    case "pet_story":

    case "pet_journey":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"story",

          title:
            moment.title,

          description:
            moment.description,

        },

      };





    // =========================
    // MEDIA
    // =========================

    case "photos":

    case "video":

    case "soundtrack":

    case "wedding_gallery":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"gallery",

          mediaType:
            moment.type,

          upload:true,

        },

      };





    // =========================
    // EDUCATION
    // =========================

    case "education":

    case "effects_guide":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"education",

          interactive:true,

          title:
            moment.title,

          data:
            moment.payload,

        },

      };





    // =========================
    // PRODUCT DATA
    // =========================

    case "product_passport":

    case "strain_profile":

    case "terpene_profile":

    case "lab_results":

    case "batch_history":

    case "cultivation_story":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"product",

          section:
            moment.type,

          title:
            moment.title,

        },

      };





    // =========================
    // CINEMATIC REPLAY
    // =========================

    case "replay":

    case "highlights":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"cinematic_replay",

          generate:true,

        },

      };





    // =========================
    // COMMERCE
    // =========================

    case "product":

    case "offer":

    case "menu":

    case "booking":

    case "merch":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"commerce",

          action:
            moment.type,

          title:
            moment.title,

        },

      };





    // =========================
    // SOCIAL
    // =========================

    case "share":

    case "social":

    case "guestbook":

    case "guest_messages":

    case "reaction":

    case "friends":

    case "crowd":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"social",

          action:
            moment.type,

        },

      };





    // =========================
    // REWARD
    // =========================

    case "reward":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"reward",

          title:
            moment.title,

        },

      };





    // =========================
    // PET PROFILE
    // =========================

    case "pet_profile":

    case "medical_profile":

    case "emergency_info":

    case "care_instructions":

    case "lost_pet":

    case "pet_health":

    case "pet_birthday":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"profile",

          pet:true,

          action:
            moment.type,

        },

      };





    // =========================
    // TIMELINE
    // =========================

    case "timeline":

    case "milestone":

    case "future":

    case "time_capsule":


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

          component:"timeline",

          timeline:true,

          title:
            moment.title,

        },

      };





    // =========================
    // DEFAULT
    // =========================

    default:


      return {

        id:createId(),

        order,

        type:"message",

        payload:{

  component:"story",

  title:
    moment.title,

  description:
    moment.description,

},
        

      };


  }


}