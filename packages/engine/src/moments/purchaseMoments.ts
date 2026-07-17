import type {
  AccessState,
  Moment,
} from "@qre/contracts";


export function purchaseMoments(
  state: AccessState,
  slug: string
): Moment[] {


  if (
    state === "UNLOCKED"
  ) {

    return [];

  }



  if (
    state === "DEMO"
  ) {

    return [

      {
        type: "action",

        order: 100,

        action: "payment",

        meta: {

          text: "Create your own experience",

          url: `/store/${slug}`,

        },

      },

    ];

  }



  if (
    state === "LOCKED"
  ) {

    return [

      {
        type: "action",

        order: 100,

        action: "payment",

        meta: {

          text: "Activate this experience",

          url: `/checkout/${slug}`,

        },

      },

    ];

  }



  return [

    {
      type: "action",

      order: 100,

      action: "payment",

      meta: {

        text: "Get this experience",

        url: `/checkout/${slug}`,

      },

    },

  ];

}