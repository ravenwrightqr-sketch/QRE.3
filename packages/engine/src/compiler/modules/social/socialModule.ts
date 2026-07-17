import type { ExperienceModule } from "../types.js";

export const socialModule: ExperienceModule = {
  id: "social",

  name: "Social",

  description: "Sharing and community engagement.",

  category: "social",

  moments: [
    "share",
    "social",
    "reaction",
  ],

  features: [
    "share_link",
    "likes",
    "comments",
    "social_profiles",
  ],

  dna: [
    "viral",
  ],

  payload: {},
};