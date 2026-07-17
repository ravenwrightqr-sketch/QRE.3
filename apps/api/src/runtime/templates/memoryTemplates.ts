export type MemoryTemplate =
  | "TIME_CAPSULE_COUPLE"
  | "WEDDING_STORY"
  | "EVENT_RAVE"
  | "BUSINESS_STORY"
  | "PET_ADOPTION"
  | "PERSONAL_MEMORY";

export const memoryTemplates = {
  TIME_CAPSULE_COUPLE: {
    title: "The Story of Us",
    tone: "emotional cinematic journey",
    structure: ["meeting", "moments", "growth", "memory points", "future"],
  },

  WEDDING_STORY: {
    title: "Forever Begins Here",
    tone: "romantic cinematic",
    structure: ["arrival", "ceremony", "emotion peaks", "celebration", "closure"],
  },

  EVENT_RAVE: {
    title: "One Night Universe",
    tone: "high energy immersive",
    structure: ["arrival", "build-up", "peak energy", "memory fragments", "exit"],
  },

  PET_ADOPTION: {
    title: "Rescue Story",
    tone: "heartwarming cinematic",
    structure: ["intro", "personality reveal", "location reveal", "call to action"],
  },
};