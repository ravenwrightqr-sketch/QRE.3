/**
 * =====================================================
 * QRE PET RESCUE EXPERIENCE
 * =====================================================
 *
 * Shelters
 * Adoption groups
 * Rescue organizations
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petRescue= {


  industry:
    "pet",


  experience:
    "pet_rescue",



  recommendedMoments:[

    "welcome",

    "pet_profile",

    "adoption_story",

    "photos",

    "pet_journey",

    "share",

    "followup",

  ] satisfies ExperienceMomentType[],



  features:[

    "rescue story",

    "before and after",

    "personality profile",

    "adoption information",

    "updates",

  ],


} as const;