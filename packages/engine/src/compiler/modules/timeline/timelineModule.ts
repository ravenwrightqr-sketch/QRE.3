import type { ExperienceModule } from "../types.js";

export const timelineModule: ExperienceModule = {
  id: "timeline",

  name: "Timeline",

  description: "Chronological storytelling.",

  category: "story",

  moments: [
    "timeline",
    "highlights",
    "replay",
    "time_capsule",
  ],

  features: [
    "history",
    "events",
    "progression",
    "memory_feed",
  ],

  dna: [
    "cinematic",
    "emotional",
  ],

  payload: {},
};