/**
 * =====================================================
 * QRE STORY MODULE
 * =====================================================
 *
 * Universal storytelling layer.
 *
 * Used by:
 *
 * weddings
 * pets
 * cannabis brands
 * restaurants
 * creators
 * memorials
 *
 * =====================================================
 */

import type {
  ExperienceModule,
} from "../types.js";


export const storyModule: ExperienceModule = {


  id:
    "story",


  name:
    "Story Experience",


  description:
    "Creates emotional narrative moments.",


  category:
    "story",


  moments:[

    "story",

    "memory",

    "timeline",

  ],


  features:[

    "chapters",

    "narration",

    "timeline",

    "media",

  ],


  dna:[

    "emotional",

    "cinematic",

  ],


  payload:{


    chapters:true,


    aiNarration:true,


    timeline:true,


  },


};