/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT CONTRACT
 * =====================================================
 *
 * Genome
 *      ↓
 * Blueprint
 *      ↓
 * Flow
 *      ↓
 * Runtime
 *
 * Blueprint is the composed experience.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */

import type { ExperienceTone } from "./tone.js";
import type { ExperienceType } from "./experienceType.js";
import type { ExperienceMoment } from "./moment.js";
import type { ExperienceEntities } from "./entityExtractor.js";
import type { ExperienceMeaning } from "./meaning.js";
import type { CognitiveExperiencePlan } from "./cognition.js";

export type ExperienceBlueprint = {
  title: string;
  type: ExperienceType;
  tone: readonly ExperienceTone[];
  meaning: ExperienceMeaning;
  moments: ExperienceMoment[];
  entities: ExperienceEntities;

  /** Cognitive design discovered before runtime compilation. */
  cognitivePlan?: CognitiveExperiencePlan;

  /** Optional semantic metadata. NEVER used as compiler logic. */
  metadata?: {
    archetypes?: string[];
    themes?: string[];
    dna?: string[];
  };
};
