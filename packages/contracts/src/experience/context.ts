import type { ExperienceGoal } from "./goal.js";
import type { ExperienceEntities } from "../reality/entityExtractor.js";
import type { ExperienceIndustry } from "./industry.js";
import type { ExperienceTone } from "./tone.js";

export type ExperienceContext = {
  prompt: string;
  entities: ExperienceEntities;
  assetCategory?: string;
  audience?: string;
  purpose?: string;
  desiredOutcome?: string;
  suggestedIndustry?: ExperienceIndustry;
  suggestedGoal?: ExperienceGoal;
  suggestedTone?: ExperienceTone[];
  constraints?: string[];
};
