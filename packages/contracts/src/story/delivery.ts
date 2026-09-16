import type { GeoStory } from "../geo/geoStory.js";
import type { CinematicScene } from "../cinematic/cinematic.js";
import type { ExperienceMoment } from "../experience/moment.js";

export type StoryDeliveryInput = {
  assetId: string;
  sessionId: string;
  userId?: string | null;
  moments: ExperienceMoment[];
  geoStory: GeoStory | null;
  cinematicScenes: CinematicScene[];
};

export type StoryDeliveryResult = {
  storyId: string;
  shareUrl: string;
  delivered: boolean;
};
