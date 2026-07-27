/**
 * =====================================================
 * QRE SYSTEM EXPERIENCE MOMENTS
 * =====================================================
 *
 * Access state → ExperienceMoment
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  AccessState,
  ExperienceMoment,
} from "@qre/contracts";






export function systemMoments(
  state: AccessState
): ExperienceMoment[] {



  if (state === "UNLOCKED") {

    return [];

  }




  return [

    {

      type:
        "welcome",



      component:
        "hero",





      title:
        "Demo Experience",





      subtitle:
        "Preview mode",





      description:
        "Experience preview before unlock.",





      editable:
        false,





      demo:
        true,

      order:
        0,

      payload:{

        data:{


          accessState:

            state,

          source:

            "system_moment",


        }


      },


    },

  ];

}