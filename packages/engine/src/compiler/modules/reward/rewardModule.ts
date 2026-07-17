import type { ExperienceModule } from "../types.js";

export const rewardModule: ExperienceModule = {
  id: "reward",

  name: "Rewards",

  description: "Loyalty and unlock experiences.",

  category: "reward",

  moments: [
    "reward",
  ],

  features: [
    "points",
    "badges",
    "discounts",
    "unlocks",
  ],

  dna: [
    "viral",
  ],

  payload: {},
};