/**
 * ============================================================
 * QRE UNIVERSAL STORY CONTRACT
 * ============================================================
 *
 * Story beats are semantic narrative operations, not industry templates.
 * The cognitive compiler may select any of these operations when realizing
 * a prompt. Contracts therefore describe the complete universal vocabulary
 * used by cognition -> realization -> runtime.
 *
 * ============================================================
 */

import type { ExperienceTone } from "./tone.js";
import type { CognitiveBeatDirective } from "./cognition.js";

export type StoryEvidenceKind = "observed" | "inferred" | "playful";

/**
 * Universal narrative / experiential operations.
 *
 * The original runtime vocabulary remains intact. Additional operations are
 * first-class because the cognitive plan can legitimately produce utility,
 * game, discovery, memory, social, commerce, identity, progression, access,
 * and continuation structures without forcing them through generic beats.
 */
export type StoryBeatKind =
  | "orientation"
  | "hook"
  | "need"
  | "threshold"
  | "origin"
  | "encounter"
  | "challenge"
  | "discovery"
  | "reveal"
  | "instruction"
  | "action"
  | "feedback"
  | "contribution"
  | "escalation"
  | "transformation"
  | "reflection"
  | "provenance"
  | "identity"
  | "milestone"
  | "unlock"
  | "payoff"
  | "earned_access"
  | "next_step"
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

  /**
   * Authoritative semantic instruction selected by cognition.
   *
   * Runtime/story structure may carry this directive forward, but downstream
   * language realization must not reinterpret the experience independently.
   */
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
