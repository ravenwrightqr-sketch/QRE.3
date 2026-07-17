import type { ExperienceModule } from "../types.js";

export const aiModule: ExperienceModule = {
  id: "ai",

  name: "AI Assistant",

  description: "AI generated summaries, recommendations and conversations.",

  category: "education",

  moments: [
    "education",
    "review",
  ],

  features: [
    "ai_summary",
    "recommendations",
    "conversation",
    "smart_context",
  ],

  dna: [
    "intelligent",
    "helpful",
  ],

  payload: {},
};