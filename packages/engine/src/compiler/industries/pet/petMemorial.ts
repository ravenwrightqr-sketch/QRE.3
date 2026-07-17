/**
 * =====================================================
 * QRE PET MEMORIAL EXPERIENCE
 * =====================================================
 *
 * Premium emotional memory product.
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petMemorial = {


  industry:
    "pet",


  experience:
    "pet_memorial",



  recommendedMoments:[

    "welcome",

    "pet_story",

    "photos",

    "memory",

    "timeline",

    "favorite_memories",

    "legacy",

    "share",

  ] satisfies ExperienceMomentType[],



  features:[

    "life story",

    "photo timeline",

    "favorite memories",

    "tribute page",

    "family sharing",

  ],


} as const;