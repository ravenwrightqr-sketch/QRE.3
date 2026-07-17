/**
 * =====================================================
 * QRE CANNABIS PRODUCT PASSPORT EXPERIENCE
 * =====================================================
 *
 * Every product gets an identity.
 *
 * Scan
 * ↓
 * Product Story
 * ↓
 * Grower
 * ↓
 * Batch
 * ↓
 * Lab Proof
 * ↓
 * Education
 *
 * Premium trust layer.
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const cannabisProductPassport = {


  industry:
    "cannabis",


  experience:
    "product_passport",



  purpose:

    "Turn cannabis products into transparent trusted experiences.",



  recommendedMoments:[


    "welcome",

    "product_passport",

    "strain_profile",

    "cultivation_story",

    "batch_history",

    "lab_results",

    "terpene_profile",

    "effects_guide",

    "review",

    "reward",

  ] satisfies ExperienceMomentType[],



  features:[

    "digital product identity",

    "grower profile",

    "harvest story",

    "testing verification",

    "terpene education",

    "effects education",

    "customer loyalty",

    "repeat purchase history",

  ],


} as const;