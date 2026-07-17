/**
 * =====================================================
 * QRE PET CARE EXPERIENCE
 * =====================================================
 *
 * Daycare
 * Grooming
 * Boarding
 * Training
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petCare = {


  industry:
    "pet",


  experience:
    "pet_care",



  recommendedMoments: [

    "welcome",

    "pet_profile",

    "care_instructions",

    "medical_profile",

    "pet_health",

    "photos",

    "followup",

    "review",

  ] satisfies ExperienceMomentType[],



  features:[

    "care instructions",

    "daily updates",

    "health notes",

    "owner communication",

    "service history",

  ],


} as const;