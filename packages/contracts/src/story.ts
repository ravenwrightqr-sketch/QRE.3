import { GeoStory } from "./geoStory.js";
import { CinematicScene } from "./index.js";
import { Moment } from "./moment.js";

export type StoryDeliveryInput = {
  assetId: string;
  sessionId: string;
  userId?: string | null;

  moments: Moment[];
  geoStory: GeoStory | null;
  cinematicScenes: CinematicScene[];
};


export type StoryDeliveryResult = {
  storyId: string;
  shareUrl: string;
  delivered: boolean;
};