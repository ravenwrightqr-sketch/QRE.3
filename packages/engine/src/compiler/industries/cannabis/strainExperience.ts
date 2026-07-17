/**
 * =====================================================
 * QRE CANNABIS STRAIN EXPERIENCE
 * =====================================================
 *
 * A strain becomes a story.
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const cannabisStrainExperience = {


  industry:
    "cannabis",


  experience:
    "strain_story",



  purpose:

    "Create emotional education around cannabis genetics and effects.",



  recommendedMoments:[


    "welcome",

    "strain_profile",

    "cultivation_story",

    "terpene_profile",

    "effects_guide",

    "photos",

    "review",

    "share",

  ] satisfies ExperienceMomentType[],



  features:[


    "strain history",

    "genetics",

    "cultivation journey",

    "flavor profile",

    "terpene education",

    "consumer reviews",

    "social sharing",

  ],


} as const;