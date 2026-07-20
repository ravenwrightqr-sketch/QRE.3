import type {
  ExperienceBlueprint,
  ExperienceMomentType,
  FlowStep,
  FlowStepType,
} from "@qre/contracts";



/**
 * =====================================================
 *
 * BLUEPRINT → FLOW COMPILER
 *
 * Creative DNA → Runtime Instructions
 *
 * INPUT:
 * ExperienceBlueprint
 *
 * OUTPUT:
 * FlowStep[]
 *
 * RULES:
 *
 * - Pure
 * - No database
 * - No Prisma
 * - No execution
 *
 * =====================================================
 */



function resolveFlowType(
  momentType: ExperienceMomentType
): FlowStepType {


  const mapping: Partial<
    Record<
      ExperienceMomentType,
      FlowStepType
    >
  > = {


    welcome:
      "hero",


    introduction:
      "hero",


    story:
      "story",


    memory:
      "story",


    timeline:
      "timeline",


    photos:
      "gallery",


    video:
      "video",


    soundtrack:
      "soundtrack",


    location:
      "location",



    product:
      "product",


    menu:
      "menu",


    offer:
      "offer",


    reward:
      "reward",


    payment:
      "payment",


    booking:
      "booking",


    review:
      "review",


    social:
      "social",


    share:
      "share",


    profile:
      "profile",


    guestbook:
      "guestbook",


    interaction:
      "timer",


    completion:
      "message",


    reveal:
      "story",

  };



  return (
    mapping[momentType]
    ??
    "message"
  );

}





export function blueprintToFlow(

  blueprint: ExperienceBlueprint

): FlowStep[] {


  if(
    !blueprint ||
    !Array.isArray(
      blueprint.moments
    )
  ){

    return [];

  }



  return blueprint.moments.map(

    (
      moment,
      index
    ) => ({


      id:
        `experience-${index}`,



      order:
        index,



      type:
        resolveFlowType(
          moment.type
        ),



      payload:{


        experience:{


          component:
            moment.component,


          momentType:
            moment.type,


          title:
            moment.title,


          subtitle:
            moment.subtitle,


          description:
            moment.description,


          icon:
            moment.icon,


          animation:
            moment.animation,


          editable:
            moment.editable,


          demo:
            moment.demo,


          order:
            moment.order,


        },


        ...moment.payload,

      },


    })

  );


}