import type {
  GeoStory,
} from "./geoStory.js";

import type {
  CinematicScene,
} from "./cinematic.js";

import type {
  ExperienceMoment,
} from "./index.js";


export type StoryDeliveryInput = {

  assetId:string;

  sessionId:string;

  userId?:string|null;

  moments:ExperienceMoment[];

  geoStory:GeoStory|null;

  cinematicScenes:CinematicScene[];

};


export type StoryDeliveryResult = {

  storyId:string;

  shareUrl:string;

  delivered:boolean;

};