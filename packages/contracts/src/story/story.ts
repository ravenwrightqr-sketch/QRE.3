import type { ExperienceTone } from "../experience/tone.js";
import type { CognitiveBeatDirective } from "../cognition/cognition.js";

export type StoryEvidenceKind = "observed" | "inferred" | "playful";
export type StoryBeatKind =
  | "orientation" | "hook" | "need" | "threshold" | "origin" | "encounter" | "challenge" | "discovery" | "reveal" | "instruction"
  | "action" | "feedback" | "contribution" | "escalation" | "transformation" | "reflection" | "provenance" | "identity" | "milestone"
  | "unlock" | "payoff" | "earned_access" | "next_step" | "continuation";

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
  directive?: CognitiveBeatDirective;
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
  audio?: { mood?: string; type: "ambient" | "music" | "voice" };
  provenance: StoryProvenance[];
};
