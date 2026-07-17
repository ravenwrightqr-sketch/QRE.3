import type { ExperienceTone } from "@qre/contracts";

export const viralDNA = {
  id: "viral",

  tone: "playful" satisfies ExperienceTone,

  pacing: "fast",

  attentionCurve: "explosive",

  animationStyle: "dynamic",

  ctaStyle: "high_energy",

  transitions: [
    "snap",
    "flash",
    "zoom",
    "swipe",
  ],

  language: [
    "share",
    "discover",
    "wow",
    "limited",
    "exclusive",
    "surprise",
    "challenge",
    "unlock",
  ],
} as const;