/**
 * =====================================================
 * QRE IDENTITY MODULE
 * =====================================================
 *
 * Universal identity layer.
 *
 * Examples:
 *
 * Pet:
 *   Luna
 *   Breed
 *   Medical
 *   Owner
 *
 * Cannabis:
 *   Strain
 *   Batch
 *   Grower
 *
 * Wedding:
 *   Couple
 *   Story
 *
 * Business:
 *   Brand
 *   Profile
 *
 * =====================================================
 */

import type {
  ExperienceModule,
} from "../types.js";


export const identityModule: ExperienceModule = {


  id:
    "identity",


  name:
    "Identity Profile",


  description:
    "Creates a trusted identity profile experience.",


  category:
    "identity",


  moments:[

    "welcome",

    "profile",

  ],


  features:[

    "profile",

    "identity",

    "verified information",

    "contact",

  ],


  dna:[

    "trustworthy",

    "premium",

  ],


  payload:{


    profile:true,


    verification:true,


    editable:true,


  },


};