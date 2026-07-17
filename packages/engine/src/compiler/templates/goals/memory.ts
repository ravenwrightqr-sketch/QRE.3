import type {
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const memoryGoal = {

  goal:
    "memory" satisfies ExperienceGoal,

preferredMoments:

[
  "welcome",

  "introduction",

  "location",

  "meeting",

  "story",

  "photos",

  "memory",

  "highlights",

  "future",

  "replay",



    ] satisfies ExperienceMomentType[],


} as const;