import type { ExperienceEntities } from "../reality/entityExtractor.js";
import type { ExperienceMeaning } from "../cognition/meaning.js";
import type { SemanticInterpretation } from "../cognition/semantic.js";

export type ExperienceEnergy = "calm" | "intense" | "playful" | "mysterious" | "emotional" | "premium";
export type ExperiencePacing = "slow" | "medium" | "fast";
export type ExperienceSocial = "solo" | "shared" | "community";
export type ExperienceJourney = "arrival" | "discovery" | "reveal" | "transformation" | "peak" | "memory" | "share" | "return";
export type ExperienceRelationship = {
  subject: string;
  predicate: "met_at" | "belongs_to" | "created_by" | "performed_at" | "favorite" | "celebrates" | "remembered_at" | "visited" | "shared_with" | "located_at";
  object: string;
  confidence: number;
};

export interface ExperienceGenome {
  intent: string[];
  interpretation: SemanticInterpretation;
  archetypes: string[];
  themes: string[];
  emotions: string[];
  meaning: ExperienceMeaning;
  relationships: ExperienceRelationship[];
  energy: ExperienceEnergy;
  pacing: ExperiencePacing;
  social: ExperienceSocial;
  journey: ExperienceJourney[];
  discovery: number;
  memory: number;
  commerce: number;
  immersion: number;
  interaction: number;
  replay: number;
  entities: ExperienceEntities;
  environments: string[];
  audience: string[];
  dna: string[];
}
