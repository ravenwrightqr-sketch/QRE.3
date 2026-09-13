import type { GeoStory } from "../geo/geoStory.js";
import type { SequencePlay } from "../sequence/sequencePlay.js";
import type { ExperienceMoment } from "../experience/moment.js";

export type StoryDeliveryInput = {
  assetId: string;
  sessionId: string;
  userId?: string | null;
  moments: ExperienceMoment[];
  geoStory: GeoStory | null;
  sequence: SequencePlay | null;
};

export type StoryDeliveryResult = {
  storyId: string;
  shareUrl: string;
  delivered: boolean;
};
