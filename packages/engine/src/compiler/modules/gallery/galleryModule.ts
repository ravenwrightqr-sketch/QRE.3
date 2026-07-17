import type { ExperienceModule } from "../types.js";

export const galleryModule: ExperienceModule = {
  id: "gallery",

  name: "Gallery",

  description: "Photos and media collections.",

  category: "media",

  moments: [
    "photos",
    "video",
  ],

  features: [
    "photo_gallery",
    "video_gallery",
    "fullscreen",
    "slideshow",
  ],

  dna: [
    "cinematic",
  ],

  payload: {},
};