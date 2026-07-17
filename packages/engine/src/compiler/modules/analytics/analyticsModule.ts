import type { ExperienceModule } from "../types.js";

export const analyticsModule: ExperienceModule = {
  id: "analytics",

  name: "Analytics",

  description: "Tracks engagement and performance.",

  category: "education",

  moments: [
    "review",
  ],

  features: [
    "views",
    "completion_rate",
    "dropoff",
    "heatmap",
    "engagement",
  ],

  dna: [
    "data",
  ],

  payload: {},
};