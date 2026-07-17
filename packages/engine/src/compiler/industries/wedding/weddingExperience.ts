/**
 * =====================================================
 * QRE WEDDING EXPERIENCE ENGINE
 * =====================================================
 *
 * Master Wedding Experience Knowledge
 *
 * Every scan becomes part of a couple's history.
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";

export const weddingExperience = {

  id:
    "premium-wedding",

  industry:
    "wedding",

  title:
    "Living Wedding Experience",

  purpose:
    "Transform a wedding into a permanent interactive memory shared by the couple, guests, and future generations.",

  experienceStyle:[

    "cinematic",

    "luxury",

    "emotional",

    "interactive",

    "timeless",

  ],

  preferredDNA:[

    "cinematic",

    "emotional",

    "premium",

  ],

  emotionalJourney:[

    "anticipation",

    "joy",

    "celebration",

    "gratitude",

    "nostalgia",

    "legacy",

  ],

  visitorTypes:[

    "bride",

    "groom",

    "guest",

    "family",

    "photographer",

    "future children",

  ],

  recommendedMoments:[

    "welcome",

    "story",

    "proposal",

    "ceremony",

    "photos",

    "video",

    "guestbook",

    "location",

    "timeline",

    "future",

    "anniversary",

    "legacy",

  ] as ExperienceMomentType[],

  features:[

    "couple profile",

    "proposal story",

    "ceremony timeline",

    "interactive guestbook",

    "photo uploads",

    "video memories",

    "venue memories",

    "anniversary reminders",

    "time capsule",

    "digital keepsake",

    "family archive",

    "children message",

    "vow replay",

  ],

  aiBehavior:{

    personality:
      "warm storyteller",

    tone:
      "celebratory",

    storytelling:
      "maximum",

    emotion:
      "maximum",

  },

  dynamicExperiences:[

    "countdown before ceremony",

    "live reception mode",

    "photo scavenger hunt",

    "guest challenges",

    "digital guestbook",

    "anniversary replay",

    "10 year memory unlock",

    "25 year anniversary unlock",

  ],

  premiumMoments:[

    "cinematic opening",

    "interactive venue map",

    "timeline replay",

    "AI wedding recap",

    "future anniversary video",

    "legacy archive",

  ],

  memoryTriggers:[

    "first dance",

    "first kiss",

    "proposal",

    "cake cutting",

    "speeches",

    "sunset photos",

    "guest messages",

    "honeymoon",

  ],

  locationBehaviors:[

    "ceremony",

    "reception",

    "photo booth",

    "gift table",

    "honeymoon",

  ],

  analytics:[

    "guestbook entries",

    "photo uploads",

    "video plays",

    "timeline views",

    "anniversary returns",

    "family revisits",

  ],

} as const;