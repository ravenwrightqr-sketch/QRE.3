import type {
  AccessState,
  Moment,
} from "@qre/contracts";


export function systemMoments(
  state: AccessState
): Moment[] {


  if (state === "UNLOCKED") {

    return [];

  }


  return [
    {
      type: "system",

      order: 0,

      text: "Demo experience",

      meta: {
        accessState: state,
      },

    },
  ];

}