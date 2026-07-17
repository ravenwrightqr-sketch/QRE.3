/**
 * =====================================================
 * QRE CANNABIS EXPERIENCE ENGINE
 * =====================================================
 *
 * Master knowledge module for premium cannabis
 * experiences.
 *
 * Scan
 * ↓
 * Product Identity
 * ↓
 * Trust
 * ↓
 * Education
 * ↓
 * Story
 * ↓
 * Community
 * ↓
 * Loyalty
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";

export const cannabisExperience = {

  id:
    "premium-cannabis",

  industry:
    "cannabis",

  title:
    "Premium Cannabis Experience",

  purpose:
    "Turn every cannabis product into an educational, trustworthy, and memorable interactive experience.",

  experienceStyle: [

    "premium",

    "interactive",

    "educational",

    "luxury",

    "cinematic",

    "trustworthy",

  ],

  preferredDNA: [

    "premium",

    "trustworthy",

    "educational",

  ],

  emotionalJourney: [

    "curiosity",

    "confidence",

    "discovery",

    "excitement",

    "connection",

    "loyalty",

  ],

  visitorTypes: [

    "first_time",

    "returning",

    "medical",

    "tourist",

    "collector",

    "enthusiast",

  ],

  recommendedMoments: [

    "welcome",

    "product_passport",

    "strain_profile",

    "cultivation_story",

    "batch_history",

    "lab_results",

    "terpene_profile",

    "effects_guide",

    "reward",

    "review",

    "followup",

  ] as ExperienceMomentType[],

  features: [

    "product passport",

    "strain identity",

    "grower story",

    "lab verification",

    "coa download",

    "terpene education",

    "effects guide",

    "batch tracking",

    "harvest history",

    "grow location",

    "cultivation timeline",

    "reward program",

    "customer profile",

    "favorites",

    "reorder history",

  ],

  aiBehavior: {

    personality:
      "friendly expert",

    tone:
      "educational",

    storytelling:
      "high",

    humor:
      "low",

    transparency:
      "maximum",

  },

  dynamicExperiences: [

    "first scan greeting",

    "return visitor greeting",

    "new harvest announcement",

    "limited release",

    "seasonal recommendation",

    "birthday reward",

    "local event invitation",

  ],

  premiumMoments: [

    "gold badge unlock",

    "hidden grow journal",

    "master grower interview",

    "exclusive drops",

    "VIP rewards",

  ],

  memoryTriggers: [

    "favorite strain",

    "first purchase",

    "favorite terpene",

    "visited dispensary",

    "shared recommendation",

  ],

  locationBehaviors: [

    "dispensary greeting",

    "event mode",

    "festival mode",

    "tourist mode",

  ],

  trustSignals: [

    "verified laboratory",

    "verified batch",

    "cultivation history",

    "authenticity check",

    "licensed producer",

  ],

  analytics: [

    "passport opens",

    "strain profile views",

    "lab report opens",

    "effects guide reads",

    "reward unlocks",

    "repeat scans",

    "favorite strains",

    "return visits",

  ],

} as const;