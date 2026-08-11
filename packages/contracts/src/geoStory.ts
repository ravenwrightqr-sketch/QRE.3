/**
 * UNIVERSAL GEO STORY CONTRACT
 *
 * Physical coordinates are authoritative when present. When a prompt names a
 * place but no coordinates exist, QRE may still create a semantic geo scene
 * without fabricating latitude/longitude.
 */

import type { MediaAsset } from "./media.js";

export type GeoLocation = {
  lat: number;
  lng: number;
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
  evidenceMode?: "physical" | "semantic" | "mixed";
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
  placeTags?: string[];
  meta?: Record<string, unknown>;
};
