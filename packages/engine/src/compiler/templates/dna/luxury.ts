import type { ExperienceTone } from "@qre/contracts";

export const luxuryDNA = {
  id: "luxury",

  tone: "professional" satisfies ExperienceTone,

  pacing: "slow",

  attentionCurve: "steady",

  animationStyle: "elegant",

  ctaStyle: "subtle",

  transitions: [
    "fade",
    "glass",
    "parallax",
    "slow_zoom",
  ],

  language: [
    "premium",
    "crafted",
    "exclusive",
    "curated",
    "signature",
    "bespoke",
    "timeless",
    "elevated",
  ],
} as const;