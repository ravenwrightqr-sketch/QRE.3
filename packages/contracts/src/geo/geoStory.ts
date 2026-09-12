import type { MediaAsset } from "../media/media.js";

export type GeoLocation = {
  lat: number;
  lng: number;
  label?: string;
  city?: string;
  region?: string;
  country?: string;
};

export type GeoStorySceneType = "intro" | "arrival" | "presence" | "return" | "exit";

export type GeoStoryScene = {
  id: string;
  type: GeoStorySceneType;
  title: string;
  description: string;
  location?: GeoLocation;
  timestamp: string;
  intensity: number;
  media?: MediaAsset[];
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
  meta?: Record<string, unknown>;
};