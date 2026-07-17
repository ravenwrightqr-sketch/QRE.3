/**
 * =====================================================
 * QRE CANNABIS INDUSTRY TEMPLATE
 * =====================================================
 *
 * AI recognition layer.
 *
 * Determines when a cannabis experience
 * should be generated.
 *
 * =====================================================
 */

import type {
  IndustryTemplate,
} from "../templateTypes.js";


export const cannabisIndustry = {


  industry:
    "cannabis",



  defaultGoal:
    "loyalty",



  preferredDNA:[


    "premium",


    "trustworthy",


    "educational",


  ],



  recommendedMoments:[


    "welcome",


    "product_passport",


    "strain_profile",


    "lab_results",


    "terpene_profile",


    "effects_guide",


    "reward",


    "followup",


  ],



  keywords:[


    "dispensary",


    "weed",


    "cannabis",


    "strain",


    "flower",


    "cultivation",


    "grower",


    "terpene",


    "thc",


    "cbd",


    "edibles",


    "vape",


  ],



  experiences:[


    "product_passport",


    "strain_story",


    "loyalty",


  ],



} satisfies IndustryTemplate;