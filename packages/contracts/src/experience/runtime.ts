import type { ExperienceMoment } from "./moment.js";
import type { GeoStory } from "../geoStory.js";
import type { CinematicScene } from "../cinematic.js";
import type { MemorySnapshot } from "../memorySnapshot.js";
import type { ServiceReceipt } from "../serviceReceipt.js";
import type { TheState } from "../theState.js";

export type ExperienceAccess = "DEMO" | "UNLOCKED";

export type AssetSummary = {
  id: string;
  slug: string;
  title?: string;
  category?: string;
  accountId: string | null;
  paid: boolean;
  status?: "ACTIVE" | "DISABLED" | "ARCHIVED";
};

export type ExperiencePlayerConfig = {
  autoplay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  theme?: "dark" | "light" | "glass" | "cinematic";
  transition?: "fade" | "cinematic" | "slide";
};

export type ExperienceMediaManifest = {
  images: string[];
  videos: string[];
  audio: string[];
};

/** STATUS: CANONICAL EXPERIENCE RUNTIME */
export type Experience = {
  sessionId: string | null;
  access: ExperienceAccess;
  preview: boolean;
  asset: AssetSummary | null;
  state: TheState | null;
  moments: ExperienceMoment[];
  geoStory: GeoStory | null;
  cinematicScenes: CinematicScene[];
  memorySnapshot: MemorySnapshot | null;
  receipt: ServiceReceipt | null;
  media?: ExperienceMediaManifest;
  player?: ExperiencePlayerConfig;
  insights: unknown[];
  meta?: Record<string, unknown>;
  timestamp: string;
};
