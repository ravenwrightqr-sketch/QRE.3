/**
 * =====================================================
 * QRE CINEMATIC EXPERIENCE DNA
 * =====================================================
 *
 * Controls emotional storytelling behavior.
 *
 * Used by:
 *
 * - memory capsules
 * - weddings
 * - events
 * - premium experiences
 *
 * Does NOT create flows.
 * Does NOT touch database.
 *
 * It modifies experience direction.
 *
 * =====================================================
 */

import type {
  ExperienceTone,
} from "@qre/contracts";


export const cinematicDNA = {


  tone:
    "cinematic" as ExperienceTone,


  pacing:
    "story",


  rules:[

    "Create emotional progression",

    "Start with curiosity",

    "Build memorable moments",

    "End with a meaningful action",

  ],


  preferredMoments:[

    "introduction",

    "story",

    "location",

    "photos",

    "memory",

    "replay",

    "future",

  ],


};