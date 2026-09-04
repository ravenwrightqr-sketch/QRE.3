import type { ExperienceMoment } from "../experience/moment.js";

export type CinematicSceneType =
  | "intro"
  | "system"
  | "emotion"
  | "action"
  | "memory"
  | "cta";

export type SceneTransition =
  | "fade"
  | "slide"
  | "zoom"
  | "cinematic"
  | "flash"
  | "none";

export type SceneAudio = {
  url: string;
  type: "music" | "voice" | "ambient";
  volume?: number;
  autoplay?: boolean;
};

export type CinematicScene = {
  id: string;
  type: CinematicSceneType;
  duration: number;
  moment: ExperienceMoment;
  order?: number;
  transition?: SceneTransition;
  audio?: SceneAudio;
  preload?: boolean;
  meta?: Record<string, unknown>;
};