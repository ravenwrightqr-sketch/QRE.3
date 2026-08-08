/**
 * =====================================================
 * QRE FLOW → EXPERIENCE MOMENTS
 * =====================================================
 *
 * FlowStep
 *     ↓
 * ExperienceMoment
 *     ↓
 * CinematicRuntime
 *     ↓
 * CinematicScene
 *
 *
 * Semantic translation layer.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  FlowStep,
  ExperienceMoment,
  ExperienceMomentType,
  ExperienceComponent,
} from "@qre/contracts";





function resolveMomentType(
  step: FlowStep,
  payload: Record<string, any>
): ExperienceMomentType {


  switch(step.type){


    case "location":

      return "location";



    case "payment":

      return "payment";



    case "redirect":

      return "interaction";



    case "timer":

      return "completion";



    case "message": {


      const semantic =
        payload.momentType ??
        payload.component ??
        payload.action;



      switch(semantic){


        case "memory":

          return "memory";


        case "gallery":
        case "photos":

          return "photos";


        case "video":

          return "video";


        case "audio":
        case "soundtrack":

          return "audio";


        case "reward":

          return "reward";


        case "social":

          return "social";


        case "profile":

          return "profile";


        case "education":

          return "education";


        case "product":

          return "product";


        case "location":

          return "location";


        case "discovery":

          return "story";


        default:

          return "message";


      }

    }



    default:

      return "message";


  }

}









function resolveComponent(
 type: ExperienceMomentType
): ExperienceComponent {


 switch(type){


  case "location":

  case "arrival":

  case "venue":

    return "geo_memory";



  case "photos":

  case "photo":

    return "gallery";



  case "video":

    return "video";



  case "audio":

  case "soundtrack":

    return "audio";



  case "reward":

    return "reward";



  case "payment":

    return "payment";



  case "profile":

    return "profile";



  case "social":

    return "social";



  case "product":

  case "product_passport":

    return "product";



  case "interaction":

  case "share":

    return "interaction";



  default:

    return "story";


 }

}









export function flowToMoment(
 steps: FlowStep[]
): ExperienceMoment[] {


 const moments: ExperienceMoment[] = [];





 for(const step of steps){


  const source =
    (
      step.payload ?? {}
    ) as Record<string, any>;





  const type =
    resolveMomentType(
      step,
      source
    );






  const moment: ExperienceMoment = {


    type,



    component:
      resolveComponent(type),




    title:

      String(

        source.title ??

        source.label ??

        source.text ??

        "Experience Moment"

      ),





    subtitle:

      source.subtitle

      ? String(source.subtitle)

      : undefined,





    description:

      source.description

      ? String(source.description)

      : undefined,





    editable:

      true,





    demo:

      false,





    order:

      step.order,






    payload:{



      text:

        source.text

        ? String(source.text)

        : undefined,





      media:

        source.media ?? undefined,





      audio:

        source.audio ?? undefined,





      location:

        source.location ?? undefined,





      interaction:

        source.interaction ??

        (
          source.url

          ? {

              action:"open",

              url:String(source.url),

              label:

                source.label

                ? String(source.label)

                : undefined

            }

          : undefined

        ),





      data:{


        flowStepId:

          step.id,



        originalStep:

          step,



        accessState:

          source.accessState,



        duration:

          source.duration,



        geoMemory:

          source.geoMemory,


      },


    }


  };





  moments.push(moment);


 }





 return moments;


}