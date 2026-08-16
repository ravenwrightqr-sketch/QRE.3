/**
 * STATUS: CANONICAL CINEMATIC RUNTIME CONTRACT
 * Pipeline: ExperienceMoment -> CinematicScene -> Player.
 */
import type { ExperienceMoment } from "./experience/moment.js";

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

export type SceneVisual = {
  background?: string;
  animation?:
    | "none"
    | "slow_zoom"
    | "parallax"
    | "particles"
    | "glitch";
  theme?: "dark" | "light" | "cinematic" | "glass";
};

export type CinematicScene = {
  id: string;
  type: CinematicSceneType;
  duration: number;
  moment: ExperienceMoment;
  order?: number;
  transition?: SceneTransition;
  audio?: SceneAudio;
  visual?: SceneVisual;
  preload?: boolean;
  meta?: Record<string, unknown>;
};