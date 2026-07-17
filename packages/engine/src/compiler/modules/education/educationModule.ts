/**
 * =====================================================
 * QRE EDUCATION MODULE
 * =====================================================
 *
 * Turns a scan into a learning experience.
 *
 * Used for:
 *
 * Cannabis
 * Pets
 * Products
 * Restaurants
 * Events
 *
 * =====================================================
 */

import type {
  ExperienceModule,
} from "../types.js";


export const educationModule: ExperienceModule = {


  id:
    "education",


  name:
    "Education Experience",


  description:
    "Explains products, stories, and important information.",


  category:
    "education",


  moments:[

    "education",

    "effects_guide",

    "care_instructions",

  ],


  features:[

    "guided learning",

    "explanations",

    "FAQs",

    "expert content",

    "recommendations",

  ],


  dna:[

    "trustworthy",

    "educational",

  ],


  payload:{


    interactive:true,


    expandable:true,


    aiAssistant:true,


  },


};