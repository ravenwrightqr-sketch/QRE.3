import type { AccessState } from "@qre/contracts";


export type TeaserBlock = {
  type: "text" | "action";
  text: string;
  url?: string;
};


export function renderTeaser(
  access: AccessState,
  slug: string
): TeaserBlock[] {


  if (access === "DEMO") {

    return [

      {
        type: "text",
        text:
          "Demo experience"
      },

      {
        type: "text",
        text:
          "Play this experience here. Own the physical QRE to save your memories, unlock your dashboard, and create your permanent experience."
      },

      {
        type: "action",
        text:
          "Get this QRE",
        url:
          `/store/${slug}`
      }

    ];

  }


  /**
   * UNLOCKED
   *
   * No teaser.
   * No button.
   * No "experience unlocked".
   *
   * Cinematic player starts immediately.
   */
  return [];

}