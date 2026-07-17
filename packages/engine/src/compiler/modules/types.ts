/**
 * =====================================================
 * QRE EXPERIENCE MODULE CONTRACT
 * =====================================================
 *
 * Reusable building blocks.
 *
 * Industries compose modules.
 * Modules create moments.
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export type ExperienceModule = {

  id: string;


  name: string;


  description: string;


  category:
    | "identity"
    | "story"
    | "media"
    | "location"
    | "commerce"
    | "education"
    | "reward"
    | "safety"
    | "social";


  moments:
    ExperienceMomentType[];


  features:
    string[];


  dna?: string[];


  payload:
    Record<string, unknown>;

};