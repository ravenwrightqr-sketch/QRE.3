import type { ExperienceModule } from "../types.js";

export const guestbookModule: ExperienceModule = {
  id: "guestbook",

  name: "Guestbook",

  description: "Collect visitor memories and messages.",

  category: "social",

  moments: [
    "guestbook",
    "guest_messages",
  ],

  features: [
    "comments",
    "voice_messages",
    "photos",
    "reactions",
  ],

  dna: [
    "emotional",
  ],

  payload: {},
};