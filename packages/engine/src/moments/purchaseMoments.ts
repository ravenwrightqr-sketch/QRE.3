/**
 * =====================================================
 * QRE PURCHASE EXPERIENCE MOMENTS
 * =====================================================
 *
 * Access State
 *      ↓
 * ExperienceMoment
 *      ↓
 * CinematicRuntime
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  AccessState,
  ExperienceMoment,
} from "@qre/contracts";



export function purchaseMoments(
  state: AccessState,
  slug: string
): ExperienceMoment[] {



  if (
    state === "UNLOCKED"
  ) {

    return [];

  }




  const url =

    state === "DEMO"

      ? `/store/${slug}`

      : `/checkout/${slug}`;







  return [

    {

      type:
        "payment",



      component:
        "payment",



      title:

        state === "DEMO"

          ? "Create Your Own Experience"

          : state === "LOCKED"

            ? "Activate This Experience"

            : "Get This Experience",





      subtitle:

        "Unlock the complete experience.",





      description:

        "Continue to access the full cinematic experience.",





      editable:

        false,





      demo:

        state === "DEMO",





      order:

        100,





      payload:{


        interaction:{

          action:"purchase",

          url,

          label:

            state === "DEMO"

              ? "Create Experience"

              : "Unlock Experience"


        },


        data:{


          accessState:

            state,


          slug,


        }


      },

    },

  ];

}