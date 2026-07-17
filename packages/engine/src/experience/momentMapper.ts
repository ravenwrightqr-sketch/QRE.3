import type {
  ExperienceMoment,
  FlowStep,
} from "@qre/contracts";


/**
 * =====================================================
 * EXPERIENCE MOMENT → ENGINE FLOW TYPE MAPPER
 * =====================================================
 *
 * The Experience Compiler creates cinematic moments.
 *
 * The Runtime Engine executes a smaller set of actions:
 *
 * message
 * location
 * payment
 * redirect
 *
 * This file is the translation boundary.
 *
 * Experience layer:
 *   wedding
 *   memory
 *   gallery
 *   product
 *   cannabis
 *   pet
 *   events
 *
 * Runtime layer:
 *   message
 *   location
 *   payment
 *   redirect
 *
 * =====================================================
 */


export function mapMomentToFlowType(
  moment: ExperienceMoment
): FlowStep["type"] {


  switch(moment.component) {


    /**
     * =================================
     * CINEMATIC / STORY EXPERIENCE
     * =================================
     *
     * These render as narrative moments.
     */

    case "hero":

    case "story":

    case "memory":

    case "gallery":

    case "video":

    case "timeline":

    case "profile":

    case "social":

    case "guestbook":

    case "product":

    case "education":

    case "review":

      return "message";



    /**
     * =================================
     * LOCATION / GEO EXPERIENCE
     * =================================
     */

    case "geo_memory":

    case "map":

      return "location";



    /**
     * =================================
     * COMMERCE
     * =================================
     */

    case "payment":

      return "payment";



    /**
     * =================================
     * ACTION / CTA
     * =================================
     */

    case "cta":

      return "redirect";



    /**
     * =================================
     * REWARD
     *
     * Runtime currently handles rewards
     * through message payloads.
     *
     * Later:
     * reward becomes dedicated action.
     * =================================
     */

    case "reward":

      return "message";



    default:

      return "message";

  }

}