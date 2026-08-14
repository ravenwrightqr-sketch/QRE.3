/**
 * QRE EXPERIENCE BLUEPRINT CONTRACT
 */

import type { ExperienceTone } from "./tone.js";
import type { ExperienceType } from "./experienceType.js";
import type { ExperienceMoment } from "./moment.js";
import type { ExperienceEntities } from "./entityExtractor.js";
import type { ExperienceMeaning } from "./meaning.js";
import type { CognitiveExperiencePlan } from "./cognition.js";
import type { SponsorPolicy } from "./sponsor.js";

export type ExperienceBlueprint = {
  title: string;
  type: ExperienceType;
  tone: readonly ExperienceTone[];
  meaning: ExperienceMeaning;
  moments: ExperienceMoment[];
  entities: ExperienceEntities;
  cognitivePlan?: CognitiveExperiencePlan;
  sponsor?: SponsorPolicy;
  metadata?: {
    archetypes?: string[];
    themes?: string[];
    dna?: string[];
  };
};
