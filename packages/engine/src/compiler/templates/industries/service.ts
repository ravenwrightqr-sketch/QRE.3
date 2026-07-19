/**
 * =====================================================
 * QRE SERVICE INDUSTRY TEMPLATE
 * =====================================================
 *
 * Service businesses
 * Salons
 * Barbers
 * Professionals
 * Appointments
 *
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "../templateTypes.js";


export const serviceIndustry = {


  industry:
    "service",


  defaultGoal:
    "booking",


  preferredDNA:[

    "premium",

    "friendly",

  ],


  recommendedMoments:[

    "welcome",

    "introduction",

    "education",

    "booking",

    "offer",

    "review",

    "followup",

  ],


} satisfies IndustryTemplate;