/**
 * =====================================================
 * QRE PET SOCIAL EXPERIENCE
 * =====================================================
 *
 * Shareable pet identity.
 *
 * Social media style profiles.
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petSocial = {


  industry:
    "pet",


  experience:
    "pet_social",



  recommendedMoments:[

    "welcome",

    "pet_profile",

    "pet_story",

    "photos",

    "pet_birthday",

    "share",

    "reaction",

  ] satisfies ExperienceMomentType[],



  features:[

    "personality",

    "favorite things",

    "fun facts",

    "photo sharing",

    "birthday memories",

    "social profile",

  ],


} as const;