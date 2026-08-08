/** QRE story compiler contract. Story is generated from evidence and affordances, not templates. */

import type { ExperienceTone } from "./tone.js";

export type StoryEvidenceKind = "observed" | "inferred" | "playful";

export type StoryBeatKind =
  | "orientation"
  | "hook"
  | "encounter"
  | "escalation"
  | "discovery"
  | "transformation"
  | "payoff"
  | "reflection"
  | "continuation";

export type StoryProvenance = {
  kind: StoryEvidenceKind;
  source?: string;
  confidence: number;
};

export type StoryBeat = {
  id: string;
  kind: StoryBeatKind;
  order: number;
  purpose: string;
  text: string;
  emotionalTarget?: string;
  entities: string[];
  provenance: StoryProvenance[];
};

export type ExperienceStory = {
  title: string;
  hook: string;
  logline: string;
  beats: StoryBeat[];
  ending: string;
  continuation?: string;
  tone: ExperienceTone[];
  provenance: StoryProvenance[];
};

export type StoryScenePlan = {
  id: string;
  order: number;
  beatId: string;
  purpose: string;
  text: string;
  emotionalTarget?: string;
  entities: string[];
  duration: number;
  transition: "none" | "fade" | "slide" | "zoom" | "cinematic" | "flash";
  visual: {
    theme: "dark" | "light" | "cinematic" | "glass";
    animation: "none" | "slow_zoom" | "parallax" | "particles" | "glitch";
  };
  audio?: { mood?: string; type: "ambient" | "music" | "voice" };
  provenance: StoryProvenance[];
};
