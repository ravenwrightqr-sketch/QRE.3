import type { ExperienceModule } from "../types.js";

export const locationModule: ExperienceModule = {
  id: "location",

  name: "Location",

  description: "Geo memories and proof of presence.",

  category: "location",

  moments: [
    "location",
    "arrival",
    "venue",
  ],

  features: [
    "gps",
    "maps",
    "checkin",
    "geo_story",
  ],

  dna: [
    "cinematic",
  ],

  payload: {},
};