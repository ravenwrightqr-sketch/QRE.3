import type { Moment } from "../moment.js";
import type { GeoStory } from "../geoStory.js";
import type { CinematicScene } from "../cinematic.js";
import type { MemorySnapshot } from "../memorySnapshot.js";
import type { ServiceReceipt } from "../serviceReceipt.js";
import type { ExperienceAnalytics } from "../analytics.js";

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

export type Experience = {
  sessionId: string | null;
  access: ExperienceAccess;
  preview: boolean;
  asset: AssetSummary | null;
  moments: Moment[];
  /** Always present after compilation; physical, semantic, mixed, or none. */
  geoStory: GeoStory;
  cinematicScenes: CinematicScene[];
  /** Always present after compilation, including preview experiences. */
  memorySnapshot: MemorySnapshot;
  receipt: ServiceReceipt | null;
  media?: ExperienceMediaManifest;
  player?: ExperiencePlayerConfig;
  insights: unknown[];
  /** Typed behavioral summary carried with the runtime artifact. */
  analytics: ExperienceAnalytics;
  meta?: Record<string, unknown>;
  timestamp: string;
};
