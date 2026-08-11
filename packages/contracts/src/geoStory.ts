/**
 * UNIVERSAL GEO STORY CONTRACT
 *
 * Physical coordinates are authoritative when present. When a prompt names a
 * place but no coordinates exist, QRE may still create a semantic geo scene
 * without fabricating latitude/longitude.
 */

import type { MediaAsset } from "./media.js";

export type GeoLocation = {
  lat?: number;
  lng?: number;
  label?: string;
  city?: string;
  region?: string;
  country?: string;
};

export type GeoStorySceneType =
  | "intro"
  | "arrival"
  | "presence"
  | "return"
  | "exit"
  | "semantic_place"
  | "memory_place";

export type GeoStoryScene = {
  id: string;
  type: GeoStorySceneType;
  title: string;
  description: string;
  location?: GeoLocation;
  timestamp: string;
  intensity: number;
  media?: MediaAsset[];
  /** Physical GPS evidence vs semantic place evidence. */
  evidenceMode?: "physical" | "semantic" | "mixed";
  /** Prompt/memory/event terms that caused the scene to exist. */
  evidence?: string[];
  meta?: Record<string, unknown>;
};

export type GeoStory = {
  assetId: string;
  sessionId?: string;
  title?: string;
  summary: string;
  scenes: GeoStoryScene[];
  startedAt?: string;
  endedAt?: string;
  mode?: "physical" | "semantic" | "mixed" | "none";
  /** Stable place/entity labels useful to memory and analytics. */
  placeTags?: string[];
  meta?: Record<string, unknown>;
};
