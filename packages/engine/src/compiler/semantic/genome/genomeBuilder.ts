/** Compatibility facade: Super Cog is the canonical genome authority. */

import { compileSuperCogExperience } from "../../../experience/superCog.js";
import type { ExperienceGenome } from "@qre/contracts";

export function buildExperienceGenome(prompt: string): ExperienceGenome {
  return compileSuperCogExperience(prompt).genome;
}

export const genomeBuilder = buildExperienceGenome;
